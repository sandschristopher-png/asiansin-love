import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { createClient as createSessionClient } from '@/lib/supabase/server';
import { verifyToken, TOKEN_TTL_MS } from '@/lib/verify/token';

const MIN_ELAPSED_MS = 4000;
const MAX_ELAPSED_MS = 90000;
const MAX_PHOTO_BYTES = 10 * 1024 * 1024;

function getServiceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

export async function POST(req: Request) {
  const supabase = createSessionClient();
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
  const blobs: Blob[] = [];
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
    blobs.push(blob);
  }

  // Persist pose photos privately for audit
  const service = getServiceClient();
  for (let i = 0; i < blobs.length; i++) {
    const buf = Buffer.from(await blobs[i].arrayBuffer());
    const path = `${userId}/${Date.now()}_pose_${i}.jpg`;
    const { error: uploadError } = await service.storage
      .from('verifications')
      .upload(path, buf, { contentType: 'image/jpeg', upsert: false });
    if (uploadError) {
      console.error('[verify/submit] upload failed:', uploadError.message);
      // Non-fatal: don't block verification on storage hiccup
    }
  }

  // Flip verification status
  const { error: updateError } = await service
    .from('profiles')
    .update({ is_verified: true })
    .eq('id', userId);

  if (updateError) {
    console.error('[verify/submit] profile update failed:', updateError.message);
    return NextResponse.json({ error: 'Could not save verification status' }, { status: 500 });
  }

  return NextResponse.json({ verified: true });
}