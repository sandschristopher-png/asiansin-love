// app/api/moments/route.ts
//   GET  ?city=<hub>&before=<iso>  -> { moments, nextCursor }   the feed (RLS hides low-reputation authors and blocks)
//   POST multipart { image, caption?, activityTag, city }       -> { success, id }
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
import { MAX_CAPTION, MAX_MOMENT_BYTES, MOMENT_BUCKET, isMomentCity, isMomentTag, type MomentItem } from '@/lib/moments';

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

const serviceClient = () =>
  createServiceClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, { auth: { persistSession: false } });

export async function GET(req: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized', code: 'UNAUTHORIZED' }, { status: 401 });

  const params = new URL(req.url).searchParams;
  const city = params.get('city');
  const before = params.get('before');

  let q = supabase
    .from('moments')
    .select('id, user_id, image_url, aspect_ratio, caption, activity_tag, city, likes_count, created_at')
    .eq('status', 'active')
    .order('created_at', { ascending: false })
    .limit(PAGE + 1);
  if (isMomentCity(city)) q = q.eq('city', city);
  if (before && !Number.isNaN(Date.parse(before))) q = q.lt('created_at', before);

  const { data: rows, error } = await q;
  if (error) {
    console.error('[api/moments] feed failed:', error.message);
    return NextResponse.json({ error: 'Could not load Moments.', code: 'DB_ERROR' }, { status: 500 });
  }
  const page = (rows || []).slice(0, PAGE);
  const hasMore = (rows || []).length > PAGE;
  const authorIds = Array.from(new Set(page.map((m) => m.user_id)));
  const momentIds = page.map((m) => m.id);

  const [{ data: authors }, { data: likes }] = await Promise.all([
    authorIds.length
      ? supabase
          .from('profiles')
          .select('id, username, age, birthdate, avatar_url, is_verified, verification_status, is_day_one')
          .in('id', authorIds)
      : Promise.resolve({ data: [] as Record<string, unknown>[] }),
    momentIds.length
      ? supabase.from('moment_likes').select('moment_id').eq('user_id', user.id).in('moment_id', momentIds)
      : Promise.resolve({ data: [] as { moment_id: string }[] }),
  ]);
  const byAuthor = new Map((authors || []).map((a: Record<string, unknown>) => [a.id as string, a]));
  const liked = new Set((likes || []).map((l: { moment_id: string }) => l.moment_id));

  const moments: MomentItem[] = page
    .filter((m) => byAuthor.has(m.user_id))
    .map((m) => {
      const a = byAuthor.get(m.user_id)! as Record<string, unknown>;
      return {
        id: m.id,
        userId: m.user_id,
        imageUrl: m.image_url,
        aspectRatio: m.aspect_ratio,
        caption: m.caption,
        activityTag: m.activity_tag,
        city: m.city,
        likesCount: m.likes_count,
        likedByMe: liked.has(m.id),
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
  const activityTag = form.get('activityTag');
  const city = form.get('city');

  if (!isMomentTag(activityTag) || !isMomentCity(city) || caption.length > MAX_CAPTION) {
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
    p_activity_tag: activityTag,
    p_city: city,
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
