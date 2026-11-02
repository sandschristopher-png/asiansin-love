// app/api/verify/submit/route.ts
//   POST multipart { attemptId, selfie } -> stores the selfie privately, asks Gemini to pre-screen it
//   against the main photo, and queues the member for admin review.
//
// The AI only scores and flags. The verified badge is NEVER granted here: verification_status is
// always set to 'pending' and an admin approves it at /admin/verifications.
import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { createClient as createSessionClient } from '@/lib/supabase/server';
import { verifyToken, TOKEN_TTL_MS } from '@/lib/verify/token';
import { reviewVerificationSelfie, isFastTrack, type SelfieReviewResult } from '@/lib/aiVision';
import { getPoseById } from '@/lib/poses';

export const runtime = 'nodejs';
export const maxDuration = 30;

const MIN_ELAPSED_MS = 4000;
const MAX_PHOTO_BYTES = 10 * 1024 * 1024;
const MAX_AVATAR_BYTES = 8 * 1024 * 1024;
const AI_TIMEOUT_MS = 15000;
const AVATAR_FETCH_TIMEOUT_MS = 5000;

function getServiceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  );
}

function looksLikeJpeg(buf: Buffer): boolean {
  return buf.length > 4 && buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff;
}

/** Downloads the main photo for the AI comparison. Only our own Supabase storage host is fetched. */
async function fetchAvatar(url: string | null | undefined): Promise<{ data: Buffer; mimeType: string } | null> {
  if (!url) return null;
  try {
    const target = new URL(url);
    const ownHost = new URL(process.env.NEXT_PUBLIC_SUPABASE_URL!).host;
    if (target.protocol !== 'https:' || target.host !== ownHost) return null;

    const res = await fetch(target, { signal: AbortSignal.timeout(AVATAR_FETCH_TIMEOUT_MS) });
    if (!res.ok) return null;
    const mimeType = (res.headers.get('content-type') || '').split(';')[0].trim();
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(mimeType)) return null;
    const data = Buffer.from(await res.arrayBuffer());
    if (data.length === 0 || data.length > MAX_AVATAR_BYTES) return null;
    return { data, mimeType };
  } catch {
    return null;
  }
}

export async function POST(req: Request) {
  const supabase = await createSessionClient();
  const { data, error: authError } = await supabase.auth.getUser();
  if (authError || !data?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const userId = data.user.id;

  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }

  const attemptId = form.get('attemptId');
  if (typeof attemptId !== 'string' || !attemptId) {
    return NextResponse.json({ error: 'Missing verification token' }, { status: 400 });
  }

  const payload = verifyToken(attemptId);
  if (!payload) {
    return NextResponse.json({ error: 'Invalid verification token' }, { status: 401 });
  }

  // Token must belong to the requesting user
  if (payload.userId !== userId) {
    return NextResponse.json({ error: 'Token does not belong to this user' }, { status: 403 });
  }

  // TTL window. Elapsed time is computed SERVER-SIDE from issuedAt - never trust client timestamps.
  const elapsed = Date.now() - payload.issuedAt;
  if (elapsed > TOKEN_TTL_MS) {
    return NextResponse.json({ error: 'Verification session expired. Here is a new pose to copy.' }, { status: 410 });
  }
  if (elapsed < MIN_ELAPSED_MS) {
    return NextResponse.json({ error: 'Verification completed too quickly' }, { status: 400 });
  }

  const pose = getPoseById(payload.sequence[0]);
  if (!pose || payload.sequence.length !== 1) {
    return NextResponse.json({ error: 'Verification session expired. Here is a new pose to copy.' }, { status: 410 });
  }

  const blob = form.get('selfie');
  if (!blob || typeof blob === 'string') {
    return NextResponse.json({ error: 'Missing selfie' }, { status: 400 });
  }
  if (blob.type !== 'image/jpeg') {
    return NextResponse.json({ error: 'Selfie must be a JPEG' }, { status: 400 });
  }
  if (blob.size > MAX_PHOTO_BYTES) {
    return NextResponse.json({ error: 'Selfie exceeds 10MB' }, { status: 400 });
  }
  const selfie = Buffer.from(await blob.arrayBuffer());
  if (!looksLikeJpeg(selfie)) {
    return NextResponse.json({ error: 'Selfie is not a valid JPEG' }, { status: 400 });
  }

  const service = getServiceClient();

  const { data: profile } = await service
    .from('profiles')
    .select('avatar_url, is_verified')
    .eq('id', userId)
    .maybeSingle();

  if (profile?.is_verified) {
    return NextResponse.json({ verified: true, alreadyVerified: true });
  }
  if (!profile?.avatar_url) {
    return NextResponse.json(
      { error: 'Add a clear main profile photo first - verification matches your face against it.' },
      { status: 400 }
    );
  }

  // Private bucket; latest selfie per member (admins read it through signed URLs).
  const selfiePath = `${userId}/selfie.jpg`;
  const { error: uploadError } = await service.storage
    .from('verifications')
    .upload(selfiePath, selfie, { contentType: 'image/jpeg', upsert: true });
  if (uploadError) {
    console.error('[verify/submit] upload failed:', uploadError.message);
    return NextResponse.json(
      { error: 'Could not store your verification photo. Please try again.' },
      { status: 500 }
    );
  }

  // Fail safe: an AI error or timeout leaves ai = null and the submission still goes to an admin.
  let ai: SelfieReviewResult | null = null;
  try {
    const avatar = await fetchAvatar(profile.avatar_url);
    ai = await Promise.race([
      reviewVerificationSelfie({ selfie, avatar, poseDescription: pose.aiDescription }),
      new Promise<null>((resolve) => setTimeout(() => resolve(null), AI_TIMEOUT_MS)),
    ]);
  } catch (e) {
    console.warn('[verify/submit] AI pre-screen skipped:', e);
  }
  const fastTrack = isFastTrack(ai);

  // Review metadata for /admin/verifications (reads the newest `<stamp>_meta.json`).
  const stamp = Date.now();
  const { error: metaError } = await service.storage
    .from('verifications')
    .upload(
      `${userId}/${stamp}_meta.json`,
      Buffer.from(
        JSON.stringify({ poses: pose.label, pose_id: pose.id, selfie_path: selfiePath, ai, fast_track: fastTrack })
      ),
      { contentType: 'application/json', upsert: true }
    );
  if (metaError) console.warn('[verify/submit] review metadata not saved:', metaError.message);

  const { error: updateError } = await service
    .from('profiles')
    .update({ verification_status: 'pending' })
    .eq('id', userId);

  if (updateError) {
    console.error('[verify/submit] profile update failed:', updateError.message);
    return NextResponse.json({ error: 'Could not save verification status' }, { status: 500 });
  }

  return NextResponse.json({
    verified: false,
    pending: true,
    fastTrack,
    message: fastTrack
      ? 'Your photo looks great - these are usually approved quickly.'
      : 'Our team will review your photo and your verified badge appears once approved.',
  });
}
