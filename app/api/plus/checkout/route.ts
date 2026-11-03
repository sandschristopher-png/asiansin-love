import { NextRequest, NextResponse } from 'next/server';
import { DEFAULT_PLUS_PLAN, isPlusPlanId, type PlusPlanId } from '@/lib/plusPlans';
import { PLUS_PRICE_IDS } from '@/lib/stripePrices';
import Stripe from 'stripe';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export const runtime = 'nodejs';

/**
 * Amounts live in lib/plusPlans.ts; Stripe ids in lib/stripePrices.ts. Each plan is ONE flat
 * recurring price ($29.99 every 3 months, never 3 x monthly) charged with quantity 1.
 */
const PLAN_PRICES: Record<PlusPlanId, string> = PLUS_PRICE_IDS;

const SITE_ORIGIN = (process.env.NEXT_PUBLIC_SITE_URL || 'https://asiansin.love').replace(/\/$/, '');
// Only these origins may be used for Stripe's success/cancel redirects.
const ALLOWED_ORIGINS = new Set([
  SITE_ORIGIN,
  'https://asiansin.love',
  'https://www.asiansin.love',
  ...(process.env.NODE_ENV === 'production' ? [] : ['http://localhost:3000']),
]);

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
  let planId: PlusPlanId = DEFAULT_PLUS_PLAN;
  let returnPath = '/plus';
  try {
    const body = await req.json();
    if (body?.planId) {
      if (!isPlusPlanId(body.planId)) {
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
  const requestOrigin = req.headers.get('origin');
  const origin = requestOrigin && ALLOWED_ORIGINS.has(requestOrigin) ? requestOrigin : SITE_ORIGIN;
  const delimiter = returnPath.includes('?') ? '&' : '?';

  const session = await stripe.checkout.sessions.create({
    mode: 'subscription',
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: `${origin}${returnPath}${delimiter}success=1`,
    cancel_url: `${origin}${returnPath}`,
    client_reference_id: user.id,
    // planId is stored on the subscription so every renewal / change event still knows the tier.
    subscription_data: { metadata: { userId: user.id, planId } },
    metadata: { userId: user.id, planId },
  });

  return NextResponse.json({ url: session.url });
}
