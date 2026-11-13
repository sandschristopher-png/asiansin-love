import { NextResponse } from 'next/server';
import { verifyAdminCaller } from '@/lib/adminAuth';
import { pendingQueueCounts } from '@/lib/adminNotify';

export const dynamic = 'force-dynamic';

/**
 * GET -> { total, verifications, photos, reports } for the Admin Console count chip
 * (account dropdown + Settings). Staff only; members get 403 and never render the chip.
 */
export async function GET() {
  const auth = await verifyAdminCaller();
  if (!auth.authorized) return NextResponse.json({ error: auth.error }, { status: auth.status });
  const counts = await pendingQueueCounts(auth.supabase);
  return NextResponse.json(counts, { headers: { 'Cache-Control': 'private, no-store' } });
}
