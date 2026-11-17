// POST /api/moments/:id/like -> { liked, likesCount }   toggles through the atomic RPC.
import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function POST(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  if (!UUID_RE.test(id)) return NextResponse.json({ error: 'Invalid id', code: 'INVALID_INPUT' }, { status: 400 });
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized', code: 'UNAUTHORIZED' }, { status: 401 });

  const { data, error } = await supabase.rpc('toggle_moment_like', { p_moment_id: id });
  if (error) {
    if (/MOMENT_NOT_FOUND/.test(error.message)) return NextResponse.json({ error: 'Not found', code: 'NOT_FOUND' }, { status: 404 });
    console.error('[api/moments/like] failed:', error.message);
    return NextResponse.json({ error: 'Could not update.', code: 'DB_ERROR' }, { status: 500 });
  }
  return NextResponse.json({ liked: Boolean(data?.liked), likesCount: Number(data?.likes_count ?? 0) });
}
