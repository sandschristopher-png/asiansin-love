import { NextResponse, after } from 'next/server';
import { createHash } from 'crypto';
import { createClient as createSessionClient } from '@/lib/supabase/server';
import { notifyAdmins } from '@/lib/adminNotify';
import { sendPushToUser } from '@/lib/pushSender';
import { isFastTrack, type SelfieReviewResult } from '@/lib/aiVision';
import { fetchOwnPhoto, imageMimeOf as imageMime, reviewPasses, reviewStepUp, stepUpDb, tokenExpired, verifyStepUp, type StepUpReview } from '@/lib/verify/stepUp';
import { MAX_ATTEMPTS_PER_HOUR, MIN_MATCH_CONFIDENCE, decideFinish, elapsedOk, validPoseLog } from '@/lib/verify/stepUpRules';
import { FACE_MIN_CONFIDENCE } from '@/lib/faceGateMessages';

export const runtime = 'nodejs';
export const maxDuration = 30;

const MAX_FRAME_BYTES = 600 * 1024; // frames are ~480px JPEGs, a few tens of KB each
const MAX_PHOTO_BYTES = 10 * 1024 * 1024;
const AI_TIMEOUT_MS = 15_000;

const isJpeg = (b: Buffer) => b.length > 4 && b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff;

async function readPart(form: FormData, key: string, max: number): Promise<Buffer | null> {
  const part = form.get(key);
  if (!part || typeof part === 'string' || part.size === 0 || part.size > max) return null;
  return Buffer.from(await part.arrayBuffer());
}

function faceCheckOk(raw: FormDataEntryValue | null): boolean {
  if (typeof raw !== 'string') return false;
  try {
    const c = JSON.parse(raw) as Record<string, unknown>;
    return c.detector === 'mediapipe_face_landmarker' && c.face_count === 1 && Number(c.min_confidence) >= FACE_MIN_CONFIDENCE;
  } catch {
    return false;
  }
}

/**
 * POST multipart { token, log, faceCheck, center, pose_0, pose_1, pose_2, photo?, accessibility? }
 *   -> { status: 'passed', challengeId } | { status: 'failed', retriesLeft } | { status: 'manual_review', fastTrack }
 *
 * Checks the signed challenge (member, single use, 5-minute window, at least 4 s on the server's own
 * clock), the client's pose log (each requested pose held >= 600 ms, in order), then pre-screens the
 * neutral frame against the reference photo and one sealed-random pose frame for the head direction.
 * Camera video never reaches the server: only these few still frames. What happens next is
 * lib/verify/stepUpRules.decideFinish: pass, retry, or the staff queue. The verified badge is never granted
 * here: a "verification" check that looks good is queued as a fast-track for a person to approve.
 *
 * accessibility=1 (a member who cannot turn their head): only the straight frame is sent, there is no pose
 * log, and the result always goes to a person.
 */
