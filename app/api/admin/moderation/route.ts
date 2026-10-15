import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

function getServiceRoleClient(): SupabaseClient {
  return createClient(supabaseUrl, supabaseServiceKey, {
    auth: { persistSession: false },
  });
}

type AuthSuccess = { authorized: true; adminId: string; supabase: SupabaseClient };
type AuthFailure = { authorized: false; status: number; error: string };
type AuthResult = AuthSuccess | AuthFailure;

async function verifyAdminCaller(): Promise<AuthResult> {
  const userClient = await createServerSupabaseClient();
  const {
    data: { user },
    error: userErr,
  } = await userClient.auth.getUser();

  if (userErr || !user) {
    return { authorized: false, status: 401, error: 'Unauthorized: Session missing' };
  }

  const adminDb = getServiceRoleClient();
  const { data: profile, error: profErr } = await adminDb
    .from('profiles')
    .select('id, is_admin')
    .eq('id', user.id)
    .single();

  if (profErr || !profile?.is_admin) {
    return { authorized: false, status: 403, error: 'Forbidden: Admin privilege required' };
  }

  return { authorized: true, adminId: user.id, supabase: adminDb };
}

// GET /api/admin/moderation - Fetch quarantined messages
export async function GET() {
  const authCheck = await verifyAdminCaller();
  if (!authCheck.authorized) {
    return NextResponse.json({ error: authCheck.error }, { status: authCheck.status });
  }

  const supabase = authCheck.supabase;

  try {
    const { data: messages, error } = await supabase
      .from('messages')
      .select(`
        id,
        sender_id,
        recipient_id,
        content,
        is_quarantined,
        created_at,
        sender:profiles!messages_sender_id_fkey(
          id,
          username,
          full_name,
          reputation_score
        ),
        recipient:profiles!messages_recipient_id_fkey(
          id,
          username,
          full_name
        )
      `)
      .eq('is_quarantined', true)
      .order('created_at', { ascending: false })
      .limit(50);

    if (error) {
      const { data: fallbackMessages, error: fallbackError } = await supabase
        .from('messages')
        .select('*')
        .eq('is_quarantined', true)
        .order('created_at', { ascending: false })
        .limit(50);

      if (fallbackError) {
        return NextResponse.json({ error: fallbackError.message }, { status: 500 });
      }

      return NextResponse.json({ messages: fallbackMessages });
    }

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
