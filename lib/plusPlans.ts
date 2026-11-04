/**
 * Plus plans: the single source for prices shown on /plus, the upgrade sheets and the Terms.
 * Stripe holds the real charge: STRIPE_PLUS_PRICE_1M / _3M / _6M must match these amounts.
 */
export type PlusPlanId = '1m' | '3m' | '6m';

export interface PlusPlan {
  id: PlusPlanId;
  label: string;
  months: number;
  /** Charged per billing period, e.g. "$29.99". */
  total: string;
  /** Effective monthly price, e.g. "$9.99". */
  perMonth: string;
  /** "/ mo" for monthly billing, "total" for multi-month. */
  totalSuffix: string;
  billingNote: string;
  savings?: string;
  badge?: 'Most Popular' | 'Best Value';
}

export const PLUS_PLANS: readonly PlusPlan[] = [
  { id: '1m', label: '1 Month', months: 1, total: '$14.99', perMonth: '$14.99', totalSuffix: '/ mo', billingNote: 'Billed monthly' },
  {
    id: '3m',
    label: '3 Months',
    months: 3,
    total: '$29.99',
    perMonth: '$9.99',
    totalSuffix: 'total',
    billingNote: '$29.99 every 3 months',
    savings: 'Save 33%',
    badge: 'Most Popular',
  },
  {
    id: '6m',
    label: '6 Months',
    months: 6,
    total: '$47.99',
    perMonth: '$7.99',
    totalSuffix: 'total',
    billingNote: '$47.99 every 6 months',
    savings: 'Save 47%',
    badge: 'Best Value',
  },
];

export const DEFAULT_PLUS_PLAN: PlusPlanId = '3m';

export const isPlusPlanId = (v: unknown): v is PlusPlanId => v === '1m' || v === '3m' || v === '6m';

export const plusPlan = (id: PlusPlanId): PlusPlan => PLUS_PLANS.find((p) => p.id === id) ?? PLUS_PLANS[0];

/** Free vs Plus daily Spark allowance (enforced in /api/spark). */
export const FREE_DAILY_SPARKS = 20;
/** Fair-use ceiling for Plus (anti-bot only; no real member sends this many in a day). */
export const PLUS_DAILY_SPARK_FAIR_USE = 500;
