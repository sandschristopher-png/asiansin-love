/**
 * Auth hero destination rosters, picked by the visitor's country (edge IP header, no VPN needed).
 *   Western / global visitors: Southeast Asian cities only.
 *   Asian visitors (or ?geo=asia): regional hubs alternating with Western partner countries, so
 *     both local women and expat men see a relevant destination within a couple of wipes.
 *   ?target=asia or ?geo=sea forces the Southeast Asian roster, even from an Asian IP.
 */

export const SEA_CITIES = [
  'Bangkok',
  'Manila',
  'Singapore',
  'Saigon',
  'Cebu',
  'Kuala Lumpur',
  'Phnom Penh',
  'Hanoi',
  'Chiang Mai',
  'Da Nang',
  'Jakarta',
  'Phuket',
] as const;

export const ASIAN_IP_HYBRID_ROSTER = [
  'Manila',
  'United States',
  'Bangkok',
  'Australia',
  'Cebu',
  'United Kingdom',
  'Saigon',
  'Canada',
  'Singapore',
  'Germany',
  'Phnom Penh',
  'France',
] as const;

const ASIAN_COUNTRY_CODES = new Set(['PH', 'TH', 'VN', 'KH', 'ID', 'MY', 'SG', 'JP', 'KR', 'TW', 'LA', 'MM']);

/** Country from Vercel or Cloudflare's edge header; null when neither is present (local dev). */
export function visitorCountry(h: Headers): string | null {
  return h.get('x-vercel-ip-country') || h.get('cf-ipcountry');
}

export function resolveGeoRoster(
  countryCode?: string | null,
  searchParams?: { geo?: string; target?: string }
): readonly string[] {
  const code = (countryCode || '').toUpperCase();

  if (searchParams?.target === 'asia' || searchParams?.geo === 'sea') {
    return SEA_CITIES;
  }

  if (ASIAN_COUNTRY_CODES.has(code) || searchParams?.geo === 'asia') {
    return ASIAN_IP_HYBRID_ROSTER;
  }

  return SEA_CITIES;
}

/** First value of a page searchParam (Next passes repeated params as arrays). */
export const firstParam = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v);
