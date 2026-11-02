import { createHmac, timingSafeEqual } from 'crypto';

// Face liveness poses (ids match VERIFICATION_POSES in lib/verification.ts). Each session gets
// 3 distinct poses in random order; any 3 of these 4 always include a frontal pose (blink / smile)
// for the avatar face match.
export const POSE_POOL = ['blink', 'turn_left', 'turn_right', 'smile'] as const;

export const SEQUENCE_LENGTH = 3;
export const TOKEN_TTL_MS = 5 * 60 * 1000;

export type VerifyTokenPayload = {
  userId: string;
  sequence: string[];
  issuedAt: number;
};

export function getSigningSecret(): string {
  if (process.env.KYC_SIGNING_SECRET) return process.env.KYC_SIGNING_SECRET;
  const base = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!base) {
    throw new Error('KYC_SIGNING_SECRET or SUPABASE_SERVICE_ROLE_KEY not configured');
  }
  // Purpose-bound key derived from the service key, so the raw key is never used as an HMAC secret.
  // (Set KYC_SIGNING_SECRET to a random string to replace this fallback.)
  return createHmac('sha256', base).update('asiansin-love:kyc-signing:v1').digest('hex');
}

function b64url(input: string): string {
  return Buffer.from(input).toString('base64url');
}

export function signToken(payload: VerifyTokenPayload): string {
  const body = b64url(JSON.stringify(payload));
  const sig = createHmac('sha256', getSigningSecret()).update(body).digest('base64url');
  return `${body}.${sig}`;
}

export function verifyToken(token: string): VerifyTokenPayload | null {
  const dot = token.lastIndexOf('.');
  if (dot <= 0) return null;
  const body = token.slice(0, dot);
  const sig = token.slice(dot + 1);

  let expected: string;
  try {
    expected = createHmac('sha256', getSigningSecret()).update(body).digest('base64url');
  } catch {
    return null;
  }

  const a = Buffer.from(sig);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null;

  try {
    const payload = JSON.parse(
      Buffer.from(body, 'base64url').toString('utf8')
    ) as VerifyTokenPayload;
    if (
      !payload ||
      typeof payload.userId !== 'string' ||
      !Array.isArray(payload.sequence) ||
      typeof payload.issuedAt !== 'number'
    ) {
      return null;
    }
    return payload;
  } catch {
    return null;
  }
}

export function tokenFingerprint(token: string): string {
  return createHmac('sha256', getSigningSecret()).update(token).digest('hex').slice(0, 32);
}