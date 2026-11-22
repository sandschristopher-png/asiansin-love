/**
 * Three-strike numbers shared by the server, the pages and the tests. No imports, so a client page can show the
 * messages or hide a held profile without pulling in the safety dictionary (solicitationFilter.ts re-exports all of it).
 */

/** Strike rules. The same numbers are in the SQL function record_solicitation_strike (20261202). */
export const HOLD_HOURS = 24;
export const STRIKE_PENALTIES = [15, 35] as const; // strike 1: -15, strike 2: a further -35 (50 in all)

export type Visibility = 'active' | 'held' | 'banned';

export interface StrikeOutcome {
  strikes: number;
  reputation: number;
  visibility: Visibility;
  /** Strike 2 locks bio and Moment editing for HOLD_HOURS. */
  lockHours: number;
}

/** What one more strike does to a member who has `strikes` already and `reputation` points (0-100). */
export function nextStrike(strikes: number, reputation: number): StrikeOutcome {
  const next = Math.max(0, Math.floor(strikes)) + 1;
  if (next >= 3) return { strikes: next, reputation: 0, visibility: 'banned', lockHours: 0 };
  const rep = Math.max(0, Math.min(100, Math.round(reputation)) - STRIKE_PENALTIES[next - 1]);
  return { strikes: next, reputation: rep, visibility: next === 2 ? 'held' : 'active', lockHours: next === 2 ? HOLD_HOURS : 0 };
}

/** The words shown to the member (strike 3 never reaches the writer: the account is gone). */
export const STRIKE_MESSAGES: Record<1 | 2 | 3, string> = {
  1: 'Wrong platform for that. Meet in Asia is for dating and real connections, not sugar arrangements or bill-paying. Remove those terms to continue.',
  2: 'Final warning: Repeated attempts to post financial or transactional terms have paused your profile visibility for 24 hours and lowered your trust score. One more violation will permanently remove your account.',
  3: 'This member is no longer available on Meet in Asia',
};

/** A held profile is hidden only while its hold runs; a banned one always. */
export function isHiddenFromFeeds(row: { visibility_status?: string | null; edit_locked_until?: string | null }, now = Date.now()): boolean {
  if (row.visibility_status === 'banned') return true;
  if (row.visibility_status !== 'held') return false;
  const until = row.edit_locked_until ? new Date(row.edit_locked_until).getTime() : 0;
  return Number.isFinite(until) && until > now;
}
