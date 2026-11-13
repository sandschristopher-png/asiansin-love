import { NextResponse, after } from 'next/server';
import { notifyAdmins } from '@/lib/adminNotify';
import { createClient } from '@/lib/supabase/server';

const VALID_REASONS = ['fake_profile', 'harassment', 'spam', 'inappropriate_photos', 'other'];

export async function POST(req: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { reportedId, reason, details } = await req.json();
  if (!reportedId || !reason) return NextResponse.json({ error: 'reportedId and reason are required' }, { status: 400 });
  if (!VALID_REASONS.includes(reason)) return NextResponse.json({ error: 'Invalid reason' }, { status: 400 });
  if (reportedId === user.id) return NextResponse.json({ error: 'Cannot report yourself' }, { status: 400 });

  const { data, error } = await supabase
    .from('user_reports')
    .insert({
      reporter_id: user.id,
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

  after(() => notifyAdmins({ kind: 'report', title: 'New report filed', ref: String(reportedId), actorId: String(reportedId) }));

  // Pending reports are listed in the admin review queue (/admin/verifications).
  return NextResponse.json({ success: true, data });
}