export async function POST(req: Request) {
  const session = await createSessionClient();
  const { data: { user } } = await session.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }

  const token = verifyStepUp(form.get('token'));
  if (!token || token.u !== user.id) return NextResponse.json({ error: 'Invalid identity check.', code: 'INVALID_TOKEN' }, { status: 401 });
  if (tokenExpired(token)) return NextResponse.json({ error: 'That check expired. Please start again.', code: 'EXPIRED' }, { status: 410 });
  if (elapsedOk(token.t, Date.now()) === 'too_fast') return NextResponse.json({ error: 'The check finished too quickly.', code: 'TOO_FAST' }, { status: 400 });

  const accessibility = form.get('accessibility') === '1';

  let log: unknown = null;
  try {
    log = JSON.parse(String(form.get('log') ?? 'null'));
  } catch {
    // validPoseLog rejects null
  }
  if ((!accessibility && !validPoseLog(token.p, log)) || !faceCheckOk(form.get('faceCheck'))) {
    return NextResponse.json({ error: 'The check was not completed.', code: 'INCOMPLETE' }, { status: 400 });
  }

  const neutral = await readPart(form, 'center', MAX_FRAME_BYTES);
  const poseFrames = accessibility ? [] : await Promise.all([0, 1, 2].map((i) => readPart(form, `pose_${i}`, MAX_FRAME_BYTES)));
  if (!neutral || !isJpeg(neutral) || poseFrames.some((f) => !f || !isJpeg(f))) {
    return NextResponse.json({ error: 'The check photos were not valid.', code: 'INCOMPLETE' }, { status: 400 });
  }

  const db = stepUpDb();

  // Single use: only the first finish for this nonce gets to complete the row.
  const { data: claimed } = await db
    .from('liveness_challenges')
    .update({ completed_at: new Date().toISOString() })
    .eq('nonce', token.n)
    .eq('user_id', user.id)
    .is('completed_at', null)
    .select('id')
    .maybeSingle();
  if (!claimed) return NextResponse.json({ error: 'That check was already used. Please start again.', code: 'USED' }, { status: 410 });
  const challengeId = claimed.id as string;

  const { data: profile } = await db.from('profiles').select('avatar_url').eq('id', user.id).maybeSingle();

  // Reference photo: the photo about to become primary (swap), otherwise the current one.
  let reference: { data: Buffer; mimeType: string } | null = null;
  let photoSha: string | null = null;
  if (token.r === 'photo_swap') {
    const photo = await readPart(form, 'photo', MAX_PHOTO_BYTES);
    const mime = photo ? imageMime(photo) : null;
    if (!photo || !mime) {
      await db.from('liveness_challenges').update({ passed: false, outcome: 'failed' }).eq('id', challengeId);
      return NextResponse.json({ error: 'The new photo was missing.', code: 'INCOMPLETE' }, { status: 400 });
    }
    reference = { data: photo, mimeType: mime };
    photoSha = createHash('sha256').update(photo).digest('hex');
  } else {
    reference = await fetchOwnPhoto(profile?.avatar_url as string | null);
  }

  // The pre-screen needs a pose frame, so the straight-photo path skips it and goes to a person.
  let review: StepUpReview | null = null;
  if (!accessibility) {
    try {
      review = await Promise.race([
        reviewStepUp({ neutral, poseFrame: poseFrames[token.x] as Buffer, pose: token.p[token.x], reference }),
        new Promise<null>((resolve) => setTimeout(() => resolve(null), AI_TIMEOUT_MS)),
      ]);
    } catch {
      review = null;
    }
  }
  const good = Boolean(review && reviewPasses(review, MIN_MATCH_CONFIDENCE));

  let failedBefore = 0;
  if (review && !good) {
    const since = new Date(Date.now() - 60 * 60 * 1000).toISOString();
    const { count } = await db
      .from('liveness_challenges')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .eq('outcome', 'failed')
      .gte('created_at', since);
    failedBefore = count ?? 0;
  }
  const decision = decideFinish({ reason: token.r, reviewPassed: good, aiAvailable: Boolean(review), failedBefore, accessibility });

  const notify = (title: string, description: string) =>
    db
      .from('notifications')
      .insert({ user_id: user.id, type: 'identity', title, description, link_url: '/profile', is_read: false })
      .then(({ error }) => error && console.warn('[step-up] notification failed:', error.message));

  // ---- Passed: lift the restriction and (for a swap) hand back the id that unlocks the commit ----------
  if (decision === 'passed' && review) {
    await db
      .from('liveness_challenges')
      .update({ passed: true, outcome: 'passed', face_match_confidence: review.face_match_confidence, photo_sha256: photoSha })
      .eq('id', challengeId);
    await db.from('profiles').update({ reverification_required: false, reverification_reason: null }).eq('id', user.id).eq('reverification_required', true);
    await notify('Identity confirmed', token.r === 'photo_swap' ? 'Your new main photo can now be saved.' : 'You can message again.');
    after(() => sendPushToUser({ userId: user.id, type: 'identity', body: 'Identity confirmed.', url: '/profile', tag: 'identity' }));
    return NextResponse.json({ status: 'passed', challengeId });
  }

  // ---- Not good enough yet: another go ------------------------------------------------------------------
  if (decision === 'retry' && review) {
    await db
      .from('liveness_challenges')
      .update({ passed: false, outcome: 'failed', face_match_confidence: review.face_match_confidence, photo_sha256: photoSha })
      .eq('id', challengeId);
    return NextResponse.json({ status: 'failed', retriesLeft: MAX_ATTEMPTS_PER_HOUR - (failedBefore + 1) });
  }

  // ---- A person decides: the existing /admin/verifications queue ---------------------------------------
  // Stored the way that screen already reads them: the straight frame as the portrait, every pose frame as
  // `<stamp>_pose_N.jpg` (selfie_path is left empty so all of them show), and the pre-screen in the shape it
  // expects. The photos are deleted again when a submission is rejected.
  const stamp = Date.now();
  const facePath = `${user.id}/face.jpg`;
  const { error: upErr } = await db.storage.from('verifications').upload(facePath, neutral, { contentType: 'image/jpeg', upsert: true });
  if (upErr) console.warn('[step-up] review photo not stored:', upErr.message);
  await Promise.all(
    poseFrames.map((frame, i) =>
      db.storage.from('verifications').upload(`${user.id}/${stamp}_pose_${i}.jpg`, frame as Buffer, { contentType: 'image/jpeg', upsert: true })
    )
  );
  const ai: SelfieReviewResult | null = review
    ? {
        pose_matches: review.pose_direction_ok,
        same_person: review.pose_same_person && review.face_match_confidence >= 50,
        face_match_confidence: review.face_match_confidence,
        spoof_detected: review.spoof_detected,
        face_count: review.face_count,
        summary: review.summary,
      }
    : null;
  const fastTrack = token.r === 'verification' && isFastTrack(ai);
  await db.storage.from('verifications').upload(
    `${user.id}/${stamp}_meta.json`,
    Buffer.from(
      JSON.stringify({
        poses: accessibility ? 'Straight photo (accessibility path, no head turns)' : token.p.join(', '),
        pose_id: 'head_turns',
        selfie_path: null,
        face_path: facePath,
        capture: { face: 'auto', pose: accessibility ? 'manual' : 'auto' },
        ai,
        fast_track: fastTrack,
        trigger: token.r,
        accessibility,
      })
    ),
    { contentType: 'application/json', upsert: true }
  );
  await db.from('verification_requests').update({ status: 'rejected', rejection_reason: 'Superseded by a newer submission', reviewed_at: new Date().toISOString() }).eq('user_id', user.id).eq('status', 'pending');
  await db.from('verification_requests').insert({ user_id: user.id, face_photo_url: facePath, pose_photo_url: facePath, gesture_requested: 'head_turns', status: 'pending' });
  await db.from('profiles').update({ verification_status: 'pending' }).eq('id', user.id);
  await db
    .from('liveness_challenges')
    .update({ passed: false, outcome: 'manual_review', face_match_confidence: review?.face_match_confidence ?? null, photo_sha256: photoSha })
    .eq('id', challengeId);
  await notify('Your check is in review', 'Our team will look at it shortly. We will let you know.');
  after(() => notifyAdmins({ kind: 'verification', ref: user.id, actorId: user.id }));
  return NextResponse.json({ status: 'manual_review', fastTrack });
}
