// DELETE /api/moments/:id -> { success }   the author removes their own Moment (row and photo).
import { NextResponse } from 'next/server';
import { createClient as createServiceClient } from '@supabase/supabase-js';
import { createClient } from '@/lib/supabase/server';
import { MOMENT_BUCKET } from '@/lib/moments';

export const runtime = 'nodejs';
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function DELETE(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  if (!UUID_RE.test(id)) return NextResponse.json({ error: 'Invalid id', code: 'INVALID_INPUT' }, { status: 400 });
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized', code: 'UNAUTHORIZED' }, { status: 401 });

  const { data: moment } = await supabase.from('moments').select('id, user_id, image_url').eq('id', id).maybeSingle();
  if (!moment || moment.user_id !== user.id) return NextResponse.json({ error: 'Not found', code: 'NOT_FOUND' }, { status: 404 });

  const { error } = await supabase.from('moments').delete().eq('id', id).eq('user_id', user.id);
  if (error) {
    console.error('[api/moments] delete failed:', error.message);
    return NextResponse.json({ error: 'Could not delete.', code: 'DB_ERROR' }, { status: 500 });
  }
  const marker = `/${MOMENT_BUCKET}/`;
  const url = String(moment.image_url);
  const at = url.indexOf(marker);
  if (at >= 0) {
    const admin = createServiceClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, { auth: { persistSession: false } });
    await admin.storage.from(MOMENT_BUCKET).remove([url.slice(at + marker.length)]);
  }
  return NextResponse.json({ success: true });
}
