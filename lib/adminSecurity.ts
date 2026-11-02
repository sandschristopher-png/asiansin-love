import crypto from 'crypto';

/**
 * Signed, expiring links for Telegram moderation buttons.
 *
 * Secret:  ADMIN_ACTION_SECRET (preferred) or TELEGRAM_BOT_TOKEN.
 *          There is deliberately NO hardcoded fallback: if neither is set the
 *          links cannot be created or verified.
 * Expiry:  links stop working after LINK_TTL_MS (7 days).
 */

export const LINK_TTL_MS = 7 * 24 * 60 * 60 * 1000;
const MAX_CLOCK_SKEW_MS = 5 * 60 * 1000;

function getSecret(): string {
  const secret = process.env.ADMIN_ACTION_SECRET || process.env.TELEGRAM_BOT_TOKEN;
  if (!secret) {
    throw new Error(
      'ADMIN_ACTION_SECRET (or TELEGRAM_BOT_TOKEN) must be set to sign moderation links.'
    );
  }
  return secret;
}

function hmac(payload: string, ts: string): string {
  return crypto
    .createHmac('sha256', getSecret())
    .update(`${payload}|${ts}`)
    .digest('hex')
    .substring(0, 40);
}

/** Returns the timestamp + signature to put on a moderation link. */
export function signAdminAction(payload: string): { ts: string; sig: string } {
  const ts = String(Date.now());
  return { ts, sig: hmac(payload, ts) };
}

/** True only for an untampered, unexpired link. Never throws. */
export function verifyAdminAction(
  payload: string,
  ts: string | null,
  providedSig: string | null
): boolean {
  if (!ts || !providedSig || !/^\d{10,16}$/.test(ts)) return false;

  const issuedAt = Number(ts);
  const now = Date.now();
  if (issuedAt > now + MAX_CLOCK_SKEW_MS) return false;
  if (now - issuedAt > LINK_TTL_MS) return false;

  let expected: Buffer;
  try {
    expected = Buffer.from(hmac(payload, ts));
  } catch {
    return false;
  }
  const provided = Buffer.from(providedSig);
  if (provided.length !== expected.length) return false;
  return crypto.timingSafeEqual(provided, expected);
}

export function isUuid(value: unknown): value is string {
  return (
    typeof value === 'string' &&
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value)
  );
}

export function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/** Headers for moderation pages: never cache, never index, never leak the link via Referer. */
export const MODERATION_PAGE_HEADERS: Record<string, string> = {
  'Content-Type': 'text/html; charset=utf-8',
  'Cache-Control': 'no-store',
  'X-Robots-Tag': 'noindex, nofollow',
  'Referrer-Policy': 'no-referrer',
};
