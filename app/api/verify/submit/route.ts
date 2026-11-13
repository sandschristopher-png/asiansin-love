// app/api/verify/submit/route.ts
//   POST multipart { attemptId, selfie, faceCheck } -> validates the attempt, asks Gemini to
//   pre-screen the selfie against the main photo, then stores it privately and queues the member
//   for admin review.
//
// Fail fast: a selfie without exactly one detected face (client face gate metadata, then the AI
// face count) is rejected with 400 BEFORE anything is uploaded or marked 'pending'.
// The AI only scores and flags. The verified badge is NEVER granted here: verification_status is
// set to 'pending' and an admin approves it at /admin/verifications.
import { NextResponse, after } from 'next/server';
import { notifyAdmins } from '@/lib/adminNotify';
import { createClient } from '@supabase/supabase-js';
import { createClient as createSessionClient } from '@/lib/supabase/server';
import { verifyToken, tokenFingerprint, TOKEN_TTL_MS } from '@/lib/verify/token';
import { reviewVerificationSelfie, isFastTrack, type SelfieReviewResult } from '@/lib/aiVision';
import { getPoseById } from '@/lib/poses';
import { FACE_MIN_CONFIDENCE } from '@/lib/faceGateMessages';

export const runtime = 'nodejs';
export const maxDuration = 30;

const MIN_ELAPSED_MS = 4000;
const MAX_PHOTO_BYTES = 10 * 1024 * 1024;
const MAX_AVATAR_BYTES = 8 * 1024 * 1024;
const AI_TIMEOUT_MS = 15000;
const AVATAR_FETCH_TIMEOUT_MS = 5000;
const MIN_FACE_CONFIDENCE = FACE_MIN_CONFIDENCE;
const NO_FACE_ERROR = 'Biometric validation failed: No valid face detected';
/** Submissions per member per rolling hour (each one costs an AI review). */
const MAX_ATTEMPTS_PER_HOUR = 10;
const USED_PREFIX = '_used-attempts';

/**
 * Client face-gate metadata (lib/faceGate.ts): exactly one face at >= FACE_MIN_CONFIDENCE. /verify
 * only captures automatically (no manual shutter), so every submission must carry the live check.
 */
function validFaceCheck(raw: FormDataEntryValue | null, issuedAt: number): boolean {
  if (typeof raw !== 'string') return false;
  try {
    const c = JSON.parse(raw) as Record<string, unknown>;
    const checkedAt = Number(c.checked_at);
    const fresh = Number.isFinite(checkedAt) && checkedAt >= issuedAt && checkedAt <= Date.now() + 60_000;
    return (
      c.detector === 'mediapipe_face_landmarker' &&
      c.face_count === 1 &&
      Number(c.min_confidence) >= MIN_FACE_CONFIDENCE &&
      fresh
    );
  } catch {
    return false;
  }
}

function getServiceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  );
}

