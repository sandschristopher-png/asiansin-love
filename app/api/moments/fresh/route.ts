// GET /api/moments/fresh -> { latest }   newest active Moment from the last 14 days in the member's
// hub (their profile city when it is one of ours, otherwise anywhere in Southeast Asia), never their
// own. The nav tab compares it with the time the member last opened Moments to show its dot.
import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { MOMENT_CITIES } from '@/lib/moments';

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ latest: null });

  const { data: profile } = await supabase.from('profiles').select('city').eq('id', user.id).maybeSingle();
  const raw = String(profile?.city || '').trim().toLowerCase();
  const hub = raw.length > 2 ? MOMENT_CITIES.find((c) => raw.includes(c.toLowerCase()) || c.toLowerCase().includes(raw)) : undefined;

  let q = supabase
    .from('moments')
    .select('created_at')
    .eq('status', 'active')
    .neq('user_id', user.id)
    .gt('created_at', new Date(Date.now() - 14 * 86_400_000).toISOString())
    .order('created_at', { ascending: false })
    .limit(1);
  if (hub) q = q.eq('city', hub);
  const { data } = await q;
  return NextResponse.json({ latest: data?.[0]?.created_at ?? null });
}
