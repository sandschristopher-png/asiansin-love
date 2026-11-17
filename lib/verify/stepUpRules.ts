/**
 * Rules for the step-up identity check, kept free of the server and the browser so they are unit-tested
 * (scripts/test-stepup.mjs) and shared by the start / finish routes and the camera screen.
 */
import type { StepUpPose } from '@/lib/headPose';

export const STEP_UP_POSES: StepUpPose[] = ['turn_left', 'turn_right', 'look_up', 'look_down'];
export const POSES_PER_CHECK = 3;
/** Each pose must be held this long; the whole check must take at least this long (measured by the server). */
export const MIN_HOLD_MS = 600;
export const MIN_TOTAL_MS = 4000;
export const MAX_HOLD_MS = 15_000;
export const TOKEN_TTL_MS = 5 * 60 * 1000;
/** Three tries in an hour (the first plus two retries); the next goes to a person. */
export const MAX_ATTEMPTS_PER_HOUR = 3;
/** Match score (0-100) from the pre-screen needed to pass without a person. */
export const MIN_MATCH_CONFIDENCE = 80;

export type TriggerReason = 'photo_swap' | 'velocity' | 'reports' | 'new_country' | 'quarantine_recovery' | 'manual' | 'verification';
export const TRIGGER_REASONS: TriggerReason[] = ['photo_swap', 'velocity', 'reports', 'new_country', 'quarantine_recovery', 'manual', 'verification'];

export function isTriggerReason(v: unknown): v is TriggerReason {
  return typeof v === 'string' && (TRIGGER_REASONS as string[]).includes(v);
}

export type FinishDecision = 'passed' | 'retry' | 'queue';

/**
 * What happens to a finished check. Only the verified badge is special: for `verification` a good result is
 * never "passed" (the AI only pre-screens; a person grants the badge), it joins the staff queue marked as a
 * fast-track. Everything else passes on a good result and retries up to MAX_ATTEMPTS_PER_HOUR. No usable
 * pre-screen (outage, timeout) and the straight-photo accessibility path always go to a person.
 */
export function decideFinish(i: {
  reason: TriggerReason;
  /** The pre-screen ran and every check came back good. */
  reviewPassed: boolean;
  /** The pre-screen produced a result at all. */
  aiAvailable: boolean;
  /** Failed attempts in the last hour, before this one. */
  failedBefore: number;
  accessibility?: boolean;
}): FinishDecision {
  if (i.accessibility || !i.aiAvailable) return 'queue';
  if (i.reviewPassed) return i.reason === 'verification' ? 'queue' : 'passed';
  return i.failedBefore + 1 < MAX_ATTEMPTS_PER_HOUR ? 'retry' : 'queue';
}

/** Three distinct random poses. `rand` is injectable for tests; the server passes crypto-backed randomness. */
export function pickPoses(rand: () => number = Math.random): StepUpPose[] {
  const pool = [...STEP_UP_POSES];
  const out: StepUpPose[] = [];
  while (out.length < POSES_PER_CHECK && pool.length) out.push(pool.splice(Math.floor(rand() * pool.length), 1)[0]);
  return out;
}

export interface PoseHold {
  pose: string;
  holdMs: number;
}

/** The client's record of what it saw. Every requested pose, in order, held long enough; nothing extra. */
export function validPoseLog(requested: readonly string[], log: unknown): boolean {
  if (!Array.isArray(log) || log.length !== requested.length) return false;
  return requested.every((pose, i) => {
    const entry = log[i] as PoseHold | undefined;
    return (
      entry?.pose === pose &&
      typeof entry.holdMs === 'number' &&
      Number.isFinite(entry.holdMs) &&
      entry.holdMs >= MIN_HOLD_MS &&
      entry.holdMs <= MAX_HOLD_MS
    );
  });
}

/** Elapsed time is the server's own clock against the signed issuedAt, never a client timestamp. */
export function elapsedOk(issuedAt: number, now: number): 'ok' | 'too_fast' | 'expired' {
  const elapsed = now - issuedAt;
  if (elapsed > TOKEN_TTL_MS) return 'expired';
  if (elapsed < MIN_TOTAL_MS) return 'too_fast';
  return 'ok';
}

// ---- Risk triggers (server) -------------------------------------------------------------------------
export const VELOCITY_LIMIT = 15; // more than this many messages + sparks...
export const VELOCITY_WINDOW_MS = 10 * 60 * 1000; // ...in this window
export const REPORT_LIMIT = 2; // this many reports (or more)...
export const REPORT_WINDOW_MS = 7 * 24 * 60 * 60 * 1000; // ...in this window

export const velocityExceeded = (count: number) => count > VELOCITY_LIMIT;
export const reportsExceeded = (count: number) => count >= REPORT_LIMIT;

/**
 * A session from a new country: the edge country differs from the last session's AND from the country on
 * the profile (both as ISO codes). First ever session (no last country) records it without flagging.
 * Unknown country never flags.
 */
export function newCountryLogin(edge: string | null, lastLogin: string | null, profileCountryCode: string | null): boolean {
  if (!edge || !lastLogin) return false;
  const e = edge.toUpperCase();
  return e !== lastLogin.toUpperCase() && e !== (profileCountryCode ?? '').toUpperCase();
}
