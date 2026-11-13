import { NextRequest, NextResponse } from 'next/server';
import { createClient as createSessionClient } from '@/lib/supabase/server';
import { NON_ANNOUNCEMENT_FILTER } from '@/lib/announcements';
import { ADMIN_TYPE_LIKE } from '@/lib/adminRoles';

// Default: announcements only (verification results, safety warnings, Plus, platform updates).
// Chats live on the Messages tab, sparks / matches / views on the Sparks tab (lib/announcements.ts).
// ?scope=all: every member notification for the account dropdown (components/Navbar.tsx), minus
// the types the member switched off in profiles.notification_prefs. Staff alerts (admin_*) are
// never listed here; they have /api/admin/notifications.

/** notification_prefs key -> the notification types it controls. */
const PREF_TYPES: Record<string, string[]> = {
  messages: ['message'],
  sparks: ['favorite', 'spark', 'spark_received'],
  matches: ['match', 'mutual_match'],
  visits: ['visit', 'profile_visit'],
};

async function hiddenTypes(supabase: Awaited<ReturnType<typeof createSessionClient>>, userId: string): Promise<string[]> {
  const { data } = await supabase.from('profiles').select('notification_prefs').eq('id', userId).maybeSingle();
  const prefs = (data?.notification_prefs ?? {}) as Record<string, unknown>;
  return Object.entries(PREF_TYPES).flatMap(([key, types]) => (prefs[key] === false ? types : []));
}

export async function GET(req: NextRequest) {
  // Shared server client: writes refreshed auth cookies back (a no-op setAll would consume the
  // rotating refresh token without saving its replacement and sign the member out).
  const supabase = await createSessionClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const params = req.nextUrl.searchParams;
  const all = params.get('scope') === 'all';
  // ?fresh=1 (bell panel): unread rows first, then read rows from the last 7 days only.
  const fresh = all && params.get('fresh') === '1';
  // ?before=<ISO> (the /notifications page "Load more"): older rows, newest first.
  const before = params.get('before');
  const beforeIso = before && !Number.isNaN(Date.parse(before)) ? new Date(before).toISOString() : null;
  const limit = Math.min(Math.max(Number(params.get('limit')) || 30, 1), 50);

  const hidden = all ? await hiddenTypes(supabase, user.id) : [];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const scoped = (q: any): any => {
    let out = q.not('type', 'like', ADMIN_TYPE_LIKE);
    if (!all) out = out.not('type', 'in', NON_ANNOUNCEMENT_FILTER);
    else if (hidden.length) out = out.not('type', 'in', `(${hidden.join(',')})`);
    return out;
  };

  let query = scoped(
    supabase
      .from('notifications')
      .select('id, user_id, actor_id, type, title, description, link_url, payload, is_read, created_at')
      .eq('user_id', user.id)
  );
  if (fresh) {
    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
    query = query.or(`is_read.eq.false,created_at.gte.${weekAgo}`).order('is_read', { ascending: true });
  }
  if (beforeIso) query = query.lt('created_at', beforeIso);
  const [{ data: rows, error }, unreadRes] = await Promise.all([
    query.order('created_at', { ascending: false }).limit(limit),
    // Exact unread count for the bell chip (the list itself is capped).
    all
      ? scoped(supabase.from('notifications').select('id', { count: 'exact', head: true }).eq('user_id', user.id)).eq('is_read', false)
      : Promise.resolve({ count: null as number | null }),
  ]);

  if (error) {
    console.error('notifications GET failed:', error.message, error.code, error.details, error.hint);
    return NextResponse.json({ error: 'Failed to load notifications' }, { status: 500 });
  }

  const actorIds = [...new Set((rows ?? []).filter((r: any) => r.actor_id).map((r: any) => r.actor_id))];
  const actorMap: Record<string, any> = {};
  if (actorIds.length > 0) {
    const { data: actors } = await supabase
      .from('profiles')
      .select('id, username, avatar_url')
      .in('id', actorIds);
    (actors ?? []).forEach((a: any) => { actorMap[a.id] = a; });
  }

  const notifications = (rows ?? []).map((r: any) => {
    const { actor_id, ...rest } = r;
    return { ...rest, actor: actor_id ? (actorMap[actor_id] ?? null) : null };
  });

  const unread_count = unreadRes.count ?? notifications.filter((n: any) => !n.is_read).length;
  return NextResponse.json({ notifications, unread_count, has_more: (rows ?? []).length === limit });
}

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function POST(req: NextRequest) {
  // Shared server client: writes refreshed auth cookies back (a no-op setAll would consume the
  // rotating refresh token without saving its replacement and sign the member out).
  const supabase = await createSessionClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  // Body { ids: [...] }: mark exactly the rows the bell panel showed / the row tapped.
  // Body { all: true }: "Mark all read" - every member notification the member can see.
  let ids: string[] | null = null;
  let markAll = false;
  try {
    const body = await req.json();
    if (Array.isArray(body?.ids)) ids = body.ids.filter((x: unknown) => typeof x === 'string' && UUID_RE.test(x)).slice(0, 100);
    markAll = body?.all === true;
  } catch {
    // no body: mark all announcements read (the /announcements page)
  }
  const hidden = markAll ? await hiddenTypes(supabase, user.id) : [];

  let query = supabase
    .from('notifications')
    .update({ is_read: true })
    .eq('user_id', user.id)
    .eq('is_read', false)
    .not('type', 'like', ADMIN_TYPE_LIKE);
  if (ids) {
    if (ids.length === 0) return NextResponse.json({ ok: true });
    query = query.in('id', ids);
  } else if (markAll) {
    if (hidden.length) query = query.not('type', 'in', `(${hidden.join(',')})`);
  } else {
    query = query.not('type', 'in', NON_ANNOUNCEMENT_FILTER);
  }
  const { error } = await query;

  if (error) return NextResponse.json({ error: 'Update failed' }, { status: 500 });
  return NextResponse.json({ ok: true });
}
