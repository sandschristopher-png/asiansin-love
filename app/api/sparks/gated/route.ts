import { NextResponse } from 'next/server';
import { createClient as createServiceClient, type SupabaseClient } from '@supabase/supabase-js';
import { createClient } from '@/lib/supabase/server';

/** Free members see their newest visitors in full; older ones stay locked until Plus. */
const FREE_VISITORS = 3;
const VISITOR_COLUMNS =
  'id, username, display_name, full_name, avatar_url, photos, city, country, is_verified, verification_status, is_plus, reputation_score';

/**
 * Visitors (Ashiato): newest visit per member from public.profile_views (written by
 * /api/profile/view, which skips Plus members in Ghost Mode). Blocked members either way are left out.
 */
async function loadVisitors(service: SupabaseClient, uid: string) {
  const [{ data: views, error }, { data: blocks }] = await Promise.all([
    service
      .from('profile_views')
      .select('viewer_id, created_at')
      .eq('viewed_id', uid)
      .neq('viewer_id', uid)
      .order('created_at', { ascending: false })
      .limit(500),
    service.from('user_blocks').select('blocker_id, blocked_id').or(`blocker_id.eq.${uid},blocked_id.eq.${uid}`),
  ]);
  if (error) return { error };

  const blocked = new Set<string>();
  (blocks || []).forEach((b: { blocker_id: string; blocked_id: string }) => blocked.add(b.blocker_id === uid ? b.blocked_id : b.blocker_id));
  const latest = new Map<string, string>();
  for (const v of (views || []) as { viewer_id: string | null; created_at: string }[]) {
    if (v.viewer_id && !blocked.has(v.viewer_id) && !latest.has(v.viewer_id)) latest.set(v.viewer_id, v.created_at);
  }
  const ids = Array.from(latest.keys()).slice(0, 200);
  if (ids.length === 0) return { visitors: [] as Record<string, unknown>[] };

  const { data: profiles, error: profileError } = await service.from('profiles').select(VISITOR_COLUMNS).in('id', ids);
  if (profileError) return { error: profileError };
  const byId = new Map(((profiles || []) as unknown as { id: string }[]).map((p) => [p.id, p]));
  const visitors = ids
    .map((id) => (byId.has(id) ? { ...byId.get(id)!, visited_at: latest.get(id)! } : null))
    .filter((v): v is { id: string; visited_at: string } => v !== null);
  return { visitors: visitors as Record<string, unknown>[] };
}

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  // Server-side Plus check — the ONLY source of truth. (profiles has no 'seeking' column: selecting
  // it made this query fail, so every member, Plus included, got 403 and an empty Sparks page.)
  const { data: me, error: meError } = await supabase
    .from('profiles')
    .select('is_plus, gender, looking_for')
    .eq('id', user.id)
    .maybeSingle();
  if (meError) {
    console.error('[sparks/gated] profile lookup failed:', meError.message);
    return NextResponse.json({ error: 'profile_lookup_failed' }, { status: 500 });
  }

  // Plus unlocks Sparked You / Visitors for men; women always have full access for free.
  const fullAccess = Boolean(me?.is_plus) || me?.gender === 'female';

  const { data: sparkedYou, error: e1 } = await supabase.rpc('get_sparked_you_profiles');
  if (e1) return NextResponse.json({ error: e1.message }, { status: 500 });

  const service = createServiceClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
    auth: { persistSession: false },
  });
  const visitorResult = await loadVisitors(service, user.id);
  if (visitorResult.error) {
    console.error('[sparks/gated] visitors failed:', visitorResult.error.message);
    return NextResponse.json({ error: 'visitors_failed' }, { status: 500 });
  }
  const visitedYou = visitorResult.visitors ?? [];

  if (!fullAccess) {
    // Free preview: the newest Spark and the 3 newest visitors in full, then only counts and
    // visit times. Locked rows carry no profile data, so nothing about those members ever
    // reaches the browser.
    const sparked = (sparkedYou ?? []) as unknown[];
    return NextResponse.json({
      access: 'preview',
      sparkedYou: [...sparked.slice(0, 1), ...sparked.slice(1).map((_, i) => ({ id: `locked-sparked-${i}`, locked: true }))],
      visitedYou: [
        ...visitedYou.slice(0, FREE_VISITORS),
        ...visitedYou.slice(FREE_VISITORS).map((v, i) => ({ id: `locked-visited-${i}`, locked: true, visited_at: v.visited_at })),
      ],
      gender: me?.gender ?? null,
      lookingFor: me?.looking_for ?? null,
    });
  }

  return NextResponse.json({ access: 'full', sparkedYou: sparkedYou ?? [], visitedYou, gender: me?.gender ?? null, lookingFor: me?.looking_for ?? null });
}
