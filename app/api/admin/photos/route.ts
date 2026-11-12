// app/api/admin/photos/route.ts  (staff only)
//   GET  -> members whose photos await review (photo_review_status 'pending', else avatar_status 'pending_review')
//   POST { userId, action: 'approve' | 'reject' | 'verify' | 'unverify', removePhotos?, reason?, points? }
import { NextRequest, NextResponse } from 'next/server';
import { verifyAdminCaller } from '@/lib/adminAuth';
import { adjustReputation, canActOn, logModeration, MISSING_ADMIN_COLUMNS_RE } from '@/lib/adminActions';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const PENALTY_STEPS = [0, 5, 10, 20];

function ageOf(p: any): number | null {
  if (typeof p.age === 'number') return p.age;
  if (!p.birthdate) return null;
  const b = new Date(p.birthdate);
  if (Number.isNaN(b.getTime())) return null;
  const now = new Date();
  let a = now.getFullYear() - b.getFullYear();
  if (now.getMonth() < b.getMonth() || (now.getMonth() === b.getMonth() && now.getDate() < b.getDate())) a--;
  return a;
}

export async function GET() {
  const auth = await verifyAdminCaller();
  if (!auth.authorized) return NextResponse.json({ error: auth.error }, { status: auth.status });
  const admin = auth.supabase;

  let { data: rows, error } = await admin
    .from('profiles')
    .select('*')
    .or('photo_review_status.eq.pending,avatar_status.eq.pending_review')
    .order('updated_at', { ascending: false })
    .limit(60);
  if (error && MISSING_ADMIN_COLUMNS_RE.test(error.message)) {
    ({ data: rows, error } = await admin
      .from('profiles')
      .select('*')
      .eq('avatar_status', 'pending_review')
      .order('updated_at', { ascending: false })
      .limit(60));
  }
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({
    members: (rows || []).map((p) => {
      const photos: string[] = Array.isArray(p.photos) ? p.photos.filter((u: unknown) => typeof u === 'string') : [];
      if (p.avatar_url && !photos.includes(p.avatar_url)) photos.unshift(p.avatar_url);
      return {
        id: p.id,
        name: String(p.username || `Member ${String(p.id).slice(0, 8)}`).replace(/^@/, ''),
        age: ageOf(p),
        location: [p.city, p.country].filter(Boolean).join(', ') || null,
        avatarUrl: p.avatar_url || null,
        photos,
        uploadedAt: p.updated_at || p.created_at || null,
        reputation: typeof p.reputation_score === 'number' ? p.reputation_score : 100,
        isVerified: p.is_verified === true || p.verification_status === 'verified',
      };
    }),
  });
}

export async function POST(req: NextRequest) {
  const auth = await verifyAdminCaller();
  if (!auth.authorized) return NextResponse.json({ error: auth.error }, { status: auth.status });
  const admin = auth.supabase;

  let body: { userId?: string; action?: string; removePhotos?: string[]; reason?: string; points?: number };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }
  const { userId, action } = body;
  if (!userId || !UUID_RE.test(userId) || !['approve', 'reject', 'verify', 'unverify'].includes(String(action))) {
    return NextResponse.json({ error: 'userId and action (approve | reject | verify | unverify) are required.' }, { status: 400 });
  }

  const { data: profile } = await admin.from('profiles').select('*').eq('id', userId).maybeSingle();
  if (!profile) return NextResponse.json({ error: 'Member not found.' }, { status: 404 });

  if (action === 'verify' || action === 'unverify') {
    const verified = action === 'verify';
    const { error } = await admin
      .from('profiles')
      .update({
        is_verified: verified,
        verification_status: verified ? 'verified' : 'unverified',
      })
      .eq('id', userId);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ success: true, isVerified: verified });
  }

  if (action === 'approve') {
    let { error } = await admin
      .from('profiles')
      .update({ photo_review_status: 'approved', avatar_status: 'approved', avatar_approved_at: new Date().toISOString() })
      .eq('id', userId);
    if (error && MISSING_ADMIN_COLUMNS_RE.test(error.message)) {
      ({ error } = await admin
        .from('profiles')
        .update({ avatar_status: 'approved', avatar_approved_at: new Date().toISOString() })
        .eq('id', userId));
    }
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ success: true, status: 'approved' });
  }

  // Reject: drop the flagged photos (default: the main photo), notify, optional penalty.
  const points = Number(body.points ?? 0);
  if (!PENALTY_STEPS.includes(points)) return NextResponse.json({ error: 'Penalty must be 0, 5, 10 or 20.' }, { status: 400 });
  if (points > 0) {
    const allowed = await canActOn(admin, auth.role, auth.adminId, userId);
    if (!allowed.ok) return NextResponse.json({ error: allowed.error }, { status: allowed.status });
  }

  const photos: string[] = Array.isArray(profile.photos) ? profile.photos : [];
  const flagged = new Set(
    Array.isArray(body.removePhotos) && body.removePhotos.length > 0
      ? body.removePhotos.filter((u) => typeof u === 'string')
      : [profile.avatar_url].filter(Boolean)
  );
  const remaining = photos.filter((u) => !flagged.has(u));
  const avatarRemoved = profile.avatar_url && flagged.has(profile.avatar_url);
  const update: Record<string, unknown> = {
    photos: remaining,
    photo_review_status: 'rejected',
    avatar_status: 'rejected',
    avatar_approved_at: null,
  };
  if (avatarRemoved) update.avatar_url = remaining[0] || null;

  let { error } = await admin.from('profiles').update(update).eq('id', userId);
  if (error && MISSING_ADMIN_COLUMNS_RE.test(error.message)) {
    delete update.photo_review_status;
    ({ error } = await admin.from('profiles').update(update).eq('id', userId));
  }
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const reason = typeof body.reason === 'string' ? body.reason.trim().slice(0, 200) : '';
  const { error: notifErr } = await admin.from('notifications').insert({
    user_id: userId,
    type: 'system',
    title: 'Photo not approved',
    description:
      'One or more of your photos did not meet our photo guidelines and was removed.' +
      (reason ? ` Reason: ${reason}.` : '') +
      ' Please upload a clear, recent photo of yourself.',
    link_url: '/profile/edit',
  });
  if (notifErr) console.warn('[admin/photos] notification insert failed:', notifErr.message);

  if (points > 0) await adjustReputation(admin, userId, -points);
  await logModeration(admin, {
    userId,
    actorId: auth.adminId,
    category: 'photo_guidelines',
    action: 'photo_rejected',
    text: `${flagged.size} photo(s) removed${reason ? ` | ${reason}` : ''}`,
    points,
  });

  return NextResponse.json({ success: true, status: 'rejected', removed: flagged.size });
}
