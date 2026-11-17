// app/api/moments/route.ts
//   GET  ?before=<iso>  -> { moments, nextCursor }   the feed (RLS hides low-reputation authors and blocks)
//   POST multipart { image, caption?, vibeTag, prompt?, city, locationToken? } -> { success, id }
//
// Posting is server-side only: the caption goes through the master safety dictionary, the photo is
// checked by its leading bytes and uploaded to moment-photos under the member's own folder, and
// create_moment (service role) enforces verification, reputation and 2 Moments per 24 hours.
import crypto from 'node:crypto';
import { NextResponse, after } from 'next/server';
import { createClient as createServiceClient } from '@supabase/supabase-js';
import { createClient } from '@/lib/supabase/server';
import { notifyAdmins } from '@/lib/adminNotify';
import { ageOf } from '@/lib/age';
import { decideMessageOutcome } from '@/lib/reputation';
import { toList } from '@/lib/rhythm';
import { countryOfCity } from '@/lib/seaLocations';
import { verifyLocationToken } from '@/lib/momentLocation';
import { LEGACY_ACTIVITY_VIBE, MAX_CAPTION, MAX_MOMENT_BYTES, MOMENT_BUCKET, isMomentCity, isMomentPrompt, isVibeTag, sharesVibe, type MomentItem } from '@/lib/moments';

export const runtime = 'nodejs';

const PAGE = 12;
const MIME_EXT: Record<string, string> = { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp' };

/** The browser-supplied MIME type is not trusted: check the file's actual leading bytes. */
function matchesImageSignature(buf: Buffer, mime: string): boolean {
  if (buf.length < 12) return false;
  if (mime === 'image/jpeg') return buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff;
  if (mime === 'image/png') return buf.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]));
  if (mime === 'image/webp') return buf.toString('ascii', 0, 4) === 'RIFF' && buf.toString('ascii', 8, 12) === 'WEBP';
  return false;
}

/** Columns the feed needs from 20261123_moments.sql, plus what 20261125_moments_vibes.sql adds. */
const BASE_COLUMNS = 'id, user_id, image_url, aspect_ratio, caption, city, likes_count, created_at';
const FULL_COLUMNS = `${BASE_COLUMNS}, vibe_tag, prompt_question, location_verified`;
const LEGACY_COLUMNS = `${BASE_COLUMNS}, activity_tag`;

interface MomentRow {
  id: string;
  user_id: string;
  image_url: string;
  aspect_ratio: string;
  caption: string | null;
  city: string;
  likes_count: number;
  created_at: string;
  vibe_tag?: string | null;
  prompt_question?: string | null;
  location_verified?: boolean | null;
  activity_tag?: string | null;
}

/**
 * PostgREST / Postgres errors that mean "the schema is behind the code": a column or table that does
 * not exist yet (42703, 42P01) or is missing from PostgREST's schema cache (PGRST204, PGRST205, PGRST200).
 * Those degrade to an older query or an empty feed; any other error is a real failure.
 */
function isSchemaMismatch(error: { code?: string; message?: string }): boolean {
  return ['42703', '42P01', 'PGRST204', 'PGRST205', 'PGRST200'].includes(String(error.code || ''));
}

const serviceClient = () =>
  createServiceClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, { auth: { persistSession: false } });

