import { NextRequest, NextResponse } from 'next/server';
import { verifyAdminCaller } from '@/lib/adminAuth';

// GET /api/admin/moderation - Fetch quarantined messages
export async function GET() {
  const authCheck = await verifyAdminCaller();
  if (!authCheck.authorized) {
    return NextResponse.json({ error: authCheck.error }, { status: authCheck.status });
  }

  const supabase = authCheck.supabase;

  try {
    const { data: rows, error } = await supabase
      .from('messages')
      .select('id, sender_id, receiver_id, content, is_quarantined, created_at')
      .eq('is_quarantined', true)
      .order('created_at', { ascending: false })
      .limit(50);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Attach sender / receiver profiles in one lookup (no reliance on FK constraint names).
    const ids = [...new Set((rows || []).flatMap((m) => [m.sender_id, m.receiver_id]).filter(Boolean))];
    const { data: profiles } = ids.length
      ? await supabase.from('profiles').select('id, username, full_name, reputation_score').in('id', ids)
      : { data: [] };
    const byId = new Map((profiles || []).map((p) => [p.id, p]));

    const messages = (rows || []).map((m) => ({
      ...m,
      sender: byId.get(m.sender_id) || null,
      receiver: byId.get(m.receiver_id) || null,
    }));

    return NextResponse.json({ messages });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// POST /api/admin/moderation - Execute admin release or confirmation
export async function POST(req: NextRequest) {
  const authCheck = await verifyAdminCaller();
  if (!authCheck.authorized) {
    return NextResponse.json({ error: authCheck.error }, { status: authCheck.status });
  }

  const { adminId, supabase } = authCheck;

  try {
    const body = await req.json();
    const { action, messageId, notes, penaltyPoints } = body;

    if (!messageId) {
      return NextResponse.json({ error: 'messageId is required' }, { status: 400 });
    }

    if (action === 'release') {
      const { data, error } = await supabase.rpc('admin_release_quarantine', {
        p_message_id: messageId,
        p_admin_id: adminId,
        p_notes: notes || 'Released via admin moderation dashboard',
      });

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }

      return NextResponse.json({ success: true, result: data });
    }

    if (action === 'confirm') {
      const { data, error } = await supabase.rpc('admin_confirm_quarantine', {
        p_message_id: messageId,
        p_admin_id: adminId,
        p_additional_penalty: Number(penaltyPoints) || 0,
        p_notes: notes || 'Violation confirmed by administrator',
      });

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }

      return NextResponse.json({ success: true, result: data });
    }

    return NextResponse.json({ error: 'Invalid action. Use "release" or "confirm".' }, { status: 400 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
