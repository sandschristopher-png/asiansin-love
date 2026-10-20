import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';

// Thin wrapper: all policy lives in the change_username() RPC.
export async function POST(req: Request) {
  try {
    const supabase = await createServerSupabaseClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ ok: false, error: 'not_authenticated' }, { status: 401 });
    }
    const body = await req.json().catch(() => ({}));
    const raw = typeof body?.username === 'string' ? body.username : '';
    const { data, error } = await supabase.rpc('change_username', { new_handle: raw });
    if (error) {
      return NextResponse.json({ ok: false, error: 'rpc_failed', detail: error.message }, { status: 500 });
    }
    const status = data?.ok ? 200 : data?.error === 'not_authenticated' ? 401 : 400;
    return NextResponse.json(data, { status });
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err?.message || 'server_error' }, { status: 500 });
  }
}