import { createHmac, timingSafeEqual } from 'crypto';

// The 4 canonical MediaPipe canned gestures:
// peace (Victory), palm (Open_Palm), pointing (Pointing_Up), thumbs (Thumb_Up)
export const POSE_POOL = ['palm', 'peace', 'pointing', 'thumbs'] as const;

export const SEQUENCE_LENGTH = 2;
export const TOKEN_TTL_MS = 5 * 60 * 1000;

export type VerifyTokenPayload = {
  userId: string;
  sequence: string[];
  issuedAt: number;
};

export function getSigningSecret(): string {
  const secret = process.env.KYC_SIGNING_SECRET || process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!secret) {
    throw new Error('KYC_SIGNING_SECRET or SUPABASE_SERVICE_ROLE_KEY not configured');
  }
  return secret;
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