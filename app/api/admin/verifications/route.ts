// app/api/admin/verifications/route.ts
// Internal review queue (admin session required):
//   GET  -> pending identity verifications, pending main photos, open member reports
//   POST -> { kind: 'identity' | 'avatar', userId, action: 'approve' | 'reject' }
import { NextRequest, NextResponse } from 'next/server';
import type { SupabaseClient } from '@supabase/supabase-js';
import { verifyAdminCaller } from '@/lib/adminAuth';

export const runtime = 'nodejs';

const SIGNED_URL_TTL_SECONDS = 60 * 60;
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

type AiVerdict = { isSafe: boolean; poseMatchesPrompt: boolean; reason: string };

/** Latest submission for a user: signed URLs for its pose photos plus the stored AI pre-check. */
async function latestSubmission(admin: SupabaseClient, userId: string) {
  const { data: files } = await admin.storage
    .from('verifications')
    .list(userId, { limit: 100, sortBy: { column: 'name', order: 'desc' } });

  const names = (files || []).map((f) => f.name);
  const stamps = names.map((n) => n.split('_')[0]).filter((s) => /^\d+$/.test(s));
  if (stamps.length === 0) return { submittedAt: null, photos: [] as string[], poses: null, ai: null };
  const latest = stamps.reduce((a, b) => (Number(b) > Number(a) ? b : a));

  const photoPaths = names
    .filter((n) => n.startsWith(`${latest}_pose_`))
    .sort()
    .map((n) => `${userId}/${n}`);

  const { data: signed } = photoPaths.length
    ? await admin.storage.from('verifications').createSignedUrls(photoPaths, SIGNED_URL_TTL_SECONDS)
    : { data: [] };

  let ai: AiVerdict | null = null;
  let poses: string | null = null;
  if (names.includes(`${latest}_meta.json`)) {
    const { data: blob } = await admin.storage.from('verifications').download(`${userId}/${latest}_meta.json`);
    if (blob) {
      try {
        const meta = JSON.parse(await blob.text());
        ai = meta.ai ?? null;
        poses = typeof meta.poses === 'string' ? meta.poses : null;
      } catch {
        // malformed metadata: show the photos without it
      }
    }
  }

  return {
    submittedAt: new Date(Number(latest)).toISOString(),
    photos: (signed || []).map((s) => s.signedUrl).filter(Boolean) as string[],
    poses,
    ai,
  };
}

export async function GET() {
  const auth = await verifyAdminCaller();
  if (!auth.authorized) return NextResponse.json({ error: auth.error }, { status: auth.status });
  const admin = auth.supabase;

  try {
    const [identityRes, avatarRes, reportsRes] = await Promise.all([
      admin
        .from('profiles')
        .select('id, username, full_name, avatar_url, city, country')
        .eq('verification_status', 'pending')
        .limit(50),
      admin
        .from('profiles')
        .select('id, username, full_name, avatar_url, gender')
        .eq('avatar_status', 'pending_review')
        .limit(50),
      admin
        .from('user_reports')
        .select('*')
        .eq('status', 'pending')
        .order('created_at', { ascending: false })
        .limit(50),
    ]);

    if (identityRes.error) throw new Error(identityRes.error.message);
    if (avatarRes.error) throw new Error(avatarRes.error.message);

    const identity = await Promise.all(
      (identityRes.data || []).map(async (p) => ({ ...p, submission: await latestSubmission(admin, p.id) }))
    );

    return NextResponse.json({
      identity,
      avatars: avatarRes.data || [],
      // Reports are informational here; a missing table should not break the review queue.
      reports: reportsRes.error ? [] : reportsRes.data || [],
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const auth = await verifyAdminCaller();
  if (!auth.authorized) return NextResponse.json({ error: auth.error }, { status: auth.status });
  const admin = auth.supabase;

  let body: { kind?: string; userId?: string; action?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const { kind, userId, action } = body;
  if (!userId || !UUID_RE.test(userId) || (action !== 'approve' && action !== 'reject')) {
    return NextResponse.json({ error: 'userId and action (approve | reject) are required' }, { status: 400 });
  }
  const approve = action === 'approve';

  if (kind === 'identity') {
    const target = approve ? 'verified' : 'rejected';
    const { data, error } = await admin
      .from('profiles')
      .update({
        verification_status: target,
        is_verified: approve,
        verified_at: approve ? new Date().toISOString() : null,
      })
      .eq('id', userId)
      .select('id');

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    if (!data || data.length === 0) return NextResponse.json({ error: 'User not found' }, { status: 404 });

    const { error: notifErr } = await admin.from('notifications').insert({
      user_id: userId,
      type: 'verification',
      title: approve ? 'Identity Verified! ✅' : 'Verification Update',
      description: approve
        ? 'Your identity has been verified. The verified checkmark is now active on your profile.'
        : 'Your selfie verification could not be approved. Please submit a new photo following the instructions.',
      link_url: approve ? '/profile' : '/verify',
    });
    if (notifErr) console.warn('[admin/verifications] notification insert failed:', notifErr.message);

    return NextResponse.json({ success: true, status: target });
  }

  if (kind === 'avatar') {
    const { data, error } = await admin
      .from('profiles')
      .update({
        avatar_status: approve ? 'approved' : 'rejected',
        avatar_approved_at: approve ? new Date().toISOString() : null,
      })
      .eq('id', userId)
      .select('id');

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    if (!data || data.length === 0) return NextResponse.json({ error: 'User not found' }, { status: 404 });

    if (!approve) {
      const { error: notifErr } = await admin.from('notifications').insert({
        user_id: userId,
        type: 'system',
        title: 'Main photo not approved',
        description: 'Your main photo did not meet our photo guidelines. Please upload a clear photo of your face.',
        link_url: '/profile/edit',
      });
      if (notifErr) console.warn('[admin/verifications] notification insert failed:', notifErr.message);
    }

    return NextResponse.json({ success: true, status: approve ? 'approved' : 'rejected' });
  }

  return NextResponse.json({ error: 'kind must be "identity" or "avatar"' }, { status: 400 });
}
