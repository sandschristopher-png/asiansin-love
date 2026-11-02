import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export const runtime = 'nodejs';

const PLAN_PRICES: Record<'12m' | '3m' | '1m', string | undefined> = {
  '12m': process.env.STRIPE_PLUS_PRICE_12M ?? process.env.STRIPE_PRICE_ANNUAL,
  '3m': process.env.STRIPE_PLUS_PRICE_3M,
  '1m': process.env.STRIPE_PLUS_PRICE_1M ?? process.env.STRIPE_PRICE_MONTHLY,
};

export async function POST(req: NextRequest) {
  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll: () => cookieStore.getAll(), setAll: () => {} } }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Please sign in first.' }, { status: 401 });
  }

  const secret = process.env.STRIPE_SECRET_KEY;
  if (!secret) {
    return NextResponse.json({ error: 'Stripe is not configured yet.' }, { status: 503 });
  }

  // Parse planId and optional returnPath from request body (relative paths only)
  let planId: '12m' | '3m' | '1m' = '12m';
  let returnPath = '/plus';
  try {
    const body = await req.json();
    if (body?.planId) {
      if (body.planId !== '12m' && body.planId !== '3m' && body.planId !== '1m') {
        return NextResponse.json({ error: 'Invalid plan selected.' }, { status: 400 });
      }
      planId = body.planId;
    }
    if (
      body?.returnPath &&
      typeof body.returnPath === 'string' &&
      body.returnPath.startsWith('/') &&
      !body.returnPath.startsWith('//')
    ) {
      returnPath = body.returnPath;
    }
  } catch {}

  const priceId = PLAN_PRICES[planId];
  if (!priceId) {
    return NextResponse.json({ error: `Stripe price for plan '${planId}' is not configured.` }, { status: 503 });
  }

  const stripe = new Stripe(secret);
  const origin = req.headers.get('origin') || 'https://asiansin.love';
  const delimiter = returnPath.includes('?') ? '&' : '?';

  const session = await stripe.checkout.sessions.create({
    mode: 'subscription',
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: `${origin}${returnPath}${delimiter}success=1`,
    cancel_url: `${origin}${returnPath}`,
    client_reference_id: user.id,
    subscription_data: { metadata: { userId: user.id } },
    metadata: { userId: user.id, planId },
  });

  return NextResponse.json({ url: session.url });
}