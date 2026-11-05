import { NextRequest, NextResponse } from 'next/server';
import { createClient as createSessionClient } from '@/lib/supabase/server';
import { NON_ANNOUNCEMENT_FILTER } from '@/lib/announcements';

// Announcements only (verification results, safety warnings, Plus, platform updates).
// Chats live on the Messages tab, sparks / matches / views on the Sparks tab (lib/announcements.ts).

export async function GET(req: NextRequest) {
  // Shared server client: writes refreshed auth cookies back (a no-op setAll would consume the
  // rotating refresh token without saving its replacement and sign the member out).
  const supabase = await createSessionClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { data: rows, error } = await supabase
    .from('notifications')
    .select('id, user_id, actor_id, type, title, description, link_url, payload, is_read, created_at')
    .eq('user_id', user.id)
    .not('type', 'in', NON_ANNOUNCEMENT_FILTER)
    .order('created_at', { ascending: false })
    .limit(30);

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

export async function POST(req: NextRequest) {
  // Shared server client: writes refreshed auth cookies back (a no-op setAll would consume the
  // rotating refresh token without saving its replacement and sign the member out).
  const supabase = await createSessionClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { error } = await supabase
    .from('notifications')
    .update({ is_read: true })
    .eq('user_id', user.id)
    .not('type', 'in', NON_ANNOUNCEMENT_FILTER)
    .eq('is_read', false);

  if (error) return NextResponse.json({ error: 'Update failed' }, { status: 500 });
  return NextResponse.json({ ok: true });
}