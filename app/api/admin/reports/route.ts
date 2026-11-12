// app/api/admin/reports/route.ts  (staff only)
//   GET                       -> pending member reports with reporter / reported profiles
//   GET ?context=<reportId>   -> recent chat between the two members (Inspect Context)
//   POST { reportId, action: 'dismiss' | 'penalize' | 'ban', points?, note? }
import { NextRequest, NextResponse } from 'next/server';
import { verifyAdminCaller } from '@/lib/adminAuth';
import { adjustReputation, canActOn, logModeration, MISSING_ADMIN_COLUMNS_RE, setBanned } from '@/lib/adminActions';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const PENALTY_STEPS = [5, 10, 20];

/** Current categories (app/api/reports) plus legacy reason values. */
const REASON_LABEL: Record<string, string> = {
  commercial_solicitation: 'Commercial solicitation',
  financial_scam: 'Financial fraud',
  off_platform_steering: 'Off-platform push',
  inappropriate_content: 'Harassment / abusive language',
  harassment: 'Harassment / abusive language',
  fake_profile: 'Fake photos / impersonation',
  inappropriate_photos: 'Inappropriate photos',
  underage: 'Underage',
  spam: 'Spam',
  other: 'Other',
};

/** "[from chat] note" / "[Category label] note" -> { source, note } */
function parseDetails(details: string | null): { source: 'chat' | 'profile' | null; note: string } {
  let note = String(details || '').trim();
  let source: 'chat' | 'profile' | null = null;
  const m = note.match(/^\[from (chat|profile)\]\s*/i);
  if (m) {
    source = m[1].toLowerCase() as 'chat' | 'profile';
    note = note.slice(m[0].length);
  }
  return { source, note };
}

const profileCard = (p: any) =>
  p
    ? {
        id: p.id,
        name: String(p.username || `Member ${String(p.id).slice(0, 8)}`).replace(/^@/, ''),
        avatarUrl: p.avatar_url || null,
        reputation: typeof p.reputation_score === 'number' ? p.reputation_score : 100,
        isBanned: p.is_banned === true,
      }
    : null;

export async function GET(req: NextRequest) {
  const auth = await verifyAdminCaller();
  if (!auth.authorized) return NextResponse.json({ error: auth.error }, { status: auth.status });
  const admin = auth.supabase;

  const contextId = req.nextUrl.searchParams.get('context');
  if (contextId) {
    if (!UUID_RE.test(contextId)) return NextResponse.json({ error: 'Invalid report.' }, { status: 400 });
    const { data: report } = await admin.from('user_reports').select('reporter_id, reported_id').eq('id', contextId).maybeSingle();
    if (!report) return NextResponse.json({ error: 'Report not found.' }, { status: 404 });
    const pair = [report.reporter_id, report.reported_id];
    const { data: rows, error } = await admin
      .from('messages')
      .select('id, sender_id, receiver_id, content, created_at, is_quarantined')
      .in('sender_id', pair)
      .in('receiver_id', pair)
      .order('created_at', { ascending: false })
      .limit(40);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({
      messages: (rows || []).reverse().map((m) => ({
        id: m.id,
        fromReported: m.sender_id === report.reported_id,
        content: m.content,
        createdAt: m.created_at,
        quarantined: Boolean(m.is_quarantined),
      })),
    });
  }

  // Pending = resolution 'pending' (after 20261112), else the older status column.
  let { data: reports, error } = await admin
    .from('user_reports')
    .select('*')
    .eq('resolution', 'pending')
    .order('created_at', { ascending: false })
    .limit(100);
  if (error && MISSING_ADMIN_COLUMNS_RE.test(error.message)) {
    ({ data: reports, error } = await admin
      .from('user_reports')
      .select('*')
      .eq('status', 'pending')
      .order('created_at', { ascending: false })
      .limit(100));
  }
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const ids = [...new Set((reports || []).flatMap((r) => [r.reporter_id, r.reported_id]).filter(Boolean))];
  const { data: profiles } = ids.length ? await admin.from('profiles').select('*').in('id', ids) : { data: [] };
  const byId = new Map((profiles || []).map((p) => [p.id, p]));

  return NextResponse.json({
    reports: (reports || []).map((r) => {
      const { source, note } = parseDetails(r.details);
      return {
        id: r.id,
        reason: r.reason,
        reasonLabel: REASON_LABEL[r.reason] || r.reason,
        source,
        details: note,
        createdAt: r.created_at,
        reporter: profileCard(byId.get(r.reporter_id)),
        reported: profileCard(byId.get(r.reported_id)),
      };
    }),
  });
}

export async function POST(req: NextRequest) {
  const auth = await verifyAdminCaller();
  if (!auth.authorized) return NextResponse.json({ error: auth.error }, { status: auth.status });
  const admin = auth.supabase;

  let body: { reportId?: string; action?: string; points?: number; note?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }
  const { reportId, action } = body;
  const note = typeof body.note === 'string' ? body.note.trim().slice(0, 300) : '';
  if (!reportId || !UUID_RE.test(reportId) || !['dismiss', 'penalize', 'ban'].includes(String(action))) {
    return NextResponse.json({ error: 'reportId and action (dismiss | penalize | ban) are required.' }, { status: 400 });
  }

  const { data: report } = await admin.from('user_reports').select('*').eq('id', reportId).maybeSingle();
  if (!report) return NextResponse.json({ error: 'Report not found.' }, { status: 404 });

  let resolution: 'dismissed' | 'penalized' | 'banned' = 'dismissed';
  if (action === 'penalize' || action === 'ban') {
    const target = await canActOn(admin, auth.role, auth.adminId, report.reported_id);
    if (!target.ok) return NextResponse.json({ error: target.error }, { status: target.status });

    if (action === 'penalize') {
      const points = Number(body.points);
      if (!PENALTY_STEPS.includes(points)) return NextResponse.json({ error: 'Choose 5, 10 or 20 points.' }, { status: 400 });
      const score = await adjustReputation(admin, report.reported_id, -points);
      if (score === null) return NextResponse.json({ error: 'Could not update reputation.' }, { status: 500 });
      await logModeration(admin, {
        userId: report.reported_id,
        actorId: auth.adminId,
        category: `report_${report.reason}`,
        action: 'report_penalized',
        text: `report:${report.id}${note ? ` | ${note}` : ''}`,
        points,
      });
      resolution = 'penalized';
    } else {
      const banned = await setBanned(admin, report.reported_id, true);
      if (!banned.ok) return NextResponse.json({ error: banned.error }, { status: banned.status });
      await logModeration(admin, {
        userId: report.reported_id,
        actorId: auth.adminId,
        category: `report_${report.reason}`,
        action: 'report_banned',
        text: `report:${report.id}${note ? ` | ${note}` : ''}`,
      });
      resolution = 'banned';
    }
  }

  const status = resolution === 'dismissed' ? 'dismissed' : 'resolved';
  let { error } = await admin
    .from('user_reports')
    .update({
      resolution,
      status,
      resolved_by: auth.adminId,
      resolved_at: new Date().toISOString(),
      resolution_note: note || null,
    })
    .eq('id', reportId);
  if (error && MISSING_ADMIN_COLUMNS_RE.test(error.message)) {
    ({ error } = await admin.from('user_reports').update({ status }).eq('id', reportId));
  }
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ success: true, resolution });
}
