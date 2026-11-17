// app/api/reports/route.ts
//   POST { reported_id, reason_category, details?, block?, context?, message_id? } -> { success, blocked, duplicate }
//
// Reason-based reports (components/ReportModal.tsx). Rows go to public.user_reports (status
// 'pending') and appear in the admin review queue at /admin/verifications. A report of one chat
// MESSAGE also:
//   - is recorded once per (reporter, message) in public.message_reports (a repeat is a no-op),
//   - costs the sender reputation at once through the service-role RPC apply_moderation_penalty
//     (10 points; 100 for an underage report, which also freezes the account for review).
// A confirmed member report costs more later in the admin console. With `block`, the reporter also
// blocks them (public.user_blocks), same as /api/users/block.
import { NextResponse, after } from 'next/server';
import { createClient as createServiceClient } from '@supabase/supabase-js';
import { notifyAdmins } from '@/lib/adminNotify';
import { createClient } from '@/lib/supabase/server';
import { reportExcerpt, reportPenalty } from '@/lib/safety/reportRules';

export const runtime = 'nodejs';

/** Must match the reasons in components/ReportModal.tsx. */
const REPORT_CATEGORIES = {
  sex_solicitation: 'Sex solicitation / escorting',
  adult_content: 'Selling adult content / spam links',
  commercial_solicitation: 'Commercial solicitation / Selling services or products',
  financial_scam: 'Asking for money / Financial fraud',
  off_platform_steering: 'Asking for off-platform contact too quickly (WhatsApp/Telegram/Line)',
  inappropriate_content: 'Inappropriate or abusive language',
  fake_profile: 'Fake photos or impersonation',
  underage: 'Underage member (must be 18+)',
  other: 'Other community concern',
} as const;
type ReportCategory = keyof typeof REPORT_CATEGORIES;

/** Older reason values, used only if the table's CHECK constraint predates these categories. */
const LEGACY_REASON: Record<ReportCategory, string> = {
  sex_solicitation: 'spam',
  adult_content: 'spam',
  fake_profile: 'fake_profile',
  financial_scam: 'spam',
  commercial_solicitation: 'spam',
  inappropriate_content: 'inappropriate_photos',
  underage: 'other',
  off_platform_steering: 'spam',
  other: 'other',
};

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function POST(req: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  let body: { reported_id?: unknown; reason_category?: unknown; details?: unknown; block?: unknown; context?: unknown; message_id?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const reportedId = body.reported_id;
  const category = body.reason_category;
  if (typeof reportedId !== 'string' || !UUID_RE.test(reportedId)) {
    return NextResponse.json({ error: 'reported_id is required.' }, { status: 400 });
  }
  if (typeof category !== 'string' || !(category in REPORT_CATEGORIES)) {
    return NextResponse.json({ error: 'Please choose a reason.' }, { status: 400 });
  }
  if (reportedId === user.id) return NextResponse.json({ error: 'You cannot report yourself.' }, { status: 400 });

  // Where the report was filed (chat / profile) is kept with the details for moderators.
  const context = body.context === 'chat' || body.context === 'profile' ? body.context : null;
  const rawDetails = typeof body.details === 'string' ? body.details.trim().slice(0, 300) : '';

  // Message-level report: the server (not the client) quotes the reported message and the 5
  // messages before it, after checking it really was sent by the reported member to the reporter.
  let transcript = '';
  let messageExcerpt = '';
  const messageId = typeof body.message_id === 'string' && UUID_RE.test(body.message_id) ? body.message_id : null;
  if (messageId) {
    const { data: target } = await supabase
      .from('messages')
      .select('id, sender_id, receiver_id, content, created_at, audio_path')
      .eq('id', messageId)
      .maybeSingle();
    if (!target || target.sender_id !== reportedId || target.receiver_id !== user.id) {
      return NextResponse.json({ error: 'That message cannot be reported.' }, { status: 400 });
    }
    const { data: before } = await supabase
      .from('messages')
      .select('sender_id, content, audio_path')
      .in('sender_id', [user.id, reportedId])
      .in('receiver_id', [user.id, reportedId])
      .lt('created_at', target.created_at)
      .order('created_at', { ascending: false })
      .limit(5);
    const line = (m: { sender_id: string; content: string | null; audio_path?: string | null }) =>
      `${m.sender_id === reportedId ? 'Reported' : 'Reporter'}: ${
        m.audio_path ? '[voice note]' : String(m.content || '').replace(/\s+/g, ' ').slice(0, 200)
      }`;
    messageExcerpt = reportExcerpt(target.content);
    transcript = [`[message ${messageId}]`, ...(before || []).reverse().map((m) => `  ${line(m)}`), `> ${line(target)}`].join('\n');
  }

  const details = [`${context ? `[from ${context}] ` : ''}${rawDetails}`.trim(), transcript].filter(Boolean).join('\n');
  const cat = category as ReportCategory;

  const admin = createServiceClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, { auth: { persistSession: false } });

  const blockReporter = async () => {
    const { error: blockError } = await supabase.from('user_blocks').insert({ blocker_id: user.id, blocked_id: reportedId });
    const done = !blockError || blockError.code === '23505'; // already blocked counts as blocked
    if (!done) console.error('[api/reports] block failed:', blockError?.message);
    return done;
  };

  // One report per (reporter, message): a repeat is accepted quietly and changes nothing.
  if (messageId) {
    const { error: dupError } = await admin.from('message_reports').insert({
      reporter_id: user.id,
      reported_user_id: reportedId,
      message_id: messageId,
      reason: category,
      message_excerpt: messageExcerpt,
    });
    if (dupError?.code === '23505') {
      return NextResponse.json({ success: true, blocked: body.block === true ? await blockReporter() : false, duplicate: true });
    }
    if (dupError) console.warn('[api/reports] message_reports insert skipped:', dupError.message); // table not migrated yet
  }

  const insert = (reason: string, text: string | null) =>
    supabase.from('user_reports').insert({
      reporter_id: user.id,
      reported_id: reportedId,
      reason,
      details: text,
      status: 'pending',
    });

  let { error } = await insert(cat, details || null);
  if (error?.code === '23514') {
    // reason CHECK constraint without the new categories: keep the category in the details.
    ({ error } = await insert(LEGACY_REASON[cat], `[${REPORT_CATEGORIES[cat]}] ${details}`.trim()));
  }
  if (error) {
    console.error('[api/reports] insert failed:', error.code, error.message);
    return NextResponse.json({ error: 'Could not submit your report. Please try again.' }, { status: 500 });
  }

  // Immediate, atomic reputation hit for a reported message (service-role RPC; RLS cannot stop it).
  if (messageId) {
    const { error: penaltyError } = await admin.rpc('apply_moderation_penalty', {
      p_user_id: reportedId,
      p_deduction: reportPenalty(cat),
      p_action: 'message_report',
      p_category: `report:${cat}`,
      p_flagged: messageExcerpt,
    });
    if (penaltyError) console.error('[api/reports] reputation penalty failed:', penaltyError.message);
    if (cat === 'underage') {
      const { error: freezeError } = await admin
        .from('account_freezes')
        .upsert({ user_id: reportedId, reason: 'reported as underage', source: 'report', cleared_at: null }, { onConflict: 'user_id' });
      if (freezeError) console.error('[api/reports] freeze failed:', freezeError.message);
    }
  }

  after(() =>
    notifyAdmins({ kind: 'report', description: REPORT_CATEGORIES[cat], ref: String(reportedId), actorId: String(reportedId) })
  );

  const blocked = body.block === true ? await blockReporter() : false;

  return NextResponse.json({ success: true, blocked, duplicate: false });
}
