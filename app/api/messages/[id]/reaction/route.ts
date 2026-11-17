import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { createClient as createSessionClient } from '@/lib/supabase/server';
import { isReactionKey } from '@/lib/reactions';

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * POST { reaction: 'heart' | 'thumbs_up' | 'laugh' | 'fire' | null } -> { reaction }
 * Sets (or, with null, removes) the caller's one reaction on a message they are part of. Blocked pairs are
 * refused. The row is written with the service role after those checks; RLS still guards direct writes.
 */
export async function POST(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  if (!UUID_RE.test(id)) return NextResponse.json({ error: 'Invalid message.' }, { status: 400 });

  const session = await createSessionClient();
  const { data: { user } } = await session.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = (await req.json().catch(() => ({}))) as { reaction?: unknown };
  const reaction = body.reaction === null ? null : body.reaction;
  if (reaction !== null && !isReactionKey(reaction)) return NextResponse.json({ error: 'Invalid reaction.' }, { status: 400 });

  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!key) return NextResponse.json({ error: 'Unavailable.' }, { status: 503 });
  const db = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, key, { auth: { persistSession: false } });

  const { data: message } = await db.from('messages').select('sender_id, receiver_id, is_quarantined').eq('id', id).maybeSingle();
  if (!message || message.is_quarantined || (message.sender_id !== user.id && message.receiver_id !== user.id)) {
    return NextResponse.json({ error: 'Message not found.' }, { status: 404 });
  }
  const other = message.sender_id === user.id ? message.receiver_id : message.sender_id;
  const { data: block } = await db
    .from('user_blocks')
    .select('id')
    .or(`and(blocker_id.eq.${user.id},blocked_id.eq.${other}),and(blocker_id.eq.${other},blocked_id.eq.${user.id})`)
    .limit(1)
    .maybeSingle();
  if (block) return NextResponse.json({ error: 'You cannot react to this member.' }, { status: 403 });

  const { error } =
    reaction === null
      ? await db.from('message_reactions').delete().eq('message_id', id).eq('user_id', user.id)
      : await db.from('message_reactions').upsert({ message_id: id, user_id: user.id, reaction }, { onConflict: 'message_id,user_id' });
  if (error) {
    console.error('[api/messages/reaction] failed:', error.message);
    return NextResponse.json({ error: 'Could not save your reaction.' }, { status: 500 });
  }
  return NextResponse.json({ reaction });
}
