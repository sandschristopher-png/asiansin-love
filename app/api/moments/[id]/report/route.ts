// POST { reason } /api/moments/:id/report -> { success, duplicate, hidden }
//
// One report per (reporter, Moment). A new report costs the author reputation at once through the
// service-role RPC (10 points; 100 plus a freeze for "fake or underage"), a Moment with 2 unique
// reports is hidden until staff review it, and staff are alerted (it shows in the admin queue).
import { NextResponse, after } from 'next/server';
import { createClient as createServiceClient } from '@supabase/supabase-js';
import { createClient } from '@/lib/supabase/server';
import { notifyAdmins } from '@/lib/adminNotify';
import { HIDE_AT_REPORTS, isMomentReportReason } from '@/lib/moments';
import { REPORT_PENALTY, REPORT_PENALTY_UNDERAGE } from '@/lib/safety/reportRules';

export const runtime = 'nodejs';
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function POST(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  if (!UUID_RE.test(id)) return NextResponse.json({ error: 'Invalid id', code: 'INVALID_INPUT' }, { status: 400 });
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized', code: 'UNAUTHORIZED' }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  if (!isMomentReportReason(body?.reason)) return NextResponse.json({ error: 'Please choose a reason.', code: 'INVALID_INPUT' }, { status: 400 });
  const reason = body.reason;

  const admin = createServiceClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, { auth: { persistSession: false } });
  const { data: moment } = await admin.from('moments').select('id, user_id, status').eq('id', id).maybeSingle();
  if (!moment || moment.status === 'removed') return NextResponse.json({ error: 'Not found', code: 'NOT_FOUND' }, { status: 404 });
  if (moment.user_id === user.id) return NextResponse.json({ error: 'You cannot report yourself.', code: 'INVALID_INPUT' }, { status: 400 });

  const { error: insertError } = await admin
    .from('moment_reports')
    .insert({ moment_id: id, reporter_id: user.id, reported_user_id: moment.user_id, reason });
  if (insertError?.code === '23505') return NextResponse.json({ success: true, duplicate: true, hidden: moment.status === 'hidden' });
  if (insertError) {
    console.error('[api/moments/report] insert failed:', insertError.message);
    return NextResponse.json({ error: 'Could not submit your report.', code: 'DB_ERROR' }, { status: 500 });
  }

  const underage = reason === 'fake_or_underage';
  const { error: penaltyError } = await admin.rpc('apply_moderation_penalty', {
    p_user_id: moment.user_id,
    p_deduction: underage ? REPORT_PENALTY_UNDERAGE : REPORT_PENALTY,
    p_action: 'moment_report',
    p_category: `moment_report:${reason}`,
    p_flagged: `moment ${id}`,
  });
  if (penaltyError) console.error('[api/moments/report] penalty failed:', penaltyError.message);

  if (underage) {
    await admin
      .from('account_freezes')
      .upsert({ user_id: moment.user_id, reason: 'Moment reported as fake or underage', source: 'report', cleared_at: null }, { onConflict: 'user_id' });
  }

  const { count } = await admin.from('moment_reports').select('id', { count: 'exact', head: true }).eq('moment_id', id);
  let hidden = moment.status === 'hidden';
  if (moment.status === 'active' && (underage || (count ?? 0) >= HIDE_AT_REPORTS)) {
    const { error: hideError } = await admin.from('moments').update({ status: 'hidden' }).eq('id', id).eq('status', 'active');
    hidden = !hideError;
  }

  after(() => notifyAdmins({ kind: 'moderation', ref: String(moment.user_id), actorId: String(moment.user_id) }));
  return NextResponse.json({ success: true, duplicate: false, hidden });
}
