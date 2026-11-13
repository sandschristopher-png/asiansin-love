// app/api/admin/announcements/route.ts  (staff only)
//   GET  -> { announcements }  newest first, pinned on top
//   POST { action: 'create', title, body, tag, isPinned }   -> broadcasts to every member
//        { action: 'set_pinned', id, pinned }
//        { action: 'delete', id }
// Writes use the service-role client from verifyAdminCaller; members only ever read
// (RLS in 20261113_announcements.sql).
import { NextRequest, NextResponse, after } from 'next/server';
import { broadcastPush } from '@/lib/pushSender';
import { verifyAdminCaller } from '@/lib/adminAuth';
import {
  BROADCAST_BODY_MAX,
  BROADCAST_TITLE_MAX,
  MISSING_BROADCASTS_RE,
  RUN_BROADCASTS_MIGRATION,
  isBroadcastTag,
} from '@/lib/broadcasts';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const dbError = (message: string) =>
  MISSING_BROADCASTS_RE.test(message)
    ? NextResponse.json({ error: RUN_BROADCASTS_MIGRATION }, { status: 503 })
    : NextResponse.json({ error: message }, { status: 500 });

export async function GET() {
  const auth = await verifyAdminCaller();
  if (!auth.authorized) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const { data, error } = await auth.supabase
    .from('announcements')
    .select('*')
    .order('is_pinned', { ascending: false })
    .order('published_at', { ascending: false })
    .limit(100);
  if (error) return dbError(error.message);
  return NextResponse.json({ announcements: data ?? [] });
}

export async function POST(req: NextRequest) {
  const auth = await verifyAdminCaller();
  if (!auth.authorized) return NextResponse.json({ error: auth.error }, { status: auth.status });
  const admin = auth.supabase;

  let body: { action?: string; id?: string; title?: unknown; body?: unknown; tag?: unknown; isPinned?: unknown; pinned?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  if (body.action === 'create') {
    const title = typeof body.title === 'string' ? body.title.trim() : '';
    const text = typeof body.body === 'string' ? body.body.trim() : '';
    if (!title || title.length > BROADCAST_TITLE_MAX) {
      return NextResponse.json({ error: `Title is required (up to ${BROADCAST_TITLE_MAX} characters).` }, { status: 400 });
    }
    if (!text || text.length > BROADCAST_BODY_MAX) {
      return NextResponse.json({ error: `Message is required (up to ${BROADCAST_BODY_MAX} characters).` }, { status: 400 });
    }
    if (!isBroadcastTag(body.tag)) return NextResponse.json({ error: 'Choose a category.' }, { status: 400 });

    const { data, error } = await admin
      .from('announcements')
      .insert({ title, body: text, tag: body.tag, is_pinned: body.isPinned === true, author_id: auth.adminId })
      .select('*')
      .single();
    if (error) return dbError(error.message);
    // Web push to every subscribed device (members who switched announcements off are skipped).
    after(() => broadcastPush({ body: title, url: '/announcements', tag: `announcement:${data.id}` }));
    return NextResponse.json({ success: true, announcement: data });
  }

  if (!body.id || !UUID_RE.test(body.id)) return NextResponse.json({ error: 'id is required.' }, { status: 400 });

  if (body.action === 'set_pinned') {
    const { data, error } = await admin
      .from('announcements')
      .update({ is_pinned: body.pinned === true })
      .eq('id', body.id)
      .select('*')
      .maybeSingle();
    if (error) return dbError(error.message);
    if (!data) return NextResponse.json({ error: 'Announcement not found.' }, { status: 404 });
    return NextResponse.json({ success: true, announcement: data });
  }

  if (body.action === 'delete') {
    const { error } = await admin.from('announcements').delete().eq('id', body.id);
    if (error) return dbError(error.message);
    return NextResponse.json({ success: true });
  }

  return NextResponse.json({ error: 'Unknown action.' }, { status: 400 });
}
