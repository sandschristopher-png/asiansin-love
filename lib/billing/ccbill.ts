/**
 * CCBill webhook rules for Meet in Asia Plus: request parsing, authentication and the decision of
 * what each event does to a member's Plus access. Pure functions (no I/O) so they can be unit
 * tested. The route in app/api/webhooks/ccbill/route.ts applies the decision with the service role.
 *
 * Field names follow CCBill's postback conventions as used by this integration: `eventType` (sent
 * in the query string), `subscriptionId`, `transactionId`, `timestamp`, `nextRenewalDate`,
 * `clientAccnum`, `clientSubacc`, and the pass-through `X-userId`. Confirm them against CCBill's
 * current postback documentation and a sandbox event before go-live.
 */
import { timingSafeEqual } from 'crypto';

export const CCBILL_MAX_BODY_BYTES = 64 * 1024;

/** A grant or renewal: Plus is on until the period end. */
export const CCBILL_GRANT_EVENTS = ['NewSaleSuccess', 'RenewalSuccess', 'UpgradeSuccess', 'UserReactivation'] as const;
/** Auto-renew turned off: Plus stays on until the paid period ends. */
export const CCBILL_CANCEL_EVENTS = ['Cancellation'] as const;
/** Access ends at once. Maps each event to the stored subscription status. */
export const CCBILL_REVOKE_EVENTS: Record<string, RevokeStatus> = {
  Expiration: 'expired',
  Chargeback: 'chargeback',
  Refund: 'refunded',
  Void: 'voided',
};

export type RevokeStatus = 'expired' | 'chargeback' | 'refunded' | 'voided';

/** Length of a billing period when CCBill does not send a usable next renewal date. */
export const FALLBACK_PERIOD_DAYS = 31;

export type ParseResult =
  | { ok: true; fields: Record<string, string> }
  | { ok: false; status: 400 | 413 | 415; reason: string };

/**
 * Reads the body (form-urlencoded or JSON) and merges in the query string. Body values win; the
 * query fills in gaps, which is where CCBill puts `eventType`.
 */
export function parseCcbillBody(
  contentType: string | null,
  raw: string,
  query: URLSearchParams
): ParseResult {
  if (raw.length > CCBILL_MAX_BODY_BYTES) return { ok: false, status: 413, reason: 'body too large' };

  const type = (contentType || '').split(';')[0].trim().toLowerCase();
  const fields: Record<string, string> = {};

  if (type === 'application/json') {
    let parsed: unknown;
    try {
      parsed = raw.trim() ? JSON.parse(raw) : {};
    } catch {
      return { ok: false, status: 400, reason: 'invalid JSON' };
    }
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
      return { ok: false, status: 400, reason: 'JSON body must be an object' };
    }
    for (const [key, value] of Object.entries(parsed as Record<string, unknown>)) {
      if (value === null || value === undefined) continue;
      if (typeof value === 'object') return { ok: false, status: 400, reason: `field ${key} must be a scalar` };
      fields[key] = String(value);
    }
  } else if (type === 'application/x-www-form-urlencoded' || type === '') {
    for (const [key, value] of new URLSearchParams(raw).entries()) fields[key] = value;
  } else {
    return { ok: false, status: 415, reason: 'unsupported content type' };
  }

  for (const [key, value] of query.entries()) {
    if (!(key in fields)) fields[key] = value;
  }
  return { ok: true, fields };
}

export type AuthResult = { ok: true } | { ok: false; status: 401 | 503; reason: string };

/** Constant-time string comparison. */
function safeEqual(a: string, b: string): boolean {
  const left = Buffer.from(a);
  const right = Buffer.from(b);
  return left.length === right.length && timingSafeEqual(left, right);
}

/**
 * Authenticates a postback. Fails closed: if any required setting is missing the webhook refuses
 * every request, so nothing can grant Plus before the account and secret are configured.
 *
 *   CCBILL_WEBHOOK_SECRET   a long random token. It must be in the postback URL configured in
 *                           CCBill (`/api/webhooks/ccbill?token=...`).
 *   CCBILL_CLIENT_ACCNUM    the account number; postbacks for any other account are rejected.
 *   CCBILL_CLIENT_SUBACC    the sub-account number; same rule.
 */
