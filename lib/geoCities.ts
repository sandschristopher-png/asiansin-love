/**
 * Auth hero ("Meet someone in / from ...") rosters, picked by the visitor's country (edge IP
 * header, no VPN needed).
 *   Western / global visitors: "Meet someone in" + Asian cities. Never Western countries.
 *   Asian visitors: "Meet someone from" + Western partner countries.
 * Dev / campaign overrides: ?geo=US, ?geo=PH (any 2-letter country code), ?geo=asia, ?geo=sea and
 * ?target=asia (the last two force the city roster).
 */

export type HeroAudience = 'western' | 'asian';

export const WESTERN_AUDIENCE_CITIES = [
  'Manila',
  'Bangkok',
  'Cebu City',
  'Ho Chi Minh City',
  'Tokyo',
  'Phuket',
  'Da Nang',
  'Phnom Penh',
  'Davao',
  'Chiang Mai',
  'Jakarta',
  'Osaka',
  'Siem Reap',
  'Bali',
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

const ASIAN_COUNTRY_CODES = new Set(['PH', 'TH', 'VN', 'ID', 'MY', 'KH', 'JP', 'SG', 'TW', 'KR']);

/** Country from Vercel or Cloudflare's edge header; null when neither is present (local dev). */
export function visitorCountry(h: Headers): string | null {
  return h.get('x-vercel-ip-country') || h.get('cf-ipcountry');
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
