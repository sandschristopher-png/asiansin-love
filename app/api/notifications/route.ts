import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createServerClient } from '@supabase/ssr';

export async function GET(req: NextRequest) {
  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll: () => cookieStore.getAll(), setAll: () => {} } }
  );

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { data, error } = await supabase
    .from('notifications')
    .select(`
      id, type, payload, is_read, created_at,
      actor:actor_id (id, username, avatar_url)
    `)
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(30);

  if (error) {
    console.error('notifications GET failed:', error.message, error.code, error.details, error.hint);
    return NextResponse.json({ error: 'Failed to load notifications' }, { status: 500 });
  }

  const unread_count = data.filter((n: any) => !n.is_read).length;
  return NextResponse.json({ notifications: data ?? [], unread_count });
}

export async function POST(req: NextRequest) {
  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll: () => cookieStore.getAll(), setAll: () => {} } }
  );

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { error } = await supabase
    .from('notifications')
    .update({ is_read: true })
    .eq('user_id', user.id)
    .eq('is_read', false);

  if (error) return NextResponse.json({ error: 'Update failed' }, { status: 500 });
  return NextResponse.json({ ok: true });
}