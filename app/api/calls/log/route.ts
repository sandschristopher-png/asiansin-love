import { NextResponse, after } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { createClient as createSessionClient } from '@/lib/supabase/server';
import { pairKey, parseCallLogBody } from '@/lib/callRules';
import { sendPushToUser } from '@/lib/pushSender';

/**
 * Records how a call ended. The caller is the single writer: normally the browser posts here when the
 * call finishes, and a tab that is closing mid-call sends the same body with navigator.sendBeacon (an
 * ordinary insert from a dying page never completes). The call id doubles as the row id, so a
 * repeated send is a no-op and a missed call notifies the callee exactly once.
 */
export async function POST(req: Request) {
  const session = await createSessionClient();
  const { data: { user } } = await session.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  let raw: unknown = null;
  try {
    // sendBeacon posts a Blob: read the text and parse it ourselves whatever the content type says.
    raw = JSON.parse(await req.text());
  } catch {
    return NextResponse.json({ error: 'Invalid body' }, { status: 400 });
  }
  const log = parseCallLogBody(raw, Date.now());
  if (!log || log.peer === user.id) return NextResponse.json({ error: 'Invalid call log' }, { status: 400 });

  // The row goes in under the member's own session, so RLS (caller_id = auth.uid()) stays the authority.
  const { error } = await session.from('call_logs').insert({
    id: log.id,
    match_id: pairKey(user.id, log.peer),
    caller_id: user.id,
    callee_id: log.peer,
    started_at: log.startedAt,
    ended_at: log.endedAt,
    duration_sec: log.durationSec,
    end_reason: log.reason,
  });
  if (error) {
    if (error.code === '23505') return NextResponse.json({ ok: true, duplicate: true });
    console.warn('[api/calls/log] insert failed:', error.message);
    return NextResponse.json({ error: 'Could not save the call log' }, { status: 500 });
  }

  if (log.reason === 'missed') {
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (key) {
      const db = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, key, { auth: { persistSession: false } });
      const { data: actor } = await db.from('profiles').select('username').eq('id', user.id).maybeSingle();
      const name = String(actor?.username ?? 'Someone').replace(/^@+/, '');
      await db
        .from('notifications')
        .insert({
          user_id: log.peer,
          actor_id: user.id,
          type: 'call_missed',
          title: `Missed voice call from ${name}`,
          description: 'Tap to open the chat.',
          link_url: `/chat/${user.id}`,
          is_read: false,
        })
        .then(({ error: nErr }) => nErr && console.warn('[api/calls/log] notification failed:', nErr.message));
      after(() =>
        sendPushToUser({ userId: log.peer, type: 'call', conversationId: user.id, actorId: user.id, body: `Missed voice call from ${name}`, tag: `call:${user.id}` })
      );
    }
  }
  return NextResponse.json({ ok: true });
}
