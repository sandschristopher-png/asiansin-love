import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createServerSupabaseClient } from '@/lib/supabaseServer';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2025-02-24.acacia' as any,
});

export async function POST(req: Request) {
  try {
    const supabase = await createServerSupabaseClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized. Please log in.' }, { status: 401 });
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('email, stripe_customer_id')
      .eq('id', user.id)
      .maybeSingle();

    const priceId = process.env.STRIPE_PLUS_PRICE_ID;
    if (!priceId) {
      return NextResponse.json({ error: 'Stripe Plus Price ID is not configured in .env.local.' }, { status: 500 });
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      client_reference_id: user.id,
      customer_email: profile?.stripe_customer_id ? undefined : (user.email || profile?.email),
      customer: profile?.stripe_customer_id || undefined,
      metadata: {
        userId: user.id,
        plan: 'plus',
      },
      success_url: `${appUrl}/discover?upgraded=true`,
      cancel_url: `${appUrl}/pricing?canceled=true`,
      subscription_data: {
        metadata: {
          userId: user.id,
        },
      },
    });

    return NextResponse.json({ url: session.url });
  } catch (err: any) {
    console.error('Stripe checkout error:', err);
    return NextResponse.json({ error: err.message || 'Error creating checkout session' }, { status: 500 });
  }
}
