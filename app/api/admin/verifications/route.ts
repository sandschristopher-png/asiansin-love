// app/api/admin/verifications/route.ts
// Internal review queue (admin session required):
//   GET  -> pending identity verifications, pending main photos, open member reports
//   POST -> { kind: 'identity' | 'avatar', userId, action: 'approve' | 'reject', reason? }
//           { kind: 'report', reportId, action: 'approve' (confirm, -20 rep) | 'reject' (dismiss) }
import { NextRequest, NextResponse } from 'next/server';
import type { SupabaseClient } from '@supabase/supabase-js';
import { verifyAdminCaller } from '@/lib/adminAuth';
import { REPUTATION_RULES } from '@/lib/reputation';
import { isFastTrack, type SelfieReviewResult } from '@/lib/aiVision';

export const runtime = 'nodejs';

const SIGNED_URL_TTL_SECONDS = 60 * 60;
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** How each photo was taken: 'auto' (live detection) or 'manual' (the member tapped the capture button). */
type CaptureInfo = { face: 'auto' | 'manual' | null; pose: 'auto' | 'manual' | null };

/** Legacy (multi-pose) pre-check shape, still present on older submissions. */
type LegacyAiVerdict = { isSafe: boolean; poseMatchesPrompt: boolean; reason: string };

function asSelfieReview(v: unknown): SelfieReviewResult | null {
  const r = v as Partial<SelfieReviewResult> | null;
  return r && typeof r.same_person === 'boolean' && typeof r.pose_matches === 'boolean'
    ? (r as SelfieReviewResult)
    : null;
}

/**
 * Latest submission for a user: signed URL(s) for the selfie, the required pose and the stored
 * Gemini pre-screen. Metadata lives in `<stamp>_meta.json`; the selfie at `<userId>/selfie.jpg`.
 */
