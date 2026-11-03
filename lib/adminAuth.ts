import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { createServerSupabaseClient } from '@/lib/supabase/server';

export function getServiceRoleClient(): SupabaseClient {
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
    auth: { persistSession: false },
  });
}

import { adminRoleOf, isStaff, type AdminRole } from '@/lib/adminRoles';
export { adminRoleOf, isStaff, ADMIN_ROLE_LABEL, type AdminRole } from '@/lib/adminRoles';

type AuthSuccess = { authorized: true; adminId: string; role: AdminRole; supabase: SupabaseClient };
type AuthFailure = { authorized: false; status: number; error: string };
export type AdminAuthResult = AuthSuccess | AuthFailure;

/**
 * Session-gated staff check for /api/admin/* routes.
 * Verifies the caller's session with the auth server (getUser), then reads their role with the
 * service role. `minRole: 'super_admin'` restricts a route to super admins (403 for moderators).
 * On success returns a service-role client for the route to use.
 */
export async function verifyAdminCaller(minRole: 'moderator' | 'super_admin' = 'moderator'): Promise<AdminAuthResult> {
  const userClient = await createServerSupabaseClient();
  const {
    data: { user },
    error: userErr,
  } = await userClient.auth.getUser();

  if (userErr || !user) {
    return { authorized: false, status: 401, error: 'Unauthorized: Session missing' };
  }

  const adminDb = getServiceRoleClient();
  const { data: profile, error: profErr } = await adminDb.from('profiles').select('*').eq('id', user.id).single();

  const role = adminRoleOf(profErr ? null : profile);
  if (!isStaff(role) || profile?.is_banned === true) {
    return { authorized: false, status: 403, error: 'Forbidden: Admin privilege required' };
  }
  if (minRole === 'super_admin' && role !== 'super_admin') {
    return { authorized: false, status: 403, error: 'Forbidden: Super admin privilege required' };
  }

  return { authorized: true, adminId: user.id, role, supabase: adminDb };
}

/**
 * Server-component variant for app/admin/layout.tsx: the signed-in staff member, or null
 * (the layout then renders a plain 404 so /admin is never disclosed).
 */
export async function getAdminContext(): Promise<{ userId: string; role: AdminRole; name: string } | null> {
  const userClient = await createServerSupabaseClient();
  const {
    data: { user },
  } = await userClient.auth.getUser();
  if (!user) return null;
  const { data: profile } = await getServiceRoleClient().from('profiles').select('*').eq('id', user.id).maybeSingle();
  const role = adminRoleOf(profile);
  if (!isStaff(role) || profile?.is_banned === true) return null;
  const name = String(profile?.username || profile?.display_name || profile?.full_name || 'Admin').replace(/^@/, '');
  return { userId: user.id, role, name };
}
