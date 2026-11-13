import { NextRequest, NextResponse } from 'next/server';
import { verifyAdminCaller } from '@/lib/adminAuth';
import { ADMIN_TYPE_LIKE, pendingQueueCounts } from '@/lib/adminNotify';

export const dynamic = 'force-dynamic';

/**
 * Admin Notifications (app/admin/notifications).
 *   GET  -> { notifications (my admin_ alerts, open first), counts (pending queues) }
 *   POST { id } -> marks that alert handled for every admin (same type + payload.ref)
 */
export async function GET() {
  const auth = await verifyAdminCaller();
  if (!auth.authorized) return NextResponse.json({ error: auth.error }, { status: auth.status });
  const db = auth.supabase;

  const [{ data: rows, error }, counts] = await Promise.all([
    db
      .from('notifications')
      .select('id, actor_id, type, title, description, link_url, payload, is_read, created_at')
      .eq('user_id', auth.adminId)
      .like('type', ADMIN_TYPE_LIKE)
      .order('is_read', { ascending: true })
      .order('created_at', { ascending: false })
      .limit(60),
    pendingQueueCounts(db),
  ]);
  if (error) return NextResponse.json({ error: 'Failed to load notifications' }, { status: 500 });

  const actorIds = [...new Set((rows ?? []).map((r) => r.actor_id).filter(Boolean))] as string[];
  const actors: Record<string, { username: string | null; avatar_url: string | null }> = {};
  if (actorIds.length) {
    const { data } = await db.from('profiles').select('id, username, avatar_url').in('id', actorIds);
    (data ?? []).forEach((a) => (actors[a.id] = { username: a.username, avatar_url: a.avatar_url }));
  }
  const notifications = (rows ?? []).map(({ actor_id, ...r }) => ({ ...r, actor: actor_id ? actors[actor_id] ?? null : null }));
  return NextResponse.json({ notifications, counts }, { headers: { 'Cache-Control': 'private, no-store' } });
}

export async function POST(req: NextRequest) {
  const auth = await verifyAdminCaller();
  if (!auth.authorized) return NextResponse.json({ error: auth.error }, { status: auth.status });
  const db = auth.supabase;

  let id: unknown;
  try {
    ({ id } = await req.json());
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }
  if (typeof id !== 'string') return NextResponse.json({ error: 'id is required' }, { status: 400 });

  const { data: row } = await db
    .from('notifications')
    .select('id, type, payload')
    .eq('id', id)
    .eq('user_id', auth.adminId)
    .like('type', ADMIN_TYPE_LIKE)
    .maybeSingle();
  if (!row) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const ref = (row.payload as { ref?: string } | null)?.ref;
  const query = db.from('notifications').update({ is_read: true }).eq('type', row.type).eq('is_read', false);
  const { error } = ref ? await query.eq('payload->>ref', ref) : await query.eq('id', row.id);
  if (error) return NextResponse.json({ error: 'Update failed' }, { status: 500 });
  return NextResponse.json({ ok: true });
}
