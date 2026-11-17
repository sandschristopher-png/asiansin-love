// POST /api/moments/:id/like -> { liked, likesCount }   toggles through the atomic RPC.
import { NextResponse } from 'next/server';
import { after } from 'next/server';
import { createClient as createAdmin } from '@supabase/supabase-js';
import { createClient } from '@/lib/supabase/server';
import { sendPushToUser } from '@/lib/pushSender';

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function POST(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  if (!UUID_RE.test(id)) return NextResponse.json({ error: 'Invalid id', code: 'INVALID_INPUT' }, { status: 400 });
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized', code: 'UNAUTHORIZED' }, { status: 401 });

  const { data, error } = await supabase.rpc('toggle_moment_like', { p_moment_id: id });
  if (error) {
    if (/MOMENT_NOT_FOUND/.test(error.message)) return NextResponse.json({ error: 'Not found', code: 'NOT_FOUND' }, { status: 404 });
    console.error('[api/moments/like] failed:', error.message);
    return NextResponse.json({ error: 'Could not update.', code: 'DB_ERROR' }, { status: 500 });
  }
  const liked = Boolean(data?.liked);
  if (liked) after(() => notifyMomentLike(id, user.id)); // a like (never an unlike) tells the owner
  return NextResponse.json({ liked, likesCount: Number(data?.likes_count ?? 0) });
}

/** One notification per liker per Moment: unliking and liking again does not repeat it. Best effort. */
async function notifyMomentLike(momentId: string, likerId: string) {
  try {
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!key) return;
    const db = createAdmin(process.env.NEXT_PUBLIC_SUPABASE_URL!, key, { auth: { persistSession: false } });
    const { data: moment } = await db.from('moments').select('user_id').eq('id', momentId).maybeSingle();
    const ownerId = moment?.user_id as string | undefined;
    if (!ownerId || ownerId === likerId) return;
    const ref = `/moments#${momentId}`;
    const { data: prior } = await db.from('notifications').select('id').eq('user_id', ownerId).eq('actor_id', likerId).eq('type', 'moment_like').eq('link_url', ref).limit(1);
    if (prior && prior.length > 0) return;
    const { data: actor } = await db.from('profiles').select('username').eq('id', likerId).maybeSingle();
    const name = String(actor?.username ?? 'Someone').replace(/^@+/, '');
    // link_url doubles as the once-per-liker reference and the row's destination.
    await db.from('notifications').insert({ user_id: ownerId, actor_id: likerId, type: 'moment_like', title: `${name} liked your Moment`, description: 'Tap to see your Moments.', link_url: ref, is_read: false });
    await sendPushToUser({ userId: ownerId, type: 'moment_like', actorId: likerId, body: `${name} liked your Moment`, tag: ref });
  } catch (err) {
    console.warn('[api/moments/like] notification failed:', err);
  }
}
