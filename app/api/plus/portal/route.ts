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

  const stripe = new Stripe(secret);
  const origin = req.headers.get('origin') || 'https://asiansin.love';

  try {
    let customerId: string | null = null;

    // 1. Look up customer by email
    if (user.email) {
      const customers = await stripe.customers.list({
        email: user.email,
        limit: 1,
      });
      if (customers.data.length > 0) {
        customerId = customers.data[0].id;
      }
    }

    // 2. Fallback to searching customer metadata if not found by email
    if (!customerId) {
      const search = await stripe.customers.search({
        query: `metadata['userId']:'${user.id}'`,
        limit: 1,
      }).catch(() => ({ data: [] }));

      if (search.data && search.data.length > 0) {
        customerId = search.data[0].id;
      }
    }

    if (!customerId) {
      return NextResponse.json(
        { error: 'No active billing record found. If you recently subscribed, please allow a moment for Stripe to sync.' },
        { status: 404 }
      );
    }

    const session = await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: `${origin}/plus`,
    });

    return NextResponse.json({ url: session.url });
  } catch (err: any) {
    console.error('Portal session error:', err);
    return NextResponse.json(
      { error: err?.message || 'Could not access billing portal.' },
      { status: 500 }
    );
  }
}