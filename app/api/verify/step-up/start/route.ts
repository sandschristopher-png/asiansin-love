import { NextResponse } from 'next/server';
import { createClient as createSessionClient } from '@/lib/supabase/server';
import { newChallenge, signStepUp, stepUpDb } from '@/lib/verify/stepUp';
import { reverificationState } from '@/lib/verify/riskFlags';
import { MIN_HOLD_MS, MIN_TOTAL_MS, isTriggerReason, type TriggerReason } from '@/lib/verify/stepUpRules';

export const runtime = 'nodejs';

/** Challenges a member can be issued per hour (a retry is a new challenge); beyond this the check waits. */
const MAX_ISSUED_PER_HOUR = 8;

/**
 * POST { reason?: 'photo_swap' } -> { token, poses, minHoldMs, minTotalMs }
 *
 * Issues a signed (HMAC-SHA256), single-use challenge with 3 random poses from
 * turn_left / turn_right / look_up / look_down (plus a neutral centre capture the client always takes).
 * The reason is never the client's choice beyond two requests a member may make: a primary-photo-swap
 * check, or the "get verified" check (only with a main photo; a verified member may run it again to refresh
 * their review photos, as before). Otherwise a
 * challenge exists only while their account is flagged, and carries the flag's own reason.
 */
export async function POST(req: Request) {
  const session = await createSessionClient();
  const { data: { user } } = await session.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = (await req.json().catch(() => ({}))) as { reason?: unknown };
  const db = stepUpDb();
  const state = await reverificationState(db, user.id);

  let reason: TriggerReason;
  if (body.reason === 'photo_swap') reason = 'photo_swap';
  else if (body.reason === 'verification') {
    const { data: profile } = await db.from('profiles').select('avatar_url, verification_status').eq('id', user.id).maybeSingle();
    if (!profile?.avatar_url) {
      return NextResponse.json({ error: 'Add a clear main profile photo first - verification matches your face against it.', code: 'NEEDS_PHOTO' }, { status: 400 });
    }
    // Already under review: send them to the under-review screen instead of a second request (finish would
    // otherwise reject the first one as "superseded" and push them to the back of the queue). A stale
    // 'pending' flag with no open request behind it must not lock anyone out, so the request row decides.
    if (profile.verification_status === 'pending') {
      const { count: open } = await db
        .from('verification_requests')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .eq('status', 'pending');
      if ((open ?? 0) > 0) {
        return NextResponse.json({ error: 'Your verification is already under review.', code: 'PENDING' }, { status: 409 });
      }
    }
    reason = 'verification';
  } else if (state.required) reason = isTriggerReason(state.reason) ? state.reason : 'manual';
  else return NextResponse.json({ error: 'No identity check is needed right now.', code: 'NOT_REQUIRED' }, { status: 400 });

  const since = new Date(Date.now() - 60 * 60 * 1000).toISOString();
  const { count } = await db.from('liveness_challenges').select('id', { count: 'exact', head: true }).eq('user_id', user.id).gte('created_at', since);
  if ((count ?? 0) >= MAX_ISSUED_PER_HOUR) {
    return NextResponse.json({ error: 'Too many checks. Please try again in a while.', code: 'RATE_LIMITED' }, { status: 429 });
  }

  const challenge = newChallenge(user.id, reason);
  const { error } = await db.from('liveness_challenges').insert({
    user_id: user.id,
    trigger_reason: reason,
    poses_requested: challenge.p,
    nonce: challenge.n,
  });
  if (error) {
    console.error('[step-up/start] could not record the challenge:', error.message);
    return NextResponse.json({ error: 'The identity check is not available yet.', code: 'STEP_UP_UNAVAILABLE' }, { status: 503 });
  }

  return NextResponse.json({ token: signStepUp(challenge), poses: challenge.p, reason, minHoldMs: MIN_HOLD_MS, minTotalMs: MIN_TOTAL_MS });
}
