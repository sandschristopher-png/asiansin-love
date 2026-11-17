import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { createClient as createSessionClient } from '@/lib/supabase/server';
import { callUnlockState, missLockUntil, type CallEligibility, type CallEndReason } from '@/lib/callRules';

const isUUID = (v: unknown): v is string =>
  typeof v === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(v);

const isVerified = (p: { is_verified?: boolean | null; verification_status?: string | null } | null | undefined) =>
  p?.is_verified === true || p?.verification_status === 'verified';

/**
 * Can a voice call run between me and ?peer ?
 *   direction=outgoing (default): may I ring them?  (their mute, the 2-miss pause and every safety rule apply)
 *   direction=incoming:           may they ring me? (my own mute and every safety rule apply)
 *
 * The browser enforces the same gates for instant feedback, but signalling is peer to peer, so this is the
 * server-side check the caller runs before ringing and the callee runs before showing a ring.
 * Blocked, muted and quarantined all answer "unavailable" so nothing about the other member leaks.
 */
export async function GET(req: Request) {
  const session = await createSessionClient();
  const { data: { user } } = await session.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const url = new URL(req.url);
  const peer = url.searchParams.get('peer');
  const incoming = url.searchParams.get('direction') === 'incoming';
  if (!isUUID(peer) || peer === user.id) return NextResponse.json({ error: 'Invalid member.' }, { status: 400 });

  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!key) return NextResponse.json({ allowed: false, reason: 'unavailable' } satisfies CallEligibility);
  const db = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, key);

  const deny = (reason: Extract<CallEligibility, { allowed: false }>['reason'], pausedUntil?: number) =>
    NextResponse.json({ allowed: false, reason, ...(pausedUntil ? { pausedUntil } : {}) } satisfies CallEligibility);

  const [blocks, freezes, profiles, mine, theirs, mute, logs, lastFromThem] = await Promise.all([
    db
      .from('user_blocks')
      .select('id')
      .or(`and(blocker_id.eq.${user.id},blocked_id.eq.${peer}),and(blocker_id.eq.${peer},blocked_id.eq.${user.id})`)
      .limit(1),
    db.from('account_freezes').select('user_id').in('user_id', [user.id, peer]).is('cleared_at', null).limit(1),
    db.from('profiles').select('id, is_verified, verification_status').in('id', [user.id, peer]),
    db.from('messages').select('id', { count: 'exact', head: true }).eq('sender_id', user.id).eq('receiver_id', peer).eq('is_quarantined', false),
    db.from('messages').select('id', { count: 'exact', head: true }).eq('sender_id', peer).eq('receiver_id', user.id).eq('is_quarantined', false),
    // Who muted whom: outgoing checks THEIR mute of me, incoming checks MY mute of them.
    incoming
      ? db.from('call_mutes').select('user_id').eq('user_id', user.id).eq('peer_id', peer).limit(1)
      : db.from('call_mutes').select('user_id').eq('user_id', peer).eq('peer_id', user.id).limit(1),
    db
      .from('call_logs')
      .select('ended_at, started_at, end_reason')
      .eq('caller_id', user.id)
      .eq('callee_id', peer)
      .order('started_at', { ascending: false })
      .limit(5),
    db
      .from('messages')
      .select('created_at')
      .eq('sender_id', peer)
      .eq('receiver_id', user.id)
      .eq('is_quarantined', false)
      .order('created_at', { ascending: false })
      .limit(1),
  ]);

  // A table that is not migrated yet (account_freezes, call_mutes, call_logs) just means "no rows".
  if ((blocks.data?.length ?? 0) > 0 || (freezes.data?.length ?? 0) > 0 || (mute.data?.length ?? 0) > 0) return deny('unavailable');

  const byId = new Map((profiles.data ?? []).map((p) => [p.id as string, p]));
  const state = callUnlockState({
    fromMe: mine.count ?? 0,
    fromThem: theirs.count ?? 0,
    meVerified: isVerified(byId.get(user.id)),
    theyVerified: isVerified(byId.get(peer)),
  });
  if (state === 'unverified') return deny('unverified');
  if (state === 'few_messages') return deny('few_messages');

  if (!incoming) {
    const until = missLockUntil(
      (logs.data ?? []).map((l) => ({
        endedAt: new Date((l.ended_at as string | null) ?? (l.started_at as string)).getTime(),
        reason: l.end_reason as CallEndReason,
      })),
      lastFromThem.data?.[0]?.created_at ? new Date(lastFromThem.data[0].created_at as string).getTime() : null,
      Date.now()
    );
    if (until) return deny('paused', until);
  }

  return NextResponse.json({ allowed: true } satisfies CallEligibility);
}
