// app/api/admin/roles/route.ts  (super_admin only)
//   POST { userId, role: 'member' | 'moderator' }
// Guardrails: moderators get 403; the account owner can't be changed and is the only one who can
// demote another super admin; nobody changes their own role. Super admin is never granted here.
import { NextRequest, NextResponse } from 'next/server';
import { verifyAdminCaller } from '@/lib/adminAuth';
import { canActOn, logModeration, MISSING_ADMIN_COLUMNS_RE, RUN_MIGRATION_MESSAGE } from '@/lib/adminActions';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function POST(req: NextRequest) {
  const auth = await verifyAdminCaller('super_admin');
  if (!auth.authorized) return NextResponse.json({ error: auth.error }, { status: auth.status });
  const admin = auth.supabase;

  let body: { userId?: string; role?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }
  const { userId, role } = body;
  if (!userId || !UUID_RE.test(userId) || (role !== 'member' && role !== 'moderator')) {
    return NextResponse.json({ error: 'userId and role (member | moderator) are required.' }, { status: 400 });
  }

  const allowed = await canActOn(admin, auth.role, auth.adminId, userId);
  if (!allowed.ok) return NextResponse.json({ error: allowed.error }, { status: allowed.status });
  if (role === 'moderator' && allowed.target.is_banned === true) {
    return NextResponse.json({ error: 'Unban this member before granting access.' }, { status: 400 });
  }

  // Legacy role / is_admin stay in sync for code paths that still read them.
  const { error } = await admin
    .from('profiles')
    .update({
      admin_role: role,
      role: role === 'moderator' ? 'admin' : 'member',
      is_admin: role === 'moderator',
    })
    .eq('id', userId);
  if (error) {
    return MISSING_ADMIN_COLUMNS_RE.test(error.message)
      ? NextResponse.json({ error: RUN_MIGRATION_MESSAGE }, { status: 503 })
      : NextResponse.json({ error: error.message }, { status: 500 });
  }

  await logModeration(admin, {
    userId,
    actorId: auth.adminId,
    category: 'role_change',
    action: role === 'moderator' ? 'granted_moderator' : 'revoked_moderator',
  });
  return NextResponse.json({ success: true, role });
}
