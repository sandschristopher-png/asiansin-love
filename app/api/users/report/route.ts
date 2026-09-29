import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

const VALID_REASONS = ['fake_profile', 'harassment', 'spam', 'inappropriate_photos', 'other'];

export async function POST(req: Request) {
  const supabase = await createClient();
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { reportedId, reason, details } = await req.json();
  if (!reportedId || !reason) return NextResponse.json({ error: 'reportedId and reason are required' }, { status: 400 });
  if (!VALID_REASONS.includes(reason)) return NextResponse.json({ error: 'Invalid reason' }, { status: 400 });
  if (reportedId === session.user.id) return NextResponse.json({ error: 'Cannot report yourself' }, { status: 400 });

  const { data, error } = await supabase
    .from('user_reports')
    .insert({
      reporter_id: session.user.id,
      reported_id: reportedId,
      reason,
      details: details?.slice(0, 1000) || null,
      status: 'pending',
    })
    .select()
    .single();

  if (error) {
    console.error('Report insert failed:', error.message);
    return NextResponse.json({ error: 'Failed to submit report' }, { status: 500 });
  }

  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.ADMIN_TELEGRAM_CHAT_ID;
  if (token && chatId) {
    const message =
`Member Safety Report
Reporter: ${session.user.id}
Reported: ${reportedId}
Reason: ${reason}
Details: ${details?.slice(0, 1000) || 'None provided'}
Status: Pending`;
    try {
      await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chat_id: chatId, text: message }),
      });
    } catch (tgErr) {
      console.error('Telegram alert failed:', tgErr);
    }
  }

  return NextResponse.json({ success: true, data });
}
