import { NextRequest, NextResponse } from 'next/server';
import { createClient as createSessionClient } from '@/lib/supabase/server';
import { createClient } from '@supabase/supabase-js';

const ALLOWED_MIME = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_FILE_BYTES = 10 * 1024 * 1024;

function getServiceClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error('Missing SUPABASE_SERVICE_ROLE_KEY environment variable');
  }
  return createClient(url, key);
}

export async function POST(req: NextRequest) {
  try {
    const supabase = await createSessionClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const form = await req.formData();
    const attemptId = String(form.get('attemptId') || '');
    const blinkVerified = form.get('blinkVerified') === 'true';

    // Collect pose_0..pose_N until the series ends
    const files: File[] = [];
    for (let i = 0; ; i++) {
      const f = form.get(`pose_${i}`);
      if (!(f instanceof File)) break;
      files.push(f);
    }

    if (!attemptId || files.length === 0) {
      return NextResponse.json({ error: 'attemptId and pose photos required' }, { status: 400 });
    }

    // Verify attempt ownership and that it hasn't been submitted already
    const { data: attempt } = await supabase
      .from('verification_attempts')
      .select('id, user_id, status, photo_paths, pose_sequence')
      .eq('id', attemptId)
      .eq('user_id', user.id)
      .maybeSingle();

    if (!attempt) {
      return NextResponse.json({ error: 'Attempt not found' }, { status: 404 });
    }
    if (attempt.status !== 'pending' || (attempt.photo_paths && attempt.photo_paths.length > 0)) {
      return NextResponse.json({ error: 'This attempt was already submitted' }, { status: 409 });
    }

    // File count must match the server-issued sequence for this attempt
    const seq = Array.isArray(attempt.pose_sequence) ? attempt.pose_sequence : [];
    if (files.length !== seq.length) {
      return NextResponse.json(
        { error: `Expected ${seq.length} pose photos, got ${files.length}` },
        { status: 400 }
      );
    }
    for (const f of files) {
      if (!ALLOWED_MIME.includes(f.type)) {
        return NextResponse.json({ error: 'Only JPEG, PNG, or WebP images allowed' }, { status: 400 });
      }
      if (f.size > MAX_FILE_BYTES) {
        return NextResponse.json({ error: 'Each photo must be under 10MB' }, { status: 400 });
      }
    }

    // Privileged writes: storage upload + row update via service role
    const admin = getServiceClient();
    const paths: string[] = [];
    for (let i = 0; i < files.length; i++) {
      const path = `${user.id}/${attemptId}/pose-${i}.png`;
      const buf = Buffer.from(await files[i].arrayBuffer());
      const { error: upErr } = await admin.storage
        .from('verifications')
        .upload(path, buf, { contentType: files[i].type, upsert: true });
      if (upErr) {
        console.error('storage upload failed:', upErr.message);
        return NextResponse.json({ error: 'Upload failed' }, { status: 500 });
      }
      paths.push(path);
    }

    // Auto-verify when the client liveness gates passed; otherwise pending review
    const attemptStatus = blinkVerified ? 'verified' : 'submitted';
    const { error: updErr } = await admin
      .from('verification_attempts')
      .update({ photo_paths: paths, status: attemptStatus, submitted_at: new Date().toISOString() })
      .eq('id', attemptId);
    if (updErr) {
      console.error('attempt update failed:', updErr.message);
      return NextResponse.json({ error: 'Failed to finalize submission' }, { status: 500 });
    }

    if (blinkVerified) {
      const { error: profErr } = await admin
        .from('profiles')
        .update({ is_verified: true })
        .eq('id', user.id);
      if (profErr) {
        console.error('profile verify update failed:', profErr.message);
        return NextResponse.json({ error: 'Failed to apply verified badge' }, { status: 500 });
      }
    }

    return NextResponse.json({ ok: true, verified: blinkVerified });
  } catch (err) {
    console.error('verify/submit error:', err);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}