import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export const runtime = 'nodejs';

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

  const secret = process.env.STRIPE_SECRET_KEY;
  const priceId = process.env.STRIPE_PLUS_PRICE_ID;
  if (!secret || !priceId) {
    return NextResponse.json({ error: 'Stripe is not configured yet.' }, { status: 503 });
  }

  const stripe = new Stripe(secret);
  const origin = req.headers.get('origin') || 'https://asiansin.love';

  const session = await stripe.checkout.sessions.create({
    mode: 'subscription',
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: origin + '/plus?success=1',
    cancel_url: origin + '/plus',
    client_reference_id: user.id,
    metadata: { userId: user.id }
  });

  return NextResponse.json({ url: session.url });
}
