// app/api/profile/highlights/route.ts
//   POST { highlights: [{ tag_id, highlight_story }] }  (max 3, stories up to 120 chars)
//
// Server-side screening for profile highlight stories (the "prompts" members answer), then the
// same update_user_highlights RPC the client used to call directly, run as the member (auth.uid()).
// Contact details are masked, payment / commercial terms block the save, and newly introduced
// violations cost reputation (lib/moderation/profilePenalty).
import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { createClient as createSessionClient } from '@/lib/supabase/server';
import { evaluateBioModeration } from '@/lib/moderation';
import { PROFILE_BLOCK_MESSAGE } from '@/lib/moderation/profileModerator';
import { chargeProfileViolations, isBlocked, sanitizedNotice, screenText, type ScreenedText } from '@/lib/moderation/profilePenalty';

export const runtime = 'nodejs';

const MAX_HIGHLIGHTS = 3;
const MAX_STORY_CHARS = 120;

export async function POST(req: Request) {
  const session = await createSessionClient();
  const { data, error: authError } = await session.auth.getUser();
  if (authError || !data?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const userId = data.user.id;

  let body: { highlights?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const list = Array.isArray(body.highlights) ? body.highlights : null;
  if (!list || list.length > MAX_HIGHLIGHTS) {
    return NextResponse.json({ error: `Choose up to ${MAX_HIGHLIGHTS} highlights.` }, { status: 400 });
  }
  const items: { tag_id: string; highlight_story: string }[] = [];
  for (const h of list) {
    const tagId = (h as { tag_id?: unknown })?.tag_id;
    const story = (h as { highlight_story?: unknown })?.highlight_story ?? '';
    if (typeof tagId !== 'string' || !tagId || typeof story !== 'string') {
      return NextResponse.json({ error: 'Invalid highlight.' }, { status: 400 });
    }
    if (story.trim().length > MAX_STORY_CHARS) {
      return NextResponse.json({ error: `Highlight stories can be up to ${MAX_STORY_CHARS} characters.` }, { status: 400 });
    }
    items.push({ tag_id: tagId, highlight_story: story.trim() });
  }

  const service = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
    auth: { persistSession: false },
  });

  // Stored stories, for the "newly introduced" comparison.
  const { data: existing } = await service.from('user_highlights').select('tag_id, highlight_story').eq('user_id', userId);
  const storedByTag = new Map((existing || []).map((r) => [String(r.tag_id), String(r.highlight_story || '')]));

  const screened: ScreenedText[] = [];
  const payload = [];
  for (const item of items) {
    if (!item.highlight_story) {
      payload.push(item);
      continue;
    }
    const s = screenText(`highlight:${item.tag_id}`, item.highlight_story, storedByTag.get(item.tag_id) ?? null);
    if (s.result.violations.length) screened.push(s);
    if (isBlocked(s)) {
      await chargeProfileViolations(service, userId, screened.filter(isBlocked), 'profile_blocked');
      return NextResponse.json({ error: `Highlight story: ${PROFILE_BLOCK_MESSAGE}`, field: item.tag_id }, { status: 422 });
    }
    const verdict = evaluateBioModeration(s.result.sanitizedText);
    if (!verdict.ok) {
      return NextResponse.json({ error: `Highlight story: ${verdict.reason || 'Please revise this text.'}`, field: item.tag_id }, { status: 422 });
    }
    payload.push({ tag_id: item.tag_id, highlight_story: s.result.sanitizedText });
  }

  // Server-only writer (20261110_highlights_rpc_lockdown.sql): runs update_user_highlights as this
  // member. Before that migration exists, fall back to calling it with the member's session.
  let { error } = await service.rpc('server_update_user_highlights', { p_user_id: userId, p_highlights: payload });
  if (error && /server_update_user_highlights|could not find the function|PGRST202/i.test(`${error.code} ${error.message}`)) {
    ({ error } = await session.rpc('update_user_highlights', { p_highlights: payload }));
  }
  if (error) {
    console.error('[api/profile/highlights] save failed:', error.message);
    return NextResponse.json({ error: 'Could not save your highlights.' }, { status: 500 });
  }

  const penalty = screened.length ? await chargeProfileViolations(service, userId, screened, 'profile_sanitized') : 0;
  const masked = screened.filter((s) => s.result.sanitizedText !== s.raw.trim());
  return NextResponse.json({
    success: true,
    ...(masked.length ? { notice: sanitizedNotice(screened), penalty } : {}),
  });
}
