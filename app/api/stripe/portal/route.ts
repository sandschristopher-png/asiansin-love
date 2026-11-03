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
  const admin = process.env.SUPABASE_SERVICE_ROLE_KEY
    ? createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY, {
        auth: { persistSession: false },
      })
    : null;

  // 1. The id stored on the profile, if it still exists in Stripe.
  if (admin) {
    const { data: profile } = await admin.from('profiles').select('stripe_customer_id').eq('id', userId).maybeSingle();
    const stored = profile?.stripe_customer_id;
    if (typeof stored === 'string' && stored.startsWith('cus_')) {
      const customer = await stripe.customers.retrieve(stored).catch(() => null);
      if (customer && !('deleted' in customer && customer.deleted)) return stored;
    }
  }

  // 2. Fall back to checkout metadata, then the account email; link what we find to the profile.
  const search = await stripe.customers
    .search({ query: `metadata['userId']:'${userId}'`, limit: 1 })
    .catch(() => ({ data: [] as Stripe.Customer[] }));
  let found = search.data[0]?.id ?? null;
  if (!found && email) {
    const customers = await stripe.customers.list({ email, limit: 1 }).catch(() => ({ data: [] as Stripe.Customer[] }));
    found = customers.data[0]?.id ?? null;
  }
  if (found && admin) {
    const { error } = await admin.from('profiles').update({ stripe_customer_id: found }).eq('id', userId);
    if (error) console.warn('[stripe/portal] could not link stripe_customer_id:', error.message);
  }
  return found;
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
      return NextResponse.json({ error: 'No active Stripe billing profile found' }, { status: 400 });
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
