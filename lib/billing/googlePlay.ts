/**
 * Google Play Billing rules for Meet in Asia (asia.meetin.app), shared by the Android app and the server.
 * Pure: no network, no Capacitor, no database, so every rule here is unit-tested (npm run playbilling:test).
 *
 *   products   the three Plus subscriptions and the Boost consumable, by their Google Play Console product ids
 *   account    a hash of the member's id, set as the purchase's obfuscated account id when buying and checked again by the
 *              server, so a purchase token can only activate the account that bought it
 *   decisions  what a Google Play Developer API answer means: grant, wait, or refuse
 *
 * Create these products in Play Console > Monetize before the app can sell anything: three subscriptions (meetin_plus_1m,
 * meetin_plus_3m, meetin_plus_6m, each with one base plan of 1, 3 or 6 months that auto-renews, at the prices in
 * lib/plusPlans.ts) and one managed (in-app) product, meetin_boost_1.
 */
import type { PlusPlanId } from '@/lib/plusPlans';

export const PLAY_PACKAGE_NAME = 'asia.meetin.app';

export type PlayProductKind = 'subscription' | 'consumable';

export interface PlayProduct {
  /** The product id in Google Play Console. */
  id: string;
  kind: PlayProductKind;
  /** The Plus plan a subscription product unlocks. */
  plan?: PlusPlanId;
}

export const PLUS_PLAY_IDS: Record<PlusPlanId, string> = {
  '1m': 'meetin_plus_1m',
  '3m': 'meetin_plus_3m',
  '6m': 'meetin_plus_6m',
};

export const BOOST_PLAY_ID = 'meetin_boost_1';

export const PLAY_PRODUCTS: readonly PlayProduct[] = [
  { id: PLUS_PLAY_IDS['1m'], kind: 'subscription', plan: '1m' },
  { id: PLUS_PLAY_IDS['3m'], kind: 'subscription', plan: '3m' },
  { id: PLUS_PLAY_IDS['6m'], kind: 'subscription', plan: '6m' },
  { id: BOOST_PLAY_ID, kind: 'consumable' },
];

export function playProduct(id: unknown): PlayProduct | null {
  return typeof id === 'string' ? PLAY_PRODUCTS.find((p) => p.id === id) ?? null : null;
}

/** A Play purchase token is a long opaque string; this only rejects obviously wrong input before any network call. */
export function isPlausibleToken(token: unknown): token is string {
  return typeof token === 'string' && token.length >= 20 && token.length <= 2048 && /^[\w.\-]+$/.test(token);
}

/**
 * The obfuscated account id sent to Google Play with every purchase: SHA-256 of a fixed prefix and the member's id, as hex
 * (64 characters, the maximum Play allows). It carries no personal data. Same result in the browser and in Node.
 */
export async function accountIdFor(userId: string): Promise<string> {
  const bytes = new TextEncoder().encode(`meetin-play:${userId}`);
  const digest = await globalThis.crypto.subtle.digest('SHA-256', bytes);
  return Array.from(new Uint8Array(digest), (b) => b.toString(16).padStart(2, '0')).join('');
}

// ---------------------------------------------------------------------------------------------------------------------
// What Google says about a subscription (purchases.subscriptionsv2.get), reduced to the fields used here.
// ---------------------------------------------------------------------------------------------------------------------

export interface SubscriptionPurchaseV2 {
  subscriptionState?: string;
  acknowledgementState?: string;
  latestOrderId?: string;
  lineItems?: { productId?: string; expiryTime?: string }[];
  externalAccountIdentifiers?: { obfuscatedExternalAccountId?: string };
  testPurchase?: Record<string, never>;
}

export type Refusal = 'wrong_product' | 'wrong_account' | 'expired' | 'on_hold' | 'paused' | 'unknown_state';

export type SubscriptionDecision =
  | { ok: true; productId: string; expiresAt: Date; state: 'active' | 'grace' | 'canceled'; needsAck: boolean; orderId: string | null }
  | { ok: false; pending: true }
  | { ok: false; pending?: false; reason: Refusal };

