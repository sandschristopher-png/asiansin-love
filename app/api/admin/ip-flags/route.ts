import { NextResponse } from 'next/server';
import { verifyAdminCaller } from '@/lib/adminAuth';

export const runtime = 'nodejs';

// GET /api/admin/ip-flags - Members whose latest connection was a VPN, a high-risk network (Tor, proxy,
// datacenter) or in a different country from their profile (member_ip_flags, written by lib/safety/vpnCheck.ts).
export async function GET() {
  const auth = await verifyAdminCaller();
  if (!auth.authorized) return NextResponse.json({ error: auth.error }, { status: auth.status });
  const db = auth.supabase;

  const { data: rows, error } = await db
    .from('member_ip_flags')
    .select('user_id, tier, ip, asn, org, ip_country, header_country, declared_country, country_mismatch, last_event, penalized_at, updated_at')
    .or('tier.neq.clean,country_mismatch.eq.true')
    .order('updated_at', { ascending: false })
    .limit(50);
  if (error) return NextResponse.json({ flags: [] }); // table not migrated yet

  const ids = (rows || []).map((r) => r.user_id);
  const { data: profiles } = ids.length
    ? await db.from('profiles').select('id, username, reputation_score, is_verified').in('id', ids)
    : { data: [] as { id: string; username: string | null; reputation_score: number | null; is_verified: boolean | null }[] };
  const byId = new Map((profiles || []).map((p) => [p.id, p]));
  return NextResponse.json({ flags: (rows || []).map((r) => ({ ...r, member: byId.get(r.user_id) ?? null })) });
}