/** 'auto' | 'manual' from the client's faceCheck, for the reviewer. */
function captureMode(raw: FormDataEntryValue | null, key: 'face_capture' | 'pose_capture'): 'auto' | 'manual' | null {
  if (typeof raw !== 'string') return null;
  try {
    const v = (JSON.parse(raw) as Record<string, unknown>)[key];
    return v === 'auto' || v === 'manual' ? v : null;
  } catch {
    return null;
  }
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

  if (!validFaceCheck(form.get('faceCheck'), payload.issuedAt)) {
    return NextResponse.json({ error: NO_FACE_ERROR }, { status: 400 });
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

  // Step 1 portrait (optional only so a page cached before this release can still submit).
  let facePhoto: Buffer | null = null;
  const faceBlob = form.get('face');
  if (faceBlob && typeof faceBlob !== 'string') {
    if (faceBlob.type !== 'image/jpeg') {
      return NextResponse.json({ error: 'Portrait must be a JPEG' }, { status: 400 });
    }
    if (faceBlob.size > MAX_PHOTO_BYTES) {
      return NextResponse.json({ error: 'Portrait exceeds 10MB' }, { status: 400 });
    }
    facePhoto = Buffer.from(await faceBlob.arrayBuffer());
    if (!looksLikeJpeg(facePhoto)) {
      return NextResponse.json({ error: 'Portrait is not a valid JPEG' }, { status: 400 });
    }
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

  // Single use + rate limit, before the AI call. Claiming the token is an upload with upsert off:
  // storage refuses a second object at the same path, so a replay (or a parallel duplicate)
  // within the 5-minute TTL loses atomically. Markers live outside the member's review folder.
  const { data: recentClaims } = await service.storage
    .from('verifications')
    .list(`${USED_PREFIX}/${userId}`, { limit: 100, sortBy: { column: 'created_at', order: 'desc' } });
  const claimsLastHour = (recentClaims || []).filter(
    (f) => f.created_at && Date.now() - new Date(f.created_at).getTime() < 60 * 60 * 1000
  ).length;
  if (claimsLastHour >= MAX_ATTEMPTS_PER_HOUR) {
    return NextResponse.json(
      { error: 'Too many verification attempts. Please try again in an hour.' },
      { status: 429 }
    );
  }
  const { error: claimError } = await service.storage
    .from('verifications')
    .upload(`${USED_PREFIX}/${userId}/${tokenFingerprint(attemptId)}`, Buffer.from(String(Date.now())), {
      contentType: 'text/plain',
      upsert: false,
    });
  if (claimError) {
    const status = String((claimError as { statusCode?: string | number }).statusCode ?? '');
    if (status === '409' || /exist|duplicate/i.test(claimError.message)) {
      return NextResponse.json(
        { error: 'That pose was already submitted. Here is a new one to copy.' },
        { status: 410 }
      );
    }
    console.error('[verify/submit] attempt claim failed:', claimError.message);
    return NextResponse.json({ error: 'Could not start verification. Please try again.' }, { status: 500 });
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
  // Explicit "no face" / "several faces" from the AI: reject now, nothing stored, not pending.
  // (An AI error or timeout still queues the selfie for a human, per the fail-safe rule.)
  if (ai && ai.face_count !== 1) {
    return NextResponse.json(
      { error: ai.face_count === 0 ? NO_FACE_ERROR : 'Biometric validation failed: Only one person may be in the photo' },
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

  // Portrait: stored next to the pose photo, never publicly readable (signed URLs for admins only).
  let facePath: string | null = null;
  if (facePhoto) {
    const { error: faceUploadError } = await service.storage
      .from('verifications')
      .upload(`${userId}/face.jpg`, facePhoto, { contentType: 'image/jpeg', upsert: true });
    if (faceUploadError) {
      console.error('[verify/submit] portrait upload failed:', faceUploadError.message);
      return NextResponse.json({ error: 'Could not store your verification photo. Please try again.' }, { status: 500 });
    }
    facePath = `${userId}/face.jpg`;
  }

  const fastTrack = isFastTrack(ai);
  const capture = { face: captureMode(form.get('faceCheck'), 'face_capture'), pose: captureMode(form.get('faceCheck'), 'pose_capture') };

  // Review metadata for /admin/verifications (reads the newest `<stamp>_meta.json`).
  const stamp = Date.now();
  const { error: metaError } = await service.storage
    .from('verifications')
    .upload(
      `${userId}/${stamp}_meta.json`,
      Buffer.from(
        JSON.stringify({ poses: pose.label, pose_id: pose.id, selfie_path: selfiePath, face_path: facePath, capture, ai, fast_track: fastTrack })
      ),
      { contentType: 'application/json', upsert: true }
    );
  if (metaError) console.warn('[verify/submit] review metadata not saved:', metaError.message);

  // Audit record (supabase/migrations/20261111_fix_verifications.sql). Best effort: the review
  // queue itself is driven by profiles.verification_status, so a missing table never blocks a member.
  // A newer submission supersedes any still-pending one.
  const { error: supersedeError } = await service
    .from('verification_requests')
    .update({ status: 'rejected', rejection_reason: 'Superseded by a newer submission', reviewed_at: new Date().toISOString() })
    .eq('user_id', userId)
    .eq('status', 'pending');
  const { error: requestError } = supersedeError
    ? { error: supersedeError }
    : await service.from('verification_requests').insert({
        user_id: userId,
        face_photo_url: facePath ?? selfiePath,
        pose_photo_url: selfiePath,
        gesture_requested: pose.id,
        status: 'pending',
      });
  if (requestError) console.warn('[verify/submit] verification_requests not recorded:', requestError.message);

  const { error: updateError } = await service
    .from('profiles')
    .update({ verification_status: 'pending' })
    .eq('id', userId);

  if (updateError) {
    console.error('[verify/submit] profile update failed:', updateError.message);
    return NextResponse.json({ error: 'Could not save verification status' }, { status: 500 });
  }

  after(() => notifyAdmins({ kind: 'verification', title: 'New selfie verification to review', ref: userId, actorId: userId }));

  return NextResponse.json({
    verified: false,
    pending: true,
    fastTrack,
    message: fastTrack
      ? 'Your photo looks great - these are usually approved quickly.'
      : 'Our team will review your photo and your verified badge appears once approved.',
  });
}
