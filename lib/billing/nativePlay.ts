'use client';

/**
 * The Android app's side of Google Play Billing (@capgo/native-purchases). Everything here runs only inside the Capacitor
 * app and every call is guarded: in a browser, or on a device without the Play Store, it reports "unavailable" instead of
 * throwing. The plugin is imported only here and only in the app. The app never decides entitlement: each purchase token
 * is sent to /api/billing/google-play/verify, which checks it with Google and activates Plus on the member's profile.
 */
import { isNativeApp } from '@/lib/nativeApp';
import { supabase } from '@/lib/supabase/client';
import { BOOST_PLAY_ID, PLUS_PLAY_IDS, accountIdFor, playProduct } from '@/lib/billing/googlePlay';
import { PLUS_PLANS, type PlusPlanId } from '@/lib/plusPlans';

export interface PlayOffering {
  productId: string;
  plan: PlusPlanId;
  /** Price per billing period in the member's currency, as Google formats it (e.g. "$29.99"). */
  total: string;
  /** Effective monthly price, formatted in the same currency. */
  perMonth: string;
  /** Android subscriptions: the offer to buy (read from the same query as the price). */
  offerToken?: string;
  planIdentifier?: string;
}

export type OfferingsResult =
  | { status: 'ready'; offerings: Partial<Record<PlusPlanId, PlayOffering>> }
  | { status: 'unavailable' };

async function plugin() {
  return import('@capgo/native-purchases');
}

function formatMoney(amount: number, currency: string, fallback: string): string {
  try {
    return new Intl.NumberFormat(undefined, { style: 'currency', currency }).format(amount);
  } catch {
    return fallback;
  }
}

/**
 * The Plus prices straight from Google Play (so the member sees their own currency and any offer). Unavailable in a browser,
 * on an emulator without the Play Store, or while the products are not live in Play Console.
 */
export async function loadPlusOfferings(): Promise<OfferingsResult> {
  if (!isNativeApp()) return { status: 'unavailable' };
  try {
    const { NativePurchases, PURCHASE_TYPE } = await plugin();
    const supported = await NativePurchases.isBillingSupported();
    if (!supported.isBillingSupported) return { status: 'unavailable' };
    const { products } = await NativePurchases.getProducts({ productIdentifiers: Object.values(PLUS_PLAY_IDS), productType: PURCHASE_TYPE.SUBS });
    const offerings: Partial<Record<PlusPlanId, PlayOffering>> = {};
    for (const plan of PLUS_PLANS) {
      const productId = PLUS_PLAY_IDS[plan.id];
      // On Android a subscription's `planIdentifier` is the product id and `identifier` is its base plan.
      const hit = products.find((p) => (p.planIdentifier ?? p.identifier) === productId);
      if (!hit) continue;
      offerings[plan.id] = {
        productId,
        plan: plan.id,
        total: hit.priceString,
        perMonth: formatMoney(hit.price / plan.months, hit.currencyCode, plan.perMonth),
        offerToken: hit.offerToken,
        planIdentifier: hit.identifier,
      };
    }
    return Object.keys(offerings).length > 0 ? { status: 'ready', offerings } : { status: 'unavailable' };
  } catch (err) {
    console.warn('[billing] Google Play prices unavailable:', err);
    return { status: 'unavailable' };
  }
}

export type VerifyOutcome =
  | { status: 'active'; expiresAt: string }
  | { status: 'boost'; credits: number }
  | { status: 'pending' }
  | { status: 'other_account' }
  | { status: 'not_active' }
  | { status: 'failed' };

/** Sends one purchase token to the server and reads the verdict. */
export async function verifyPurchase(productId: string, purchaseToken: string): Promise<VerifyOutcome> {
  try {
    const res = await fetch('/api/billing/google-play/verify', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ productId, purchaseToken }),
    });
    const json = (await res.json().catch(() => ({}))) as { ok?: boolean; pending?: boolean; reason?: string; kind?: string; expiresAt?: string; boostCredits?: number };
    if (res.ok && json.ok) return json.kind === 'consumable' ? { status: 'boost', credits: json.boostCredits ?? 0 } : { status: 'active', expiresAt: json.expiresAt ?? '' };
    if (res.status === 202 || json.pending) return { status: 'pending' };
    if (json.reason === 'wrong_account') return { status: 'other_account' };
    if (res.status === 422) return { status: 'not_active' };
    return { status: 'failed' };
  } catch {
    return { status: 'failed' };
  }
}

