import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { createClient as createSessionClient } from '@/lib/supabase/server';
import { verifyToken, TOKEN_TTL_MS } from '@/lib/verify/token';
import { evaluateImageWithAI } from '@/lib/aiVision';
import { sendTelegramVerificationAlert } from '@/lib/adminAlerts';

export const runtime = 'nodejs';

const MIN_ELAPSED_MS = 4000;
const MAX_ELAPSED_MS = 90000;
const MAX_PHOTO_BYTES = 10 * 1024 * 1024;
const SIGNED_URL_TTL_SECONDS = 7 * 24 * 60 * 60;
const AI_TIMEOUT_MS = 8000;

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

  // TTL window
  const now = Date.now();
  if (now - payload.issuedAt > TOKEN_TTL_MS) {
    return NextResponse.json({ error: 'Verification session expired. Please retry.' }, { status: 410 });
  }

  // Elapsed time computed SERVER-SIDE from issuedAt - never trust client timestamps
  const elapsed = now - payload.issuedAt;
  if (elapsed < MIN_ELAPSED_MS) {
    return NextResponse.json({ error: 'Verification completed too quickly' }, { status: 400 });
  }
  if (elapsed > MAX_ELAPSED_MS) {
    return NextResponse.json({ error: 'Verification session timed out. Please retry.' }, { status: 410 });
  }

  // Require exactly the number of pose photos the server issued
  const buffers: Buffer[] = [];
  for (let i = 0; i < payload.sequence.length; i++) {
    const blob = form.get(`pose_${i}`);
    if (!blob || typeof blob === 'string') {
      return NextResponse.json({ error: `Missing pose photo ${i + 1}` }, { status: 400 });
    }
    if (blob.type !== 'image/jpeg') {
      return NextResponse.json({ error: `Pose photo ${i + 1} must be JPEG` }, { status: 400 });
    }
    if (blob.size > MAX_PHOTO_BYTES) {
      return NextResponse.json({ error: `Pose photo ${i + 1} exceeds 10MB` }, { status: 400 });
    }
    const buf = Buffer.from(await blob.arrayBuffer());
    if (!looksLikeJpeg(buf)) {
      return NextResponse.json({ error: `Pose photo ${i + 1} is not a valid JPEG` }, { status: 400 });
    }
    buffers.push(buf);
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

  // Persist pose photos privately (bucket "verifications" must be private).
  const stamp = Date.now();
  const paths: string[] = [];
  for (let i = 0; i < buffers.length; i++) {
    const path = `${userId}/${stamp}_pose_${i}.jpg`;
    const { error: uploadError } = await service.storage
      .from('verifications')
      .upload(path, buffers[i], { contentType: 'image/jpeg', upsert: false });
    if (uploadError) {
      console.error('[verify/submit] upload failed:', uploadError.message);
      return NextResponse.json(
        { error: 'Could not store your verification photos. Please try again.' },
        { status: 500 }
      );
    }
    paths.push(path);
  }

  // The gesture check happens in the browser and can be faked, so the badge is
  // NEVER granted here. We mark the profile pending and ask a human to review.
  const { error: updateError } = await service
    .from('profiles')
    .update({ verification_status: 'pending' })
    .eq('id', userId);

  if (updateError) {
    console.error('[verify/submit] profile update failed:', updateError.message);
    return NextResponse.json({ error: 'Could not save verification status' }, { status: 500 });
  }

  // Build reviewer links (signed URLs, 7 days) and send the Telegram review request.
  const signedUrls: string[] = [];
  for (const p of paths) {
    const { data: signed } = await service.storage
      .from('verifications')
      .createSignedUrl(p, SIGNED_URL_TTL_SECONDS);
    if (signed?.signedUrl) signedUrls.push(signed.signedUrl);
  }

  let aiVerdict:
    | { isSafe: boolean; poseMatchesPrompt: boolean; reason: string }
    | undefined;
  try {
    const ai = await Promise.race([
      evaluateImageWithAI(buffers[0], 'image/jpeg', payload.sequence[0]),
      new Promise<null>((resolve) => setTimeout(() => resolve(null), AI_TIMEOUT_MS)),
    ]);
    // evaluateImageWithAI fails open (reports "safe") on errors; don't show that as a real result.
    if (ai && !/bypassed/i.test(ai.reason || '')) {
      aiVerdict = {
        isSafe: Boolean(ai.isSafe) && !ai.isSexuallySuggestive,
        poseMatchesPrompt: Boolean(ai.poseMatchesPrompt),
        reason: ai.reason,
      };
    }
  } catch (e) {
    console.warn('[verify/submit] AI pre-check skipped:', e);
  }

  if (signedUrls.length > 0) {
    await sendTelegramVerificationAlert({
      userId,
      poseRequested: payload.sequence.join(' then '),
      selfieUrl: signedUrls[0],
      extraSelfieUrls: signedUrls.slice(1),
      avatarUrl: profile?.avatar_url || '(no avatar uploaded)',
      aiVerdict,
    });
  } else {
    console.error('[verify/submit] no signed URLs - reviewer was not notified for', userId);
  }

  return NextResponse.json({
    verified: false,
    pending: true,
    message: 'Submitted for review. Your verified badge appears once our team approves your photos.',
  });
}
