import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export const runtime = 'nodejs';

const ALLOWED = [
  ['Manila', 'Philippines'], ['Cebu City', 'Philippines'], ['Angeles City', 'Philippines'],
  ['Davao City', 'Philippines'], ['Bislig', 'Philippines'], ['Bangkok', 'Thailand'],
  ['Chiang Mai', 'Thailand'], ['Jakarta', 'Indonesia'], ['Bali', 'Indonesia'],
  ['Yangon', 'Myanmar'], ['Phnom Penh', 'Cambodia'], ['Ho Chi Minh City', 'Vietnam'],
  ['Vientiane', 'Laos']
];

export async function POST(req: NextRequest) {
  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll: () => cookieStore.getAll(), setAll: () => {} } }
  );

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Please sign in first.' }, { status: 401 });
  }

  const body = await req.json().catch(() => ({}));
  const match = ALLOWED.find(([c, co]) => c === body.city && co === body.country);
  if (!match) {
    return NextResponse.json({ error: 'Invalid destination.' }, { status: 400 });
  }

  // Verify membership server-side before allowing the override
  const { data: prof } = await supabase
    .from('profiles')
    .select('is_plus')
    .eq('id', user.id)
    .maybeSingle();

  if (!prof?.is_plus) {
    return NextResponse.json({ error: 'AIL+ required.' }, { status: 402 });
  }

  const { error } = await supabase
    .from('profiles')
    .update({ travel_city: match[0], travel_country: match[1] })
    .eq('id', user.id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true, city: match[0], country: match[1] });
}
