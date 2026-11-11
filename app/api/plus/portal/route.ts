import { NextRequest, NextResponse } from 'next/server';
import { createClient as createSessionClient } from '@/lib/supabase/server';
import Stripe from 'stripe';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  // Shared server client: writes refreshed auth cookies back (a no-op setAll would consume the
  // rotating refresh token without saving its replacement and sign the member out).
  const supabase = await createSessionClient();

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
  const origin = req.headers.get('origin') || 'https://meetin.asia';

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