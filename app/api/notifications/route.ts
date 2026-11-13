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

  const all = req.nextUrl.searchParams.get('scope') === 'all';
  let query = supabase
    .from('notifications')
    .select('id, user_id, actor_id, type, title, description, link_url, payload, is_read, created_at')
    .eq('user_id', user.id)
    .not('type', 'like', ADMIN_TYPE_LIKE);
  if (all) {
    const hidden = await hiddenTypes(supabase, user.id);
    if (hidden.length) query = query.not('type', 'in', `(${hidden.join(',')})`);
  } else {
    query = query.not('type', 'in', NON_ANNOUNCEMENT_FILTER);
  }
  const { data: rows, error } = await query.order('created_at', { ascending: false }).limit(30);

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

  const unread_count = notifications.filter((n: any) => !n.is_read).length;
  return NextResponse.json({ notifications, unread_count });
}

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function POST(req: NextRequest) {
  // Shared server client: writes refreshed auth cookies back (a no-op setAll would consume the
  // rotating refresh token without saving its replacement and sign the member out).
  const supabase = await createSessionClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  // Body { ids: [...] }: mark exactly the rows the dropdown showed (so hidden types stay unread).
  let ids: string[] | null = null;
  try {
    const body = await req.json();
    if (Array.isArray(body?.ids)) ids = body.ids.filter((x: unknown) => typeof x === 'string' && UUID_RE.test(x)).slice(0, 100);
  } catch {
    // no body: mark all announcements read (the /announcements page)
  }

  let query = supabase
    .from('notifications')
    .update({ is_read: true })
    .eq('user_id', user.id)
    .eq('is_read', false)
    .not('type', 'like', ADMIN_TYPE_LIKE);
  if (ids) {
    if (ids.length === 0) return NextResponse.json({ ok: true });
    query = query.in('id', ids);
  } else {
    query = query.not('type', 'in', NON_ANNOUNCEMENT_FILTER);
  }
  const { error } = await query;

  if (error) return NextResponse.json({ error: 'Update failed' }, { status: 500 });
  return NextResponse.json({ ok: true });
}