async function latestSubmission(admin: SupabaseClient, userId: string) {
  const { data: files } = await admin.storage
    .from('verifications')
    .list(userId, { limit: 100, sortBy: { column: 'name', order: 'desc' } });

  const names = (files || []).map((f) => f.name);
  const stamps = names.map((n) => n.split('_')[0]).filter((s) => /^\d+$/.test(s));
  if (stamps.length === 0) {
    return { submittedAt: null, photos: [] as string[], facePhoto: null as string | null, capture: null as CaptureInfo | null, poses: null, poseId: null, ai: null, review: null, fastTrack: false };
  }
  const latest = stamps.reduce((a, b) => (Number(b) > Number(a) ? b : a));

  let ai: LegacyAiVerdict | null = null;
  let review: SelfieReviewResult | null = null;
  let poses: string | null = null;
  let poseId: string | null = null;
  let selfiePath: string | null = null;
  let facePath: string | null = null;
  let capture: CaptureInfo | null = null;
  if (names.includes(`${latest}_meta.json`)) {
    const { data: blob } = await admin.storage.from('verifications').download(`${userId}/${latest}_meta.json`);
    if (blob) {
      try {
        const meta = JSON.parse(await blob.text());
        review = asSelfieReview(meta.ai);
        ai = review ? null : meta.ai ?? null;
        poses = typeof meta.poses === 'string' ? meta.poses : null;
        poseId = typeof meta.pose_id === 'string' ? meta.pose_id : null;
        // Only paths inside this member's own folder are signed.
        if (typeof meta.selfie_path === 'string' && meta.selfie_path.startsWith(`${userId}/`)) {
          selfiePath = meta.selfie_path;
        }
        if (typeof meta.face_path === 'string' && meta.face_path.startsWith(`${userId}/`)) {
          facePath = meta.face_path;
        }
        const mode = (v: unknown) => (v === 'auto' || v === 'manual' ? v : null);
        if (meta.capture && typeof meta.capture === 'object') {
          capture = { face: mode(meta.capture.face), pose: mode(meta.capture.pose) };
        }
      } catch {
        // malformed metadata: show the photos without it
      }
    }
  }

  const photoPaths = selfiePath
    ? [selfiePath]
    : names
        .filter((n) => n.startsWith(`${latest}_pose_`))
        .sort()
        .map((n) => `${userId}/${n}`);

  const { data: signed } = photoPaths.length
    ? await admin.storage.from('verifications').createSignedUrls(photoPaths, SIGNED_URL_TTL_SECONDS)
    : { data: [] };
  // Step 1 portrait (1-hour signed URL, like the pose photo).
  const { data: faceSigned } = facePath
    ? await admin.storage.from('verifications').createSignedUrl(facePath, SIGNED_URL_TTL_SECONDS)
    : { data: null };

  return {
    submittedAt: new Date(Number(latest)).toISOString(),
    photos: (signed || []).map((s) => s.signedUrl).filter(Boolean) as string[],
    facePhoto: faceSigned?.signedUrl ?? null,
    capture,
    poses,
    poseId,
    ai,
    review,
    // Recomputed from the stored result so the threshold lives in one place.
    fastTrack: isFastTrack(review),
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
        .select('id, username, avatar_url, city, country, age, birthdate')
        .eq('verification_status', 'pending')
        .limit(50),
      admin
        .from('profiles')
        .select('id, username, avatar_url, gender')
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

    const identity = (
      await Promise.all(
        (identityRes.data || []).map(async (p) => ({ ...p, submission: await latestSubmission(admin, p.id) }))
      )
    )
      // Fast-track candidates first, then oldest submissions.
      .sort(
        (a, b) =>
          Number(b.submission.fastTrack) - Number(a.submission.fastTrack) ||
          String(a.submission.submittedAt || '').localeCompare(String(b.submission.submittedAt || ''))
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

  let body: { kind?: string; userId?: string; reportId?: string; action?: string; reason?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const { kind, userId, action } = body;
  const reason = typeof body.reason === 'string' ? body.reason.trim().slice(0, 300) : '';

  if (kind === 'report') {
    return decideReport(admin, body.reportId, action);
  }

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
      })
      .eq('id', userId)
      .select('id');

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    if (!data || data.length === 0) return NextResponse.json({ error: 'User not found' }, { status: 404 });

    // History row (supabase/migrations/20261111_fix_verifications.sql); best effort, never blocks a decision.
    const { error: requestErr } = await admin
      .from('verification_requests')
      .update({
        status: approve ? 'approved' : 'rejected',
        rejection_reason: approve ? null : reason || null,
        reviewed_by: auth.adminId,
        reviewed_at: new Date().toISOString(),
      })
      .eq('user_id', userId)
      .eq('status', 'pending');
    if (requestErr) console.warn('[admin/verifications] verification_requests not updated:', requestErr.message);

    // Approved members who already finished onboarding join the Day 1 cohort if a slot is left
    // (the claim also runs at POST /api/onboarding for members verified before finishing).
    if (approve) {
      const { error: slotErr } = await admin.rpc('claim_day_one_slot', { p_user_id: userId });
      if (slotErr) console.warn('[admin/verifications] day one claim skipped:', slotErr.message);
    }

    // Rejected: purge the portrait and pose photo (and any legacy pose photos); the small review-metadata JSON stays
    // as an audit trail of the decision.
    if (!approve) {
      const { data: files } = await admin.storage.from('verifications').list(userId, { limit: 100 });
      const photos = (files || [])
        .map((f) => f.name)
        .filter((n) => n === 'selfie.jpg' || n === 'face.jpg' || /_pose_\d+\.jpg$/.test(n))
        .map((n) => `${userId}/${n}`);
      if (photos.length > 0) {
        const { error: purgeErr } = await admin.storage.from('verifications').remove(photos);
        if (purgeErr) console.warn('[admin/verifications] selfie purge failed:', purgeErr.message);
      }
    }

    const { error: notifErr } = await admin.from('notifications').insert({
      user_id: userId,
      type: 'verification',
      title: approve ? 'Identity verified' : 'Verification update',
      description: approve
        ? 'Your identity has been verified. The verified checkmark is now active on your profile.'
        : 'Your selfie verification could not be approved.' +
          (reason ? ` Reason: ${reason}.` : '') +
          ' Please submit a new photo following the instructions.',
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

/**
 * Confirm (-20 reputation for the reported member) or dismiss an open report. The status flip is
 * conditional on 'pending', so a double click can never apply the penalty twice.
 */
async function decideReport(admin: SupabaseClient, reportId: unknown, action: unknown) {
  if (typeof reportId !== 'string' || !UUID_RE.test(reportId) || (action !== 'approve' && action !== 'reject')) {
    return NextResponse.json({ error: 'reportId and action (approve | reject) are required' }, { status: 400 });
  }
  const confirm = action === 'approve';

  const { data: rows, error } = await admin
    .from('user_reports')
    .update({ status: confirm ? 'resolved' : 'dismissed' })
    .eq('id', reportId)
    .eq('status', 'pending')
    .select('id, reported_id, reason');
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  const report = rows?.[0];
  if (!report) return NextResponse.json({ error: 'Report not found or already handled' }, { status: 404 });

  if (confirm) {
    const { error: penErr } = await admin.rpc('apply_moderation_penalty', {
      p_user_id: report.reported_id,
      p_deduction: REPUTATION_RULES.confirmedReport,
      p_action: 'report_confirmed',
      p_category: 'confirmed_report',
      p_flagged: String(report.reason || '').slice(0, 300),
    });
    if (penErr) {
      // Put the report back so it can be retried.
      await admin.from('user_reports').update({ status: 'pending' }).eq('id', reportId);
      return NextResponse.json({ error: penErr.message }, { status: 500 });
    }
  }

  return NextResponse.json({ success: true, status: confirm ? 'resolved' : 'dismissed' });
}
