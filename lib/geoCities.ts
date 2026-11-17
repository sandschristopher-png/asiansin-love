/**
 * Auth hero ("Meet someone in / from ...") rosters, picked by the visitor's country (edge IP
 * header, no VPN needed).
 *   Western / global visitors: "Meet someone in" + Southeast Asian cities. Never Western countries.
 *   Asian visitors: "Meet someone from" + Western partner countries.
 * Dev / campaign overrides: ?geo=US, ?geo=PH (any 2-letter country code), ?geo=asia, ?geo=sea and
 * ?target=asia (the last two force the city roster).
 */

import { countryFromHeaders } from '@/lib/geoLanding';

export type HeroAudience = 'western' | 'asian';

/**
 * Southeast Asia only: every destination the hero names is in one of the launch countries
 * (Philippines, Thailand, Vietnam, Indonesia, Cambodia, Malaysia, Singapore). No cities elsewhere
 * in Asia belong in this list.
 */
export const WESTERN_AUDIENCE_CITIES = [
  'Manila',
  'Cebu',
  'Bangkok',
  'Chiang Mai',
  'Ho Chi Minh City',
  'Hanoi',
  'Jakarta',
  'Bali',
  'Phnom Penh',
  'Kuala Lumpur',
  'Singapore',
] as const;

export const ASIAN_AUDIENCE_COUNTRIES = [
  'United States',
  'Australia',
  'United Kingdom',
  'Canada',
  'Norway',
  'Germany',
  'New Zealand',
  'Switzerland',
  'Ireland',
  'Sweden',
] as const;

export const HERO_PREFIX: Record<HeroAudience, string> = {
  western: 'Meet someone in',
  asian: 'Meet someone from',
};

/** Older names kept for existing imports. */
export const SEA_CITIES = WESTERN_AUDIENCE_CITIES;

/**
 * Visitors who read "Meet someone from" + Western countries: every Southeast Asian country the app serves
 * (Philippines, Thailand, Vietnam, Indonesia, Malaysia, Cambodia, Singapore, Laos, Brunei, plus Myanmar and
 * Timor-Leste) and the wider East Asian markets it already treated this way.
 */
export const ASIAN_COUNTRY_CODES: ReadonlySet<string> = new Set([
  'PH', 'TH', 'VN', 'ID', 'MY', 'KH', 'SG', 'LA', 'BN', 'MM', 'TL',
  'JP', 'KR', 'TW', 'HK', 'MO',
]);

/** Country from Vercel or Cloudflare's edge header; null when neither is present (local dev). */
export function visitorCountry(h: Headers): string | null {
  // Same header order as the landing page (lib/geoLanding.ts); unknown codes ("XX", Tor's "T1") are ignored.
  return countryFromHeaders((name) => h.get(name));
}

export function resolveHeroAudience(
  countryCode?: string | null,
  searchParams?: { geo?: string; target?: string }
): HeroAudience {
  const geo = (searchParams?.geo || '').trim();
  if (searchParams?.target === 'asia' || geo.toLowerCase() === 'sea') return 'western';
  if (geo.toLowerCase() === 'asia') return 'asian';
  const code = (/^[a-z]{2}$/i.test(geo) ? geo : countryCode || '').toUpperCase();
  return ASIAN_COUNTRY_CODES.has(code) ? 'asian' : 'western';
}

export function heroRoster(audience: HeroAudience): readonly string[] {
  return audience === 'asian' ? ASIAN_AUDIENCE_COUNTRIES : WESTERN_AUDIENCE_CITIES;
}

/** First value of a page searchParam (Next passes repeated params as arrays). */
export const firstParam = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v);
