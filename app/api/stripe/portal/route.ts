// app/api/stripe/portal/route.ts
//   POST { return_path?: '/settings' | '/plus' } -> { url } of a Stripe Billing Portal session
//
// Members cancel AIL+ or update their payment method themselves in the portal. The customer is
// read from profiles.stripe_customer_id (written by the webhook), with lookups by checkout
// metadata and email as fallbacks for older subscriptions.
import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';
import { createClient as createSessionClient } from '@/lib/supabase/server';

export const runtime = 'nodejs';

const RETURN_PATHS = new Set(['/settings', '/plus']);

async function findCustomerId(stripe: Stripe, userId: string, email: string | undefined): Promise<string | null> {
  if (process.env.SUPABASE_SERVICE_ROLE_KEY) {
    const admin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY, {
      auth: { persistSession: false },
    });
    const { data: profile } = await admin.from('profiles').select('stripe_customer_id').eq('id', userId).maybeSingle();
    if (typeof profile?.stripe_customer_id === 'string' && profile.stripe_customer_id.startsWith('cus_')) {
      return profile.stripe_customer_id;
    }
  }

  const search = await stripe.customers
    .search({ query: `metadata['userId']:'${userId}'`, limit: 1 })
    .catch(() => ({ data: [] as Stripe.Customer[] }));
  if (search.data.length > 0) return search.data[0].id;

  if (email) {
    const customers = await stripe.customers.list({ email, limit: 1 });
    if (customers.data.length > 0) return customers.data[0].id;
  }
  return null;
}

export async function POST(req: NextRequest) {
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

  let returnPath = '/settings';
  try {
    const body = await req.json();
    if (typeof body?.return_path === 'string' && RETURN_PATHS.has(body.return_path)) returnPath = body.return_path;
  } catch {
    // no body: default return path
  }

  const stripe = new Stripe(secret);
  // Only return to our own site (production, Vercel previews or local dev).
  const requestOrigin = req.headers.get('origin') || '';
  const origin = /^https:\/\/([a-z0-9-]+\.)*(asiansin\.love|vercel\.app)$|^http:\/\/localhost(:\d+)?$/i.test(requestOrigin)
    ? requestOrigin
    : 'https://asiansin.love';

  try {
    const customerId = await findCustomerId(stripe, user.id, user.email ?? undefined);
    if (!customerId) {
      return NextResponse.json(
        { error: 'No active billing record found. If you recently subscribed, please allow a moment for Stripe to sync.' },
        { status: 404 }
      );
    }

    const session = await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: `${origin}${returnPath}`,
    });
    return NextResponse.json({ url: session.url });
  } catch (err: unknown) {
    console.error('Portal session error:', err);
    return NextResponse.json({ error: 'Could not open the billing portal. Please try again.' }, { status: 500 });
  }
}
