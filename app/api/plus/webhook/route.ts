import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

export const runtime = 'nodejs';

/** '12m' stays for members who subscribed to the retired annual plan. */
type Tier = '12m' | '6m' | '3m' | '1m';
const isTier = (v: unknown): v is Tier => v === '12m' || v === '6m' || v === '3m' || v === '1m';

/** price id -> tier, built from the same env vars the checkout route uses. */
function tierFromPriceId(priceId: string | undefined | null): Tier | null {
  if (!priceId) return null;
  const map: Array<[Tier, Array<string | undefined>]> = [
    ['12m', [process.env.STRIPE_PLUS_PRICE_12M, process.env.STRIPE_PRICE_ANNUAL]],
    ['6m', [process.env.STRIPE_PLUS_PRICE_6M]],
    ['3m', [process.env.STRIPE_PLUS_PRICE_3M]],
    ['1m', [process.env.STRIPE_PLUS_PRICE_1M, process.env.STRIPE_PRICE_MONTHLY]],
  ];
  for (const [tier, ids] of map) if (ids.includes(priceId)) return tier;
  return null;
}

function tierFromSubscription(sub: Stripe.Subscription): Tier | null {
  const fromMeta = (sub.metadata as Record<string, string> | undefined)?.planId;
  if (isTier(fromMeta)) return fromMeta;
  return tierFromPriceId(sub.items?.data?.[0]?.price?.id);
}

/**
 * Writes the membership state. Optional columns (plus_enabled, membership_tier) are dropped
 * automatically if they do not exist yet; is_plus is always written.
 * Returns an error message if even the minimal update failed (so Stripe retries the event).
 */
async function applyMembership(
  admin: SupabaseClient,
  userId: string,
  active: boolean,
  tier: Tier | null
): Promise<string | null> {
  const payload: Record<string, unknown> = {
    is_plus: active,
    plus_enabled: active,
    membership_tier: active ? tier : null,
  };

  for (let attempt = 0; attempt < 4; attempt++) {
    const { error } = await admin.from('profiles').update(payload).eq('id', userId);
    if (!error) return null;

    const missing =
      /Could not find the '([a-z_]+)' column/i.exec(error.message)?.[1] ||
      /column "?([a-z_]+)"? .*does not exist/i.exec(error.message)?.[1];
    if (missing && missing !== 'is_plus' && missing in payload) {
      console.warn(`[webhook] profiles.${missing} not present, continuing without it`);
      delete payload[missing];
      continue;
    }
    return error.message;
  }
  return 'too many retries adjusting payload';
}

export async function POST(req: NextRequest) {
  const secret = process.env.STRIPE_SECRET_KEY;
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!secret || !webhookSecret) {
    return NextResponse.json({ error: 'Stripe not configured.' }, { status: 503 });
  }

  const stripe = new Stripe(secret);
  const sig = req.headers.get('stripe-signature');
  if (!sig) return NextResponse.json({ error: 'Missing signature.' }, { status: 400 });

  let event: Stripe.Event;
  try {
    const body = await req.text();
    event = stripe.webhooks.constructEvent(body, sig, webhookSecret);
  } catch (err: any) {
    return NextResponse.json({ error: 'Signature check failed: ' + err.message }, { status: 400 });
  }

  console.log('[webhook] event:', event.type, event.id);

  const admin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  );

  try {
    if (event.type === 'checkout.session.completed') {
      const session = event.data.object as Stripe.Checkout.Session;
      const userId = session.metadata?.userId || session.client_reference_id;
      const paid = session.payment_status === 'paid' || session.payment_status === 'no_payment_required';
      if (userId && paid) {
        const metaPlan = session.metadata?.planId;
        let tier: Tier | null = isTier(metaPlan) ? metaPlan : null;

        // Read the tier from the subscription when the session has none, and make sure the
        // subscription carries userId + planId so renewal / cancellation events can find the member.
        const subId = typeof session.subscription === 'string' ? session.subscription : session.subscription?.id;
        if (subId) {
          try {
            const sub = await stripe.subscriptions.retrieve(subId);
            tier = tier ?? tierFromSubscription(sub);
            const meta = (sub.metadata || {}) as Record<string, string>;
            if (meta.userId !== userId || (tier && meta.planId !== tier)) {
              await stripe.subscriptions.update(subId, {
                metadata: { ...meta, userId, ...(tier ? { planId: tier } : {}) },
              });
            }
          } catch (e) {
            console.warn('[webhook] could not read/annotate subscription', subId, e);
          }
        }

        const err = await applyMembership(admin, userId, true, tier);
        if (err) {
          console.error('[webhook] membership update failed:', userId, err);
          return NextResponse.json({ error: 'Database update failed.' }, { status: 500 }); // Stripe will retry
        }
      }
    }

    if (event.type === 'customer.subscription.updated' || event.type === 'customer.subscription.deleted') {
      const sub = event.data.object as Stripe.Subscription;
      const userId = (sub.metadata as Record<string, string> | undefined)?.userId;
      if (userId) {
        const active =
          event.type !== 'customer.subscription.deleted' &&
          (sub.status === 'active' || sub.status === 'trialing');

        let stillActiveElsewhere = false;
        if (!active) {
          // An old subscription ending must not switch off a newer one.
          try {
            const others = await stripe.subscriptions.list({
              customer: sub.customer as string,
              status: 'all',
              limit: 10,
            });
            stillActiveElsewhere = others.data.some(
              (s) => s.id !== sub.id && (s.status === 'active' || s.status === 'trialing')
            );
          } catch (e) {
            console.warn('[webhook] could not check other subscriptions:', e);
          }
        }

        if (!stillActiveElsewhere) {
          const err = await applyMembership(admin, userId, active, active ? tierFromSubscription(sub) : null);
          if (err) {
            console.error('[webhook] membership update failed:', userId, err);
            return NextResponse.json({ error: 'Database update failed.' }, { status: 500 });
          }
        }
      }
    }
  } catch (err) {
    console.error('[webhook] handler error:', err);
    return NextResponse.json({ error: 'Webhook handler failed.' }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}
