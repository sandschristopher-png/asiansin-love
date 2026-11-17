/**
 * Voice-call rules, kept free of React and the browser so they can be tested on their own
 * (scripts/test-call-rules.mjs) and shared by the client and the eligibility API.
 */

/** Messages in the thread (at least one from each member) before voice calls unlock. */
export const CALL_UNLOCK_MESSAGES = 5;
export const RING_TIMEOUT_MS = 30_000;
/** A call wraps up on its own at 30:00 and warns at 25:00. */
export const SESSION_CAP_SEC = 30 * 60;
export const SESSION_WARN_SEC = 25 * 60;
/** Consecutive missed or declined calls that pause calling, and for how long. */
export const MISS_LOCK_COUNT = 2;
export const MISS_LOCK_MS = 60 * 60 * 1000;

export const STATS_INTERVAL_MS = 2000;
/** Weak when any of these is crossed; back to good after this many healthy checks in a row. */
export const WEAK_RTT_MS = 450;
export const WEAK_LOSS_PCT = 8;
export const WEAK_JITTER_MS = 60;
export const HEALTHY_CHECKS_TO_CLEAR = 2;

export type CallEndReason = 'completed' | 'missed' | 'declined' | 'failed';

/** The pair key shared by call_logs.match_id and the realtime topics (both ids, sorted). */
export function pairKey(a: string, b: string): string {
  return [a, b].sort().join(':');
}

/** Answer of GET /api/calls/eligibility. Blocked, muted and quarantined members all read as 'unavailable'. */
export type CallEligibility =
  | { allowed: true }
  | { allowed: false; reason: 'unavailable' | 'unverified' | 'few_messages' | 'paused'; pausedUntil?: number };

export type UnlockState = 'ok' | 'unverified' | 'few_messages';

/** Unlocked once both members are live-selfie verified and the thread has 5+ messages, at least one from each. */
export function callUnlockState(input: {
  fromMe: number;
  fromThem: number;
  meVerified: boolean;
  theyVerified: boolean;
}): UnlockState {
  if (!input.meVerified || !input.theyVerified) return 'unverified';
  if (input.fromMe < 1 || input.fromThem < 1 || input.fromMe + input.fromThem < CALL_UNLOCK_MESSAGES) return 'few_messages';
  return 'ok';
}

export interface OutgoingLog {
  endedAt: number; // ms
  reason: CallEndReason;
}

/**
 * Anti-spam cooldown. Looks at MY outgoing calls to this member, newest first. Two in a row that were
 * missed or declined pause calling for 60 minutes from the latest one, unless they have written since.
 * Returns the time (ms) calling resumes, or null when calling is open.
 */
export function missLockUntil(outgoingNewestFirst: OutgoingLog[], lastMessageFromThemAt: number | null, now: number): number | null {
  let streak = 0;
  for (const log of outgoingNewestFirst) {
    if (log.reason === 'completed') break;
    if (log.reason === 'missed' || log.reason === 'declined') streak += 1;
    // 'failed' (a technical failure) neither counts as a miss nor breaks the streak.
  }
  if (streak < MISS_LOCK_COUNT) return null;
  const latest = outgoingNewestFirst.find((l) => l.reason === 'missed' || l.reason === 'declined');
  if (!latest) return null;
  if (lastMessageFromThemAt !== null && lastMessageFromThemAt > latest.endedAt) return null;
  const until = latest.endedAt + MISS_LOCK_MS;
  return until > now ? until : null;
}

export interface QualitySample {
  rttMs: number | null;
  lossPct: number | null;
  jitterMs: number | null;
  iceState: string;
}

export type Quality = 'good' | 'weak';

export function isSampleWeak(s: QualitySample): boolean {
  if (s.iceState === 'disconnected') return true;
  return (
    (s.rttMs !== null && s.rttMs > WEAK_RTT_MS) ||
    (s.lossPct !== null && s.lossPct > WEAK_LOSS_PCT) ||
    (s.jitterMs !== null && s.jitterMs > WEAK_JITTER_MS)
  );
}

/**
 * Weak/good with hysteresis: one bad sample marks weak; it clears after 2 healthy samples in a row
 * (4 seconds at the 2 s poll) or as soon as ICE reports connected again.
 */
export class QualityTracker {
  status: Quality = 'good';
  private healthy = 0;

  /** Returns the new status when it changed, otherwise null. */
  push(sample: QualitySample): Quality | null {
    const weak = isSampleWeak(sample);
    if (weak) {
      this.healthy = 0;
      if (this.status === 'good') {
        this.status = 'weak';
        return 'weak';
      }
      return null;
    }
    if (this.status === 'weak') {
      this.healthy += 1;
      if (this.healthy >= HEALTHY_CHECKS_TO_CLEAR || sample.iceState === 'connected') {
        this.status = 'good';
        this.healthy = 0;
        return 'good';
      }
    }
    return null;
  }
}

/** Packet loss over an interval, from two cumulative inbound-rtp readings. */
export function lossPercent(prev: { received: number; lost: number } | null, cur: { received: number; lost: number }): number | null {
  if (!prev) return null;
  const received = cur.received - prev.received;
  const lost = cur.lost - prev.lost;
  const total = received + lost;
  if (total <= 0 || lost < 0) return null;
  return (lost / total) * 100;
}

export function formatClock(totalSec: number): string {
  const s = Math.max(0, Math.floor(totalSec));
  const m = Math.floor(s / 60);
  return `${String(m).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;
}

/** "6m 24s", "45s", "1h 2m" style label for the chat timeline. */
export function formatDuration(totalSec: number): string {
  const s = Math.max(0, Math.round(totalSec));
  if (s < 60) return `${s}s`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ${s % 60}s`;
  return `${Math.floor(m / 60)}h ${m % 60}m`;
}

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const REASONS: CallEndReason[] = ['completed', 'missed', 'declined', 'failed'];

export interface CallLogInput {
  id: string;
  peer: string;
  startedAt: string;
  endedAt: string;
  durationSec: number;
  reason: CallEndReason;
}

/**
 * Validates the body of POST /api/calls/log (also sent with sendBeacon when a tab closes mid-call).
 * Nothing the client says is trusted beyond sanity: ids are UUIDs, times are recent and ordered, the
 * duration is capped by the 30-minute session cap plus slack. Returns null when anything is off.
 */
export function parseCallLogBody(raw: unknown, now: number): CallLogInput | null {
  if (!raw || typeof raw !== 'object') return null;
  const b = raw as Record<string, unknown>;
  const reason = b.reason as CallEndReason;
  if (!REASONS.includes(reason)) return null;
  if (typeof b.id !== 'string' || !UUID.test(b.id) || typeof b.peer !== 'string' || !UUID.test(b.peer)) return null;
  const started = Date.parse(String(b.startedAt));
  const ended = Date.parse(String(b.endedAt));
  if (!Number.isFinite(started) || !Number.isFinite(ended)) return null;
  const HOUR = 3600_000;
  if (started > now + 60_000 || ended > now + 60_000 || ended < started || now - started > 3 * HOUR) return null;
  const duration = Math.round(Number(b.durationSec));
  if (!Number.isFinite(duration) || duration < 0 || duration > SESSION_CAP_SEC + 120) return null;
  if (reason !== 'completed' && reason !== 'failed' && duration > 0) return null;
  return { id: b.id, peer: b.peer, startedAt: new Date(started).toISOString(), endedAt: new Date(ended).toISOString(), durationSec: duration, reason };
}