const DAY_MS = 86_400_000;

/**
 * Should this Google subscription unlock Plus for this member right now?
 *   active / in grace period / canceled but still inside the paid period: yes, until the expiry
 *   pending (the payment has not cleared): wait, grant nothing yet
 *   expired, on hold, paused: no
 * It also refuses a token bought for a different product or by a different member.
 */
export function decideSubscription(
  res: SubscriptionPurchaseV2 | null | undefined,
  expected: { productId: string; accountId: string },
  now: Date
): SubscriptionDecision {
  if (!res) return { ok: false, reason: 'unknown_state' };
  const line = res.lineItems?.find((l) => l.productId === expected.productId);
  if (!line) return { ok: false, reason: 'wrong_product' };
  if (res.externalAccountIdentifiers?.obfuscatedExternalAccountId !== expected.accountId) return { ok: false, reason: 'wrong_account' };

  const state = res.subscriptionState ?? '';
  if (state === 'SUBSCRIPTION_STATE_PENDING' || state === 'SUBSCRIPTION_STATE_PENDING_PURCHASE_CANCELED') return { ok: false, pending: true };
  if (state === 'SUBSCRIPTION_STATE_EXPIRED') return { ok: false, reason: 'expired' };
  if (state === 'SUBSCRIPTION_STATE_ON_HOLD') return { ok: false, reason: 'on_hold' };
  if (state === 'SUBSCRIPTION_STATE_PAUSED') return { ok: false, reason: 'paused' };

  const kind =
    state === 'SUBSCRIPTION_STATE_ACTIVE' ? 'active' : state === 'SUBSCRIPTION_STATE_IN_GRACE_PERIOD' ? 'grace' : state === 'SUBSCRIPTION_STATE_CANCELED' ? 'canceled' : null;
  if (!kind) return { ok: false, reason: 'unknown_state' };

  let expiresAt = line.expiryTime ? new Date(line.expiryTime) : null;
  if (!expiresAt || !Number.isFinite(expiresAt.getTime())) return { ok: false, reason: 'unknown_state' };
  // In a grace period Google is still retrying the card; the member keeps Plus for a day at a time and the next check renews it.
  if (kind === 'grace' && expiresAt.getTime() < now.getTime() + DAY_MS) expiresAt = new Date(now.getTime() + DAY_MS);
  if (expiresAt.getTime() <= now.getTime()) return { ok: false, reason: 'expired' };

  return {
    ok: true,
    productId: expected.productId,
    expiresAt,
    state: kind,
    needsAck: res.acknowledgementState !== 'ACKNOWLEDGEMENT_STATE_ACKNOWLEDGED',
    orderId: res.latestOrderId ?? null,
  };
}

// ---------------------------------------------------------------------------------------------------------------------
// What Google says about a one-time product (purchases.products.get): the Boost consumable.
// ---------------------------------------------------------------------------------------------------------------------

export interface ProductPurchase {
  /** 0 purchased, 1 canceled, 2 pending. */
  purchaseState?: number;
  /** 0 not yet consumed, 1 consumed. */
  consumptionState?: number;
  orderId?: string;
  obfuscatedExternalAccountId?: string;
}

export type ProductDecision =
  | { ok: true; orderId: string | null; alreadyConsumed: boolean }
  | { ok: false; pending: true }
  | { ok: false; pending?: false; reason: 'wrong_account' | 'canceled' | 'unknown_state' };

export function decideProduct(res: ProductPurchase | null | undefined, expected: { accountId: string }): ProductDecision {
  if (!res || typeof res.purchaseState !== 'number') return { ok: false, reason: 'unknown_state' };
  if (res.obfuscatedExternalAccountId !== expected.accountId) return { ok: false, reason: 'wrong_account' };
  if (res.purchaseState === 2) return { ok: false, pending: true };
  if (res.purchaseState !== 0) return { ok: false, reason: 'canceled' };
  return { ok: true, orderId: res.orderId ?? null, alreadyConsumed: res.consumptionState === 1 };
}