export type PurchaseOutcome = VerifyOutcome | { status: 'cancelled' } | { status: 'unavailable' };

async function memberAccountId(): Promise<string | null> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user ? accountIdFor(user.id) : null;
}

const isCancel = (err: unknown) => /cancel/i.test(err instanceof Error ? err.message : String(err ?? ''));

/** Opens Google Play's purchase sheet for a Plus plan, then has the server verify and activate it. */
export async function buyPlus(offering: PlayOffering): Promise<PurchaseOutcome> {
  if (!isNativeApp()) return { status: 'unavailable' };
  try {
    const accountId = await memberAccountId();
    if (!accountId) return { status: 'failed' };
    const { NativePurchases, PURCHASE_TYPE } = await plugin();
    const tx = await NativePurchases.purchaseProduct({
      productIdentifier: offering.productId,
      planIdentifier: offering.planIdentifier,
      offerToken: offering.offerToken,
      productType: PURCHASE_TYPE.SUBS,
      appAccountToken: accountId,
      // The server acknowledges the purchase with Google once it has verified it.
      autoAcknowledgePurchases: false,
    });
    const token = tx.purchaseToken ?? tx.transactionId;
    if (!token) return { status: 'failed' };
    return await verifyPurchase(offering.productId, token);
  } catch (err) {
    if (isCancel(err)) return { status: 'cancelled' };
    console.warn('[billing] purchase failed:', err);
    return { status: 'failed' };
  }
}

/**
 * Buys one Boost (a consumable). The server adds the credit and consumes the purchase so it can be bought again. There is
 * no Boost screen in the app yet; this is the call it will make.
 */
export async function buyBoost(): Promise<PurchaseOutcome> {
  if (!isNativeApp()) return { status: 'unavailable' };
  try {
    const accountId = await memberAccountId();
    if (!accountId) return { status: 'failed' };
    const { NativePurchases, PURCHASE_TYPE } = await plugin();
    const tx = await NativePurchases.purchaseProduct({
      productIdentifier: BOOST_PLAY_ID,
      productType: PURCHASE_TYPE.INAPP,
      appAccountToken: accountId,
      autoAcknowledgePurchases: false,
    });
    const token = tx.purchaseToken ?? tx.transactionId;
    if (!token) return { status: 'failed' };
    return await verifyPurchase(BOOST_PLAY_ID, token);
  } catch (err) {
    if (isCancel(err)) return { status: 'cancelled' };
    console.warn('[billing] boost purchase failed:', err);
    return { status: 'failed' };
  }
}

export type RestoreOutcome =
  | { status: 'restored'; plus: boolean }
  | { status: 'nothing' }
  | { status: 'other_account' }
  | { status: 'pending' }
  | { status: 'failed' }
  | { status: 'unavailable' };

/**
 * Restore Purchases: asks Google Play for the purchases on this Google account, sends each one the app sells to the server,
 * and reports whether Plus is active afterwards. Also used silently each time the app opens to renew a subscription that
 * keeps renewing. Purchases bought by another Meet in Asia account are refused by the server and never activate this one.
 */
export async function restorePurchases(): Promise<RestoreOutcome> {
  if (!isNativeApp()) return { status: 'unavailable' };
  try {
    const { NativePurchases, PURCHASE_TYPE } = await plugin();
    const supported = await NativePurchases.isBillingSupported();
    if (!supported.isBillingSupported) return { status: 'unavailable' };
    await NativePurchases.restorePurchases().catch(() => {});
    const { purchases } = await NativePurchases.getPurchases({ productType: PURCHASE_TYPE.SUBS });
    const mine = purchases.filter((p) => playProduct(p.productIdentifier)?.kind === 'subscription' && (p.purchaseToken ?? p.transactionId));
    if (mine.length === 0) return { status: 'nothing' };

    let plus = false;
    let other = false;
    let pending = false;
    let failed = false;
    for (const p of mine) {
      const outcome = await verifyPurchase(p.productIdentifier, (p.purchaseToken ?? p.transactionId) as string);
      if (outcome.status === 'active') plus = true;
      else if (outcome.status === 'other_account') other = true;
      else if (outcome.status === 'pending') pending = true;
      else if (outcome.status === 'failed') failed = true;
    }
    if (plus) return { status: 'restored', plus: true };
    if (other) return { status: 'other_account' };
    if (pending) return { status: 'pending' };
    if (failed) return { status: 'failed' };
    return { status: 'nothing' };
  } catch (err) {
    console.warn('[billing] restore failed:', err);
    return { status: 'failed' };
  }
}
