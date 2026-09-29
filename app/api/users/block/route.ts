import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(req: Request) {
  const supabase = await createClient();
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { blockedId } = await req.json();
  if (!blockedId) return NextResponse.json({ error: 'Missing blockedId' }, { status: 400 });
  if (blockedId === session.user.id) return NextResponse.json({ error: 'Cannot block yourself' }, { status: 400 });

  const { error } = await supabase
    .from('user_blocks')
    .insert({ blocker_id: session.user.id, blocked_id: blockedId });

  if (error) {
    if (error.code === '23505') return NextResponse.json({ success: true, message: 'Already blocked' });
    console.error('Block insert failed:', error.message);
    return NextResponse.json({ error: 'Failed to block user' }, { status: 500 });
  }
  return NextResponse.json({ success: true });
}

export async function DELETE(req: Request) {
  const supabase = await createClient();
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { blockedId } = await req.json();
  if (!blockedId) return NextResponse.json({ error: 'Missing blockedId' }, { status: 400 });

  const { error } = await supabase
    .from('user_blocks')
    .delete()
    .eq('blocker_id', session.user.id)
    .eq('blocked_id', blockedId);

  if (error) return NextResponse.json({ error: 'Failed to unblock user' }, { status: 500 });
  return NextResponse.json({ success: true });
}