export async function GET(req: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized', code: 'UNAUTHORIZED' }, { status: 401 });

  const params = new URL(req.url).searchParams;
  const before = params.get('before');

  const run = (columns: string) => {
    let q = supabase
      .from('moments')
      .select(columns)
      .eq('status', 'active')
      .order('created_at', { ascending: false })
      .limit(PAGE + 1);
    if (before && !Number.isNaN(Date.parse(before))) q = q.lt('created_at', before);
    return q;
  };

  // Full query first; if 20261125_moments_vibes.sql has not been run (or PostgREST has not reloaded its
  // schema yet) retry with the original columns, and if even those are missing show an empty feed.
  let result = await run(FULL_COLUMNS);
  if (result.error) {
    console.error('[moments:get]', result.error);
    if (isSchemaMismatch(result.error)) {
      result = await run(LEGACY_COLUMNS);
      if (result.error) console.error('[moments:get] fallback', result.error);
    }
  }
  if (result.error) {
    if (isSchemaMismatch(result.error)) return NextResponse.json({ moments: [], nextCursor: null });
    return NextResponse.json({ error: 'Could not load Moments.', code: 'DB_ERROR' }, { status: 500 });
  }
  const rows = (result.data || []) as unknown as MomentRow[];
  const page = rows.slice(0, PAGE);
  const hasMore = rows.length > PAGE;
  const authorIds = Array.from(new Set(page.map((m) => m.user_id)));
  const momentIds = page.map((m) => m.id);

  const [{ data: authors }, { data: likes }, { data: viewer }] = await Promise.all([
    authorIds.length
      ? supabase
          .from('profiles')
          .select('id, username, age, birthdate, avatar_url, is_verified, verification_status, is_day_one')
          .in('id', authorIds)
      : Promise.resolve({ data: [] as Record<string, unknown>[] }),
    momentIds.length
      ? supabase.from('moment_likes').select('moment_id').eq('user_id', user.id).in('moment_id', momentIds)
      : Promise.resolve({ data: [] as { moment_id: string }[] }),
    supabase.from('profiles').select('interests').eq('id', user.id).maybeSingle(),
  ]);
  const myInterests = toList(viewer?.interests);
  const byAuthor = new Map((authors || []).map((a: Record<string, unknown>) => [a.id as string, a]));
  const liked = new Set((likes || []).map((l: { moment_id: string }) => l.moment_id));

  const moments: MomentItem[] = page
    .filter((m) => byAuthor.has(m.user_id))
    .map((m) => {
      const a = byAuthor.get(m.user_id)! as Record<string, unknown>;
      // Rows from before the vibes migration only have the old activity tag: map it onto a vibe.
      const vibe = isVibeTag(m.vibe_tag) ? m.vibe_tag : LEGACY_ACTIVITY_VIBE[m.activity_tag ?? ''] ?? null;
      return {
        id: m.id,
        userId: m.user_id,
        imageUrl: m.image_url,
        aspectRatio: m.aspect_ratio,
        caption: m.caption,
        vibeTag: vibe,
        prompt: isMomentPrompt(m.prompt_question) ? m.prompt_question : null,
        city: m.city,
        country: countryOfCity(m.city),
        likesCount: m.likes_count,
        likedByMe: liked.has(m.id),
        locationVerified: m.location_verified === true,
        sharedVibe: m.user_id !== user.id && vibe !== null && sharesVibe(myInterests, vibe),
        createdAt: m.created_at,
        isMine: m.user_id === user.id,
        author: {
          id: m.user_id,
          username: typeof a.username === 'string' && a.username && !a.username.startsWith('user_') ? a.username : 'Member',
          age: ageOf(a as { age?: unknown; birthdate?: unknown }),
          avatarUrl: (a.avatar_url as string | null) ?? null,
          verified: a.is_verified === true || a.verification_status === 'verified',
          founding: a.is_day_one === true,
        },
      };
    });

  return NextResponse.json({ moments, nextCursor: hasMore ? page[page.length - 1].created_at : null });
}

