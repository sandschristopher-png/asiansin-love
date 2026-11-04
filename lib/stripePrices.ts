import type { PlusPlanId } from '@/lib/plusPlans';

/**
 * Stripe Price ids for Plus (one flat recurring price per plan; quantity is always 1).
 * Env vars win; the fallbacks are the verified test-mode prices:
 *   1m  $14.99 every 1 month   3m  $29.99 every 3 months   6m  $47.99 every 6 months
 * Production must set STRIPE_PLUS_PRICE_1M / _3M / _6M to the live-mode ids.
 * (STRIPE_PRICE_MONTHLY is deliberately not used: it pointed at a price from another account.)
 */
export const PLUS_PRICE_IDS: Record<PlusPlanId, string> = {
  '1m': process.env.STRIPE_PLUS_PRICE_1M || 'price_1UOGyhCooGaC2EFo5uTx5Ry0',
  '3m': process.env.STRIPE_PLUS_PRICE_3M || 'price_1UXkIECooGaC2EFoVWjjCLnh',
  '6m': process.env.STRIPE_PLUS_PRICE_6M || 'price_1UXkJ8CooGaC2EFovcyeEXUk',
};

/** Reverse lookup for webhooks: price id -> plan (legacy env ids still recognized). */
export function planFromPriceId(priceId: string | null | undefined): PlusPlanId | '12m' | null {
  if (!priceId) return null;
  for (const [plan, id] of Object.entries(PLUS_PRICE_IDS) as [PlusPlanId, string][]) {
    if (id === priceId) return plan;
  }
  if (priceId === process.env.STRIPE_PRICE_MONTHLY || priceId === process.env.STRIPE_PLUS_PRICE_ID) return '1m';
  if (priceId === process.env.STRIPE_PLUS_PRICE_12M || priceId === process.env.STRIPE_PRICE_ANNUAL) return '12m';
  return null;
}
