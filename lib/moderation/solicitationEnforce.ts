import type { SupabaseClient } from '@supabase/supabase-js';
import { detectSolicitation } from '@/lib/moderation/solicitationFilter';
import { isHiddenFromFeeds, STRIKE_MESSAGES } from '@/lib/moderation/strikeRules';

/**
 * Server side of the three-strike anti-solicitation rule (profile text and Moment captions). The state and the atomic
 * step live in supabase/migrations/20261202_solicitation_strikes.sql; detection and the numbers in solicitationFilter.
 */

export interface Blocked {
  status: number;
  body: { error: string; code: string; strikes?: number; visibility?: string };
}

type Db = SupabaseClient;
/** Anything with the one session call used to end a banned member's session (the cookie-bound server client). */
type SessionEnder = { auth: { signOut: () => Promise<unknown> } };

/** Refuses a removed member, and a member whose strike-2 hold is still running (bio and Moment editing are locked). */
export async function checkEditAllowed(db: Db, userId: string): Promise<Blocked | null> {
  const { data } = await db.from('profiles').select('visibility_status, edit_locked_until').eq('id', userId).maybeSingle();
  // Before the migration the columns do not exist and the select returns an error: nothing to enforce yet.
  if (!data) return null;
  if (data.visibility_status === 'banned') {
    return { status: 403, body: { error: STRIKE_MESSAGES[3], code: 'ACCOUNT_REMOVED' } };
  }
  if (isHiddenFromFeeds(data)) {
    return { status: 423, body: { error: STRIKE_MESSAGES[2], code: 'EDIT_LOCKED', strikes: 2, visibility: 'held' } };
  }
  return null;
}

/**
 * Screens public text before anything is written. Returns null when the text is fine, otherwise the response to send:
 * the strike is recorded (reputation, hold or removal) and the save is refused, so nothing reaches the database.
 */
export async function enforceSolicitation(db: Db, session: SessionEnder, userId: string, texts: string[]): Promise<Blocked | null> {
  const locked = await checkEditAllowed(db, userId);
  if (locked) return locked;

  const found = texts.map((t) => detectSolicitation(t)).find((v) => v.hit);
  if (!found) return null;

  const { data, error } = await db.rpc('record_solicitation_strike', { p_user_id: userId });
  if (error || !data) {
    // The migration may not be run yet. The text is still refused, with the first-strike wording.
    console.error('[solicitation] strike not recorded:', error?.message);
    return { status: 422, body: { error: STRIKE_MESSAGES[1], code: 'SOLICITATION_STRIKE', strikes: 1, visibility: 'active' } };
  }

  const strikes = Number((data as { strikes?: number }).strikes) || 1;
  const visibility = String((data as { visibility?: string }).visibility || 'active');
  console.warn('[solicitation] strike', strikes, 'for', userId, 'terms:', found.terms.join(' | ').slice(0, 160));

  if (strikes >= 3) {
    // Permanent removal: the sign-in is banned (it can no longer refresh or sign in again) and this session ends.
    await db.auth.admin.updateUserById(userId, { ban_duration: '876000h' }).catch((e: unknown) => console.error('[solicitation] ban failed:', e));
    await session.auth.signOut().catch(() => null);
    return { status: 403, body: { error: STRIKE_MESSAGES[3], code: 'ACCOUNT_REMOVED', strikes, visibility } };
  }
  return { status: 422, body: { error: STRIKE_MESSAGES[strikes === 2 ? 2 : 1], code: 'SOLICITATION_STRIKE', strikes, visibility } };
}
