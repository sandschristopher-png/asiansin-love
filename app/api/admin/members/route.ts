// app/api/admin/members/route.ts  (super_admin only)
//   GET ?q=<username or display name>  -> matching members (staff first when q is empty)
//   POST { userId, action: 'set_reputation', score } | { action: 'set_verified', verified } | { action: 'set_banned', banned }
import { NextRequest, NextResponse } from 'next/server';
import { verifyAdminCaller, adminRoleOf } from '@/lib/adminAuth';
import { canActOn, logModeration, setBanned } from '@/lib/adminActions';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function ageOf(p: any): number | null {
  if (typeof p.age === 'number') return p.age;
  if (!p.birthdate) return null;
  const b = new Date(p.birthdate);
  if (Number.isNaN(b.getTime())) return null;
  return Math.floor((Date.now() - b.getTime()) / (365.25 * 24 * 3600 * 1000));
}

const memberRow = (p: any) => ({
  id: p.id,
  name: String(p.username || p.display_name || p.full_name || 'Member').replace(/^@/, ''),
  displayName: p.display_name || p.full_name || null,
  age: ageOf(p),
  location: [p.city, p.country].filter(Boolean).join(', ') || null,
  avatarUrl: p.avatar_url || null,
  reputation: typeof p.reputation_score === 'number' ? p.reputation_score : 100,
  isVerified: p.is_verified === true || p.verification_status === 'verified',
  isBanned: p.is_banned === true,
  role: adminRoleOf(p),
});

export async function GET(req: NextRequest) {
  const auth = await verifyAdminCaller('super_admin');
  if (!auth.authorized) return NextResponse.json({ error: auth.error }, { status: auth.status });
  const admin = auth.supabase;

  // Strip PostgREST filter syntax characters before building the or() filter.
  const q = (req.nextUrl.searchParams.get('q') || '').replace(/[^\p{L}\p{N} _.-]/gu, '').trim().slice(0, 40);
  let query = admin.from('profiles').select('*').limit(40);
  if (q) {
    query = query.or(`username.ilike.%${q}%,display_name.ilike.%${q}%,full_name.ilike.%${q}%`);
  } else {
    // No search: show current staff (admin_role, or the legacy role / is_admin flags).
    query = query.or('admin_role.in.(moderator,super_admin),role.eq.admin,is_admin.eq.true');
  }
  let { data, error } = await query;
  if (error && !q) {
    ({ data, error } = await admin.from('profiles').select('*').or('role.eq.admin,is_admin.eq.true').limit(40));
  }
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const order = { super_admin: 0, moderator: 1, member: 2 } as const;
  const members = (data || []).map(memberRow).sort((a, b) => order[a.role] - order[b.role] || a.name.localeCompare(b.name));
  return NextResponse.json({ members });
}

export async function POST(req: NextRequest) {
  const auth = await verifyAdminCaller('super_admin');
  if (!auth.authorized) return NextResponse.json({ error: auth.error }, { status: auth.status });
  const admin = auth.supabase;

  let body: { userId?: string; action?: string; score?: number; verified?: boolean; banned?: boolean };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }
  const { userId, action } = body;
  if (!userId || !UUID_RE.test(userId)) return NextResponse.json({ error: 'userId is required.' }, { status: 400 });

  const allowed = await canActOn(admin, auth.role, auth.adminId, userId);
  if (!allowed.ok) return NextResponse.json({ error: allowed.error }, { status: allowed.status });

  if (action === 'set_reputation') {
    const score = Number(body.score);
    if (!Number.isFinite(score) || score < 0 || score > 100) {
      return NextResponse.json({ error: 'Reputation must be between 0 and 100.' }, { status: 400 });
    }
    const next = Math.round(score);
    const { error } = await admin.from('profiles').update({ reputation_score: next }).eq('id', userId);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    const before = typeof allowed.target.reputation_score === 'number' ? allowed.target.reputation_score : 100;
    await logModeration(admin, {
      userId,
      actorId: auth.adminId,
      category: 'manual_adjustment',
      action: 'reputation_set',
      text: `${before} -> ${next}`,
      points: Math.max(0, before - next),
    });
    return NextResponse.json({ success: true, reputation: next });
  }

  if (action === 'set_verified') {
    const verified = body.verified === true;
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

  if (action === 'set_banned') {
    const banned = body.banned === true;
    const result = await setBanned(admin, userId, banned);
    if (!result.ok) return NextResponse.json({ error: result.error }, { status: result.status });
    await logModeration(admin, {
      userId,
      actorId: auth.adminId,
      category: 'manual_adjustment',
      action: banned ? 'banned' : 'unbanned',
    });
    return NextResponse.json({ success: true, isBanned: banned });
  }

  return NextResponse.json({ error: 'Unknown action.' }, { status: 400 });
}
