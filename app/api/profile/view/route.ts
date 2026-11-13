// app/api/profile/view/route.ts
//   POST { viewed_id } -> { logged }
//
// Records a footprint in public.profile_views when a member opens another member's profile
// (the Visitors tab in /favorites and the visit toast in RealtimeNotifier read these rows).
// Ghost Mode: a Plus viewer with profiles.ghost_mode = true leaves no footprint. The flag has no
// effect for a free member, so turning it on without Plus never hides anyone.
import { NextResponse, after } from 'next/server';
import { sendPushToUser } from '@/lib/pushSender';
import { titleForRecipient } from '@/lib/notificationTitles';
import { createClient } from '@supabase/supabase-js';
import { createClient as createSessionClient } from '@/lib/supabase/server';
import { isPlusProfile } from '@/lib/plus';

export const runtime = 'nodejs';

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
/** Repeat visits inside this window count once (refreshes and back-and-forth swipes). */
const REPEAT_WINDOW_MS = 30 * 60 * 1000;

export async function POST(req: Request) {
  const session = await createSessionClient();
  const { data: { user } } = await session.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  let body: { viewed_id?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }
  const viewedId = body.viewed_id;
  if (typeof viewedId !== 'string' || !UUID_RE.test(viewedId)) {
    return NextResponse.json({ error: 'viewed_id is required.' }, { status: 400 });
  }
  if (viewedId === user.id) return NextResponse.json({ logged: false });

  const service = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
    auth: { persistSession: false },
  });

  // Viewer's Plus status (lib/plus.ts reads several optional billing columns, so the whole row)
  // and Ghost Mode (ghost_mode arrives with 20261114_privacy_features.sql; absent = off).
  const { data: me, error: meError } = await service.from('profiles').select('*').eq('id', user.id).maybeSingle();
  if (meError) {
    console.error('[api/profile/view] viewer lookup failed:', meError.message);
    return NextResponse.json({ logged: false });
  }
  if (isPlusProfile(me) && (me as { ghost_mode?: boolean } | null)?.ghost_mode === true) {
    return NextResponse.json({ logged: false, ghost: true });
  }

  const since = new Date(Date.now() - REPEAT_WINDOW_MS).toISOString();
  const [recent, blocks] = await Promise.all([
    service
      .from('profile_views')
      .select('id')
      .eq('viewer_id', user.id)
      .eq('viewed_id', viewedId)
      .gt('created_at', since)
      .limit(1),
    service
      .from('user_blocks')
      .select('blocker_id')
      .or(`and(blocker_id.eq.${user.id},blocked_id.eq.${viewedId}),and(blocker_id.eq.${viewedId},blocked_id.eq.${user.id})`)
      .limit(1),
  ]);
  if ((recent.data?.length ?? 0) > 0 || (blocks.data?.length ?? 0) > 0) {
    return NextResponse.json({ logged: false });
  }

  const { error } = await service.from('profile_views').insert({ viewer_id: user.id, viewed_id: viewedId });
  if (error) {
    console.error('[api/profile/view] insert failed:', error.code, error.message);
    return NextResponse.json({ logged: false });
  }
  // Visit alert for the viewed member, Plus only (Visitor History is a Plus feature).
  after(async () => {
    const { data: owner } = await service.from('profiles').select('*').eq('id', viewedId).maybeSingle();
    if (!isPlusProfile(owner)) return;
    const name = (me as { username?: string | null } | null)?.username || 'Someone';
    const title = await titleForRecipient(service, viewedId, 'visit', name);
    await service.from('notifications').insert({
      user_id: viewedId,
      actor_id: user.id,
      type: 'visit',
      title,
      description: `${name} viewed your profile.`,
      link_url: '/profile/' + user.id,
    });
    await sendPushToUser({ userId: viewedId, type: 'visit', actorId: user.id, body: title, url: '/profile/' + user.id }).catch(() => {});
  });
  return NextResponse.json({ logged: true });
}
