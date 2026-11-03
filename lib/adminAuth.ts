import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { createServerSupabaseClient } from '@/lib/supabase/server';

export function getServiceRoleClient(): SupabaseClient {
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
    auth: { persistSession: false },
  });
}

type AuthSuccess = { authorized: true; adminId: string; supabase: SupabaseClient };
type AuthFailure = { authorized: false; status: number; error: string };
export type AdminAuthResult = AuthSuccess | AuthFailure;

/**
 * Session-gated admin check for /api/admin/* routes.
 * Verifies the caller's session with the auth server (getUser), then reads is_admin
 * with the service role. On success returns a service-role client for the route to use.
 */
export async function verifyAdminCaller(): Promise<AdminAuthResult> {
  const userClient = await createServerSupabaseClient();
  const {
    data: { user },
    error: userErr,
  } = await userClient.auth.getUser();

  if (userErr || !user) {
    return { authorized: false, status: 401, error: 'Unauthorized: Session missing' };
  }

  const adminDb = getServiceRoleClient();
  const { data: profile, error: profErr } = await adminDb
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  // role = 'admin' (20261108_release_features.sql) or the older is_admin flag.
  if (profErr || !(profile?.role === 'admin' || profile?.is_admin === true)) {
    return { authorized: false, status: 403, error: 'Forbidden: Admin privilege required' };
  }

  return { authorized: true, adminId: user.id, supabase: adminDb };
}