export function verifyCcbillRequest(
  query: URLSearchParams,
  fields: Record<string, string>,
  env: Record<string, string | undefined>
): AuthResult {
  const secret = env.CCBILL_WEBHOOK_SECRET;
  const accnum = env.CCBILL_CLIENT_ACCNUM;
  const subacc = env.CCBILL_CLIENT_SUBACC;
  if (!secret || !accnum || !subacc) {
    return { ok: false, status: 503, reason: 'CCBill webhook is not configured' };
  }

  const token = query.get('token') || '';
  if (!token || !safeEqual(token, secret)) return { ok: false, status: 401, reason: 'bad token' };

  if (fields.clientAccnum !== accnum || fields.clientSubacc !== subacc) {
    return { ok: false, status: 401, reason: 'account mismatch' };
  }
  return { ok: true };
}

/** Dedupe key: one per CCBill event. Null when the payload cannot identify the event. */
export function ccbillEventKey(fields: Record<string, string>): string | null {
  const type = fields.eventType;
  if (!type) return null;
  if (fields.transactionId) return `${type}:tx:${fields.transactionId}`;
  if (fields.subscriptionId && fields.timestamp) return `${type}:sub:${fields.subscriptionId}:${fields.timestamp}`;
  return null;
}

/** When the event happened, used to ignore an older event that arrives after a newer one. */
export function ccbillEventTime(fields: Record<string, string>, now: Date): Date {
  const raw = fields.timestamp;
  if (raw) {
    // "YYYY-MM-DD HH:MM:SS" (assumed UTC; confirm against CCBill's timestamp format).
    const ms = Date.parse(raw.includes('T') ? raw : `${raw.replace(' ', 'T')}Z`);
    if (Number.isFinite(ms)) return new Date(ms);
  }
  return now;
}

export type Effect =
  | { kind: 'grant'; subscriptionId: string; periodEnd: Date }
  | { kind: 'cancel'; subscriptionId: string }
  | { kind: 'revoke'; subscriptionId: string; status: RevokeStatus }
  | { kind: 'ignore'; reason: string };

/** Turns one event into the change it makes. Unknown events are ignored (and still acknowledged). */
export function decideEffect(fields: Record<string, string>, now: Date): Effect {
  const type = fields.eventType || '';
  const subscriptionId = fields.subscriptionId || '';

  if ((CCBILL_GRANT_EVENTS as readonly string[]).includes(type)) {
    if (!subscriptionId) return { kind: 'ignore', reason: 'missing subscriptionId' };
    return { kind: 'grant', subscriptionId, periodEnd: nextPeriodEnd(fields.nextRenewalDate, now) };
  }
  if ((CCBILL_CANCEL_EVENTS as readonly string[]).includes(type)) {
    if (!subscriptionId) return { kind: 'ignore', reason: 'missing subscriptionId' };
    return { kind: 'cancel', subscriptionId };
  }
  const revoke = CCBILL_REVOKE_EVENTS[type];
  if (revoke) {
    if (!subscriptionId) return { kind: 'ignore', reason: 'missing subscriptionId' };
    return { kind: 'revoke', subscriptionId, status: revoke };
  }
  return { kind: 'ignore', reason: `event ${type || '(none)'} does not change access` };
}

/**
 * The end of the paid period: CCBill's next renewal date when it is a usable future date, otherwise
 * `FALLBACK_PERIOD_DAYS` from now.
 */
export function nextPeriodEnd(raw: string | undefined, now: Date): Date {
  if (raw) {
    const ms = Date.parse(raw.includes('T') ? raw : `${raw.replace(' ', 'T')}Z`);
    if (Number.isFinite(ms) && ms > now.getTime()) return new Date(ms);
  }
  return new Date(now.getTime() + FALLBACK_PERIOD_DAYS * 24 * 60 * 60 * 1000);
}

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** The member id passed through as X-userId, or null when it is missing or not a UUID. */
export function passThroughUserId(fields: Record<string, string>): string | null {
  const raw = (fields['X-userId'] || fields['x-userId'] || fields.userId || '').trim();
  return UUID_RE.test(raw) ? raw : null;
}
