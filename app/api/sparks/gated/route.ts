import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

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

  // Plus unlocks Sparked You / Visited for men; women always have full access for free.
  const fullAccess = Boolean(me?.is_plus) || me?.gender === 'female';

  const { data: sparkedYou, error: e1 } = await supabase.rpc('get_sparked_you_profiles');
  if (e1) return NextResponse.json({ error: e1.message }, { status: 500 });

  const { data: visitedYou, error: e2 } = await supabase.rpc('get_visited_you_profiles');
  if (e2) return NextResponse.json({ error: e2.message }, { status: 500 });

  if (!fullAccess) {
    // Free preview: the newest Spark in full, then only counts. Locked rows carry no profile data,
    // so nothing about those members ever reaches the browser.
    const sparked = (sparkedYou ?? []) as unknown[];
    const visited = (visitedYou ?? []) as unknown[];
    return NextResponse.json({
      access: 'preview',
      sparkedYou: [...sparked.slice(0, 1), ...sparked.slice(1).map((_, i) => ({ id: `locked-sparked-${i}`, locked: true }))],
      visitedYou: visited.map((_, i) => ({ id: `locked-visited-${i}`, locked: true })),
      gender: me?.gender ?? null,
      lookingFor: me?.looking_for ?? null,
    });
  }

  return NextResponse.json({ access: 'full', sparkedYou: sparkedYou ?? [], visitedYou: visitedYou ?? [], gender: me?.gender ?? null, lookingFor: me?.looking_for ?? null });
}