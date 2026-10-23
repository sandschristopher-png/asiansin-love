import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { createClient as createSessionClient } from '@/lib/supabase/server';
import { verifyToken, tokenFingerprint, TOKEN_TTL_MS } from '@/lib/verify/token';

export const runtime = 'nodejs';

// Calibrated for blink + 2 poses. A human needs ~2.5-4s; scripts fire faster.
const MIN_ELAPSED_MS = 2600;
const MIN_POSE_GAP_MS = 600;

function fail(error: string, status: number) {
  return NextResponse.json({ error }, { status });
}

export async function POST(req: NextRequest) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) return fail('Server not configured', 500);

  const session = await createSessionClient();
  const { data: { user } } = await session.auth.getUser();
  if (!user) return fail('Unauthorized', 401);

  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return fail('Invalid request body', 400);
  }

  // Client sends the signed token under the field name 'attemptId'.
  const attemptToken = form.get('attemptId')?.toString() ?? '';
  if (!attemptToken) return fail('Missing attempt token', 400);

  // 1. HMAC signature + payload shape
  const payload = verifyToken(attemptToken);
  if (!payload) return fail('Invalid or malformed token', 401);

  // 2. Token belongs to this user
  if (payload.userId !== user.id) {
    return fail('Token does not belong to this user', 403);
  }

  // 3. Timing physics
  const elapsed = Date.now() - payload.issuedAt;
  if (elapsed > TOKEN_TTL_MS) {
    return fail('Verification session expired, please restart', 410);
  }
  if (elapsed < MIN_ELAPSED_MS) {
    return fail('Completed too fast to be human', 400);
  }

  // 4. Capture telemetry
  let captureTimestamps: number[] = [];
  try {
    const parsed = JSON.parse(form.get('captureTimestamps')?.toString() ?? '[]');
    if (Array.isArray(parsed)) captureTimestamps = parsed;
  } catch {
    // handled by the length check below
  }
  const seqLen = payload.sequence.length;
  if (captureTimestamps.length !== seqLen) {
    return fail('Incomplete capture telemetry', 400);
  }
  for (let i = 0; i < captureTimestamps.length; i++) {
    const t = captureTimestamps[i];
    if (typeof t !== 'number' || t < payload.issuedAt || t > payload.issuedAt + TOKEN_TTL_MS + 5000) {
      return fail('Invalid capture timing', 400);
    }
    if (i > 0 && t - captureTimestamps[i - 1] < MIN_POSE_GAP_MS) {
      return fail('Poses captured too quickly', 400);
    }
  }

  // 5. Pose photos: exact count, non-empty, in server-dictated order
  const files: File[] = [];
  for (let i = 0; i < seqLen; i++) {
    const entry = form.get('pose_' + i);
    if (!(entry instanceof File) || entry.size === 0) {
      return fail('Missing pose photo ' + (i + 1), 400);
    }
    files.push(entry);
  }

  const admin = createClient(url, serviceKey, { auth: { persistSession: false } });

  // 6. Upload to the private 'verifications' bucket under this user's folder
  const basePath = `${user.id}/${Date.now()}`;
  for (let i = 0; i < files.length; i++) {
    const uploadResult = await admin.storage
      .from('verifications')
      .upload(`${basePath}/pose_${i}.jpg`, files[i], {
        contentType: 'image/jpeg',
        upsert: false,
      });
    if (uploadResult.error) return fail('Could not store verification photo', 500);
  }

  // 7. Replay protection: single-use nonce fingerprint
  const fingerprint = tokenFingerprint(attemptToken);
  const { data: profile, error: profErr } = await admin
    .from('profiles')
    .select('last_verification_nonce')
    .eq('id', user.id)
    .maybeSingle();
  if (profErr) return fail('Could not load profile', 500);
  if (profile?.last_verification_nonce === fingerprint) {
    return fail('Verification attempt already used', 409);
  }

  // 8. Flip the badge. Server-side only; client never touches is_verified.
  const { error: updErr } = await admin
    .from('profiles')
    .update({ is_verified: true, last_verification_nonce: fingerprint })
    .eq('id', user.id);
  if (updErr) return fail('Could not save verification', 500);

  return NextResponse.json({ verified: true, sequence: payload.sequence });
}