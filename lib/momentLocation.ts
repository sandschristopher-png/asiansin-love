/**
 * Signed "location confirmed" tokens for Moments (server only).
 *
 * POST /api/moments/locate checks a GPS fix (inside Southeast Asia, not on a VPN, proxy or datacenter
 * connection) and answers with a short-lived token naming the member and the city. POST /api/moments
 * accepts that token and only then stores location_verified = true, so a client can never claim the
 * flag by itself. The token is an HMAC over the member id, city and expiry, keyed with the service-role
 * secret that never leaves the server.
 */
import crypto from 'node:crypto';

export const LOCATION_TOKEN_TTL_MS = 15 * 60 * 1000;

const secret = () => process.env.SUPABASE_SERVICE_ROLE_KEY || '';

const sign = (payload: string) => crypto.createHmac('sha256', secret()).update(`moment-location:${payload}`).digest('base64url');

export function signLocationToken(userId: string, city: string, now: number = Date.now()): string | null {
  if (!secret()) return null;
  const payload = Buffer.from(JSON.stringify({ u: userId, c: city, e: now + LOCATION_TOKEN_TTL_MS })).toString('base64url');
  return `${payload}.${sign(payload)}`;
}

/** True only for an unexpired token signed for exactly this member and this city. */
export function verifyLocationToken(token: string, userId: string, city: string, now: number = Date.now()): boolean {
  if (!secret()) return false;
  const [payload, sig] = String(token).split('.');
  if (!payload || !sig) return false;
  const expected = sign(payload);
  const a = Buffer.from(sig);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return false;
  try {
    const data = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8')) as { u?: unknown; c?: unknown; e?: unknown };
    return data.u === userId && data.c === city && typeof data.e === 'number' && data.e > now;
  } catch {
    return false;
  }
}
