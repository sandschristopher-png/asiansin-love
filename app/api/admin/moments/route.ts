import { NextRequest, NextResponse } from 'next/server';
import { verifyAdminCaller } from '@/lib/adminAuth';
import { MOMENT_BUCKET } from '@/lib/moments';

export const runtime = 'nodejs';
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// GET /api/admin/moments - Moments waiting on staff: hidden ones (2+ unique reports, or an underage
// report) and any active Moment that has at least one report, newest report first.
export async function GET() {
  const auth = await verifyAdminCaller();
  if (!auth.authorized) return NextResponse.json({ error: auth.error }, { status: auth.status });
  const db = auth.supabase;

  const [{ data: reports, error: reportsError }, { data: hidden, error: hiddenError }] = await Promise.all([
    db.from('moment_reports').select('moment_id, reason, created_at').order('created_at', { ascending: false }).limit(400),
    db.from('moments').select('id').eq('status', 'hidden').limit(100),
  ]);
  if (reportsError || hiddenError) {
    // moments tables not migrated yet: an empty queue, not an error page.
    return NextResponse.json({ moments: [] });
  }

  const byMoment = new Map<string, { reasons: string[]; latest: string }>();
  for (const r of (reports || []) as { moment_id: string; reason: string; created_at: string }[]) {
    const entry = byMoment.get(r.moment_id) ?? { reasons: [], latest: r.created_at };
    entry.reasons.push(r.reason);
    byMoment.set(r.moment_id, entry);
  }
  const ids = Array.from(new Set([...byMoment.keys(), ...((hidden || []) as { id: string }[]).map((m) => m.id)])).slice(0, 100);
  if (ids.length === 0) return NextResponse.json({ moments: [] });

  const { data: rows } = await db
    .from('moments')
    .select('id, user_id, image_url, caption, activity_tag, city, status, created_at')
    .in('id', ids)
    .neq('status', 'removed');
  const authorIds = Array.from(new Set((rows || []).map((m) => m.user_id)));
  const { data: authors } = authorIds.length
    ? await db.from('profiles').select('id, username, reputation_score').in('id', authorIds)
    : { data: [] as { id: string; username: string | null; reputation_score: number | null }[] };
  const byAuthor = new Map((authors || []).map((a) => [a.id, a]));

  const moments = (rows || [])
    .map((m) => ({
      ...m,
      author: byAuthor.get(m.user_id) ?? null,
      reportCount: byMoment.get(m.id)?.reasons.length ?? 0,
      reasons: Array.from(new Set(byMoment.get(m.id)?.reasons ?? [])),
      latestReportAt: byMoment.get(m.id)?.latest ?? m.created_at,
    }))
    .sort((a, b) => Number(b.status === 'hidden') - Number(a.status === 'hidden') || b.latestReportAt.localeCompare(a.latestReportAt));

  return NextResponse.json({ moments });
}

// POST /api/admin/moments { action: 'restore' | 'remove', momentId, penaltyPoints? }
export async function POST(req: NextRequest) {
  const auth = await verifyAdminCaller();
  if (!auth.authorized) return NextResponse.json({ error: auth.error }, { status: auth.status });
  const db = auth.supabase;

  const body = await req.json().catch(() => ({}));
  const momentId = body?.momentId;
  if (typeof momentId !== 'string' || !UUID_RE.test(momentId)) return NextResponse.json({ error: 'momentId is required' }, { status: 400 });

  const { data: moment } = await db.from('moments').select('id, user_id, image_url').eq('id', momentId).maybeSingle();
  if (!moment) return NextResponse.json({ error: 'Moment not found' }, { status: 404 });

  if (body.action === 'restore') {
    const { error } = await db.from('moments').update({ status: 'active' }).eq('id', momentId);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ success: true });
  }

  if (body.action === 'remove') {
    const { error } = await db.from('moments').update({ status: 'removed' }).eq('id', momentId);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    const url = String(moment.image_url);
    const marker = `/${MOMENT_BUCKET}/`;
    const at = url.indexOf(marker);
    if (at >= 0) await db.storage.from(MOMENT_BUCKET).remove([url.slice(at + marker.length)]);
    const points = Math.max(0, Math.round(Number(body.penaltyPoints) || 0));
    if (points > 0) {
      await db.rpc('apply_moderation_penalty', {
        p_user_id: moment.user_id,
        p_deduction: points,
        p_action: 'moment_removed',
        p_category: 'moment_removed',
        p_flagged: `moment ${momentId}`,
      });
    }
    return NextResponse.json({ success: true });
  }

  return NextResponse.json({ error: 'Invalid action. Use "restore" or "remove".' }, { status: 400 });
}