export async function POST(req: Request) {
  const session = await createClient();
  const { data: { user } } = await session.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized', code: 'UNAUTHORIZED' }, { status: 401 });

  if (!(req.headers.get('content-type') || '').includes('multipart/form-data')) {
    return NextResponse.json({ error: 'Invalid request.', code: 'INVALID_INPUT' }, { status: 400 });
  }
  const form = await req.formData();
  const file = form.get('image') as File | null;
  const caption = String(form.get('caption') ?? '').replace(/\s+/g, ' ').trim();
  const vibeTag = form.get('vibeTag');
  const promptRaw = form.get('prompt');
  const prompt = promptRaw === null || promptRaw === '' ? null : promptRaw;
  const city = form.get('city');
  const locationToken = typeof form.get('locationToken') === 'string' ? String(form.get('locationToken')) : '';

  if (!isVibeTag(vibeTag) || !isMomentCity(city) || (prompt !== null && !isMomentPrompt(prompt)) || caption.length > MAX_CAPTION) {
    return NextResponse.json({ error: 'Invalid Moment.', code: 'INVALID_INPUT' }, { status: 400 });
  }
  if (!file || typeof file === 'string' || !MIME_EXT[file.type]) {
    return NextResponse.json({ error: 'Unsupported photo.', code: 'UNSUPPORTED_FILE_TYPE' }, { status: 415 });
  }
  if (file.size > MAX_MOMENT_BYTES) {
    return NextResponse.json({ error: 'Photo too large.', code: 'FILE_TOO_LARGE' }, { status: 413 });
  }
  const bytes = Buffer.from(await file.arrayBuffer());
  if (!matchesImageSignature(bytes, file.type)) {
    return NextResponse.json({ error: 'Unsupported photo.', code: 'UNSUPPORTED_FILE_TYPE' }, { status: 415 });
  }

  const admin = serviceClient();

  // Held for review after a zero-tolerance hit (account_freezes is server-only).
  const { data: freeze } = await admin.from('account_freezes').select('user_id').eq('user_id', user.id).is('cleared_at', null).maybeSingle();
  if (freeze) return NextResponse.json({ error: 'Your account is under review.', code: 'ACCOUNT_UNDER_REVIEW' }, { status: 403 });

  // Caption screening: the same dictionary and reputation numbers as chat. A public caption never
  // publishes with a warning, so anything but a clean result is refused.
  if (caption) {
    const decision = decideMessageOutcome(caption, false);
    if (decision.outcome !== 'deliver') {
      if (decision.deduction > 0) {
        const { error: penaltyError } = await admin.rpc('apply_moderation_penalty', {
          p_user_id: user.id,
          p_deduction: decision.deduction,
          p_action: decision.outcome === 'hard_block' ? 'hard_block' : 'moment_caption',
          p_category: decision.category,
          p_flagged: decision.flagged.join(' | ').slice(0, 300),
        });
        if (penaltyError) console.error('[api/moments] penalty failed:', penaltyError.message);
      }
      if (decision.outcome === 'hard_block') {
        await admin
          .from('account_freezes')
          .upsert({ user_id: user.id, reason: `zero_tolerance (Moment caption): ${decision.flagged.join(' | ').slice(0, 160)}`, source: 'filter', cleared_at: null }, { onConflict: 'user_id' });
        after(() => notifyAdmins({ kind: 'moderation', ref: user.id, actorId: user.id }));
        return NextResponse.json({ error: "This can't be posted.", code: 'SAFETY_BLOCKED' }, { status: 403 });
      }
      return NextResponse.json({ error: "This caption can't be posted.", code: 'MOMENT_CAPTION_REJECTED' }, { status: 422 });
    }
  }

  const path = `${user.id}/${crypto.randomUUID()}.${MIME_EXT[file.type]}`;
  const { error: uploadError } = await admin.storage.from(MOMENT_BUCKET).upload(path, bytes, { contentType: file.type, upsert: false });
  if (uploadError) {
    console.error('[api/moments] upload failed:', uploadError.message);
    return NextResponse.json({ error: 'Upload failed.', code: 'DB_ERROR' }, { status: 500 });
  }
  const { data: publicUrl } = admin.storage.from(MOMENT_BUCKET).getPublicUrl(path);

  const { data: id, error: rpcError } = await admin.rpc('create_moment', {
    p_user_id: user.id,
    p_image_url: publicUrl.publicUrl,
    p_aspect_ratio: '4:5',
    p_caption: caption || null,
    p_vibe_tag: vibeTag,
    p_prompt: prompt,
    p_city: city,
    p_location_verified: Boolean(locationToken) && verifyLocationToken(locationToken, user.id, city),
  });
  if (rpcError) {
    await admin.storage.from(MOMENT_BUCKET).remove([path]);
    const text = rpcError.message || '';
    if (/MOMENT_VERIFICATION_REQUIRED/.test(text)) return NextResponse.json({ error: 'Verification required.', code: 'MOMENT_VERIFICATION_REQUIRED' }, { status: 403 });
    if (/MOMENT_RATE_LIMIT/.test(text)) return NextResponse.json({ error: 'Daily limit reached.', code: 'MOMENT_RATE_LIMIT' }, { status: 429 });
    if (/MOMENT_LOW_REPUTATION/.test(text)) return NextResponse.json({ error: 'Reputation too low.', code: 'MOMENT_LOW_REPUTATION' }, { status: 403 });
    console.error('[api/moments] create failed:', text);
    return NextResponse.json({ error: 'Could not post.', code: 'DB_ERROR' }, { status: 500 });
  }

  return NextResponse.json({ success: true, id });
}
