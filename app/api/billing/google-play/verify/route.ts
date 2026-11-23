// app/api/billing/google-play/verify/route.ts
// The Android app sends a Google Play purchase token here after a purchase and when it restores purchases. The server asks
// Google whether the token is real, belongs to this member and is paid, then activates Plus (or adds a Boost credit),
// acknowledges (subscription) or consumes (Boost) the purchase with Google, and answers. The app never decides entitlement
// itself. Rules: lib/billing/googlePlay.ts. Schema: supabase/migrations/20261205_google_play_billing.sql.
//
// Needs GOOGLE_PLAY_SERVICE_ACCOUNT_JSON (see lib/billing/googlePlayApi.ts); without it the route answers 503 and grants nothing.
import { NextRequest, NextResponse } from 'next/server';
import { createClient as createSessionClient } from '@/lib/supabase/server';
import { createClient } from '@supabase/supabase-js';
import { accountIdFor, decideProduct, decideSubscription, isPlausibleToken, playProduct } from '@/lib/billing/googlePlay';
import {
  acknowledgeSubscription,
  consumeProduct,
  getProductPurchase,
  getSubscription,
  readServiceAccount,
} from '@/lib/billing/googlePlayApi';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function adminClient() {
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, { auth: { persistSession: false } });
}

const fail = (status: number, reason: string, extra: Record<string, unknown> = {}) =>
  NextResponse.json({ ok: false, reason, ...extra }, { status });

export async function POST(req: NextRequest) {
  const supabase = await createSessionClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return fail(401, 'signed_out');

  const body = (await req.json().catch(() => ({}))) as { productId?: unknown; purchaseToken?: unknown };
  const product = playProduct(body.productId);
  if (!product) return fail(400, 'unknown_product');
  if (!isPlausibleToken(body.purchaseToken)) return fail(400, 'bad_token');
  const token = body.purchaseToken;

  const account = readServiceAccount();
  if (!account || !process.env.SUPABASE_SERVICE_ROLE_KEY || !process.env.NEXT_PUBLIC_SUPABASE_URL) {
    return fail(503, 'not_configured');
  }
  const admin = adminClient();
  const accountId = await accountIdFor(user.id);
  const now = new Date();

  // A token belongs to the member who bought it first.
  const { data: owner, error: ownerErr } = await admin.from('play_purchases').select('user_id').eq('purchase_token', token).maybeSingle();
  if (ownerErr) {
    console.error('[google-play] owner read failed:', ownerErr.message);
    return fail(500, 'database');
  }
  if (owner && owner.user_id !== user.id) return fail(409, 'wrong_account');

  try {
    if (product.kind === 'subscription') {
      const res = await getSubscription(account, token);
      if (!res.ok) return fail(res.status === 400 || res.status === 404 || res.status === 410 ? 422 : 502, res.status === 410 ? 'expired' : 'google_error');
      const decision = decideSubscription(res.body, { productId: product.id, accountId }, now);
      if (!decision.ok) {
        if (decision.pending) return NextResponse.json({ ok: false, pending: true }, { status: 202 });
        return fail(decision.reason === 'wrong_account' ? 409 : 422, decision.reason);
      }

      const { data: profile, error: profileErr } = await admin.from('profiles').select('current_period_end, subscription_status').eq('id', user.id).maybeSingle();
      if (profileErr || !profile) {
        console.error('[google-play] profile read failed:', profileErr?.message);
        return fail(500, 'database');
      }
      // Several tokens can be live after a plan change: keep the furthest paid-until time.
      const current = profile.current_period_end ? new Date(profile.current_period_end) : null;
      const keepsCurrent = current && Number.isFinite(current.getTime()) && current > decision.expiresAt && ['active', 'canceled'].includes(String(profile.subscription_status || '').toLowerCase());
      const periodEnd = keepsCurrent ? (current as Date) : decision.expiresAt;

      const { error: rowErr } = await admin.from('play_purchases').upsert(
        {
          purchase_token: token,
          user_id: user.id,
          product_id: product.id,
          kind: 'subscription',
          order_id: decision.orderId,
          state: decision.state,
          expires_at: decision.expiresAt.toISOString(),
          updated_at: now.toISOString(),
        },
        { onConflict: 'purchase_token' }
      );
      if (rowErr) {
        console.error('[google-play] purchase write failed:', rowErr.message);
        return fail(500, 'database');
      }
      const { error: updErr } = await admin
        .from('profiles')
        .update({
          is_plus: true,
          subscription_status: decision.state === 'canceled' ? 'canceled' : 'active',
          current_period_end: periodEnd.toISOString(),
          updated_at: now.toISOString(),
        })
        .eq('id', user.id);
      if (updErr) {
        console.error('[google-play] profile update failed:', updErr.message);
        return fail(500, 'database');
      }

      // Google refunds a purchase that is not acknowledged within three days.
      if (decision.needsAck) {
        const ack = await acknowledgeSubscription(account, product.id, token);
        if (!ack.ok) {
          console.error('[google-play] acknowledge failed:', ack.status);
          return fail(502, 'acknowledge_failed', { plus: true });
        }
      }
      return NextResponse.json({ ok: true, kind: 'subscription', plus: true, expiresAt: periodEnd.toISOString() });
    }

    // Boost: a consumable. One credit per token, then the purchase is consumed so it can be bought again.
    const res = await getProductPurchase(account, product.id, token);
    if (!res.ok) return fail(res.status === 400 || res.status === 404 || res.status === 410 ? 422 : 502, 'google_error');
    const decision = decideProduct(res.body, { accountId });
    if (!decision.ok) {
      if (decision.pending) return NextResponse.json({ ok: false, pending: true }, { status: 202 });
      return fail(decision.reason === 'wrong_account' ? 409 : 422, decision.reason);
    }
    const { error: rowErr } = await admin.from('play_purchases').upsert(
      { purchase_token: token, user_id: user.id, product_id: product.id, kind: 'consumable', order_id: decision.orderId, state: 'purchased', updated_at: now.toISOString() },
      { onConflict: 'purchase_token', ignoreDuplicates: true }
    );
    if (rowErr) {
      console.error('[google-play] purchase write failed:', rowErr.message);
      return fail(500, 'database');
    }
    const { data: credits, error: grantErr } = await admin.rpc('grant_boost_credit', { p_user: user.id, p_token: token });
    if (grantErr) {
      console.error('[google-play] boost grant failed:', grantErr.message);
      return fail(500, 'database');
    }
    if (!decision.alreadyConsumed) {
      const consumed = await consumeProduct(account, product.id, token);
      if (!consumed.ok) {
        console.error('[google-play] consume failed:', consumed.status);
        return fail(502, 'consume_failed', { boostCredits: credits });
      }
    }
    return NextResponse.json({ ok: true, kind: 'consumable', boostCredits: credits });
  } catch (err) {
    console.error('[google-play] verification failed:', err instanceof Error ? err.message : err);
    return fail(502, 'google_error');
  }
}
