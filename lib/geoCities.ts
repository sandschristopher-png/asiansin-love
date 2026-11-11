/**
 * Auth hero ("Meet someone in ...") destination rosters, picked by the visitor's country (edge IP
 * header, no VPN needed).
 *   Western / global visitors, and Japanese / Korean / Taiwanese visitors (mostly men looking
 *     toward Southeast Asia): DESTINATION_CITIES.
 *   Southeast Asian visitors (or ?geo=asia): cities alternating with Western partner countries,
 *     so both local women and expat men see a relevant destination within a couple of fades.
 *   ?target=asia or ?geo=sea forces DESTINATION_CITIES, even from a Southeast Asian IP.
 */

/** Target cities grouped by country (Western men audience). */
const CITIES_BY_COUNTRY: readonly (readonly string[])[] = [
  ['Manila', 'Cebu City', 'Davao', 'Quezon City', 'Makati', 'Angeles City', 'Iloilo', 'Cagayan de Oro', 'Baguio'],
  ['Bangkok', 'Chiang Mai', 'Phuket', 'Pattaya', 'Hua Hin', 'Koh Samui'],
  ['Ho Chi Minh City', 'Hanoi', 'Da Nang', 'Nha Trang'],
  ['Phnom Penh', 'Siem Reap'],
  ['Jakarta', 'Bali', 'Surabaya', 'Bandung'],
  ['Kuala Lumpur', 'Penang'],
  ['Tokyo', 'Osaka'],
];

/** Western partner countries (Asian women audience). */
export const WESTERN_COUNTRIES = [
  'United States',
  'United Kingdom',
  'Australia',
  'Canada',
  'Germany',
  'New Zealand',
  'Netherlands',
  'Switzerland',
  'Sweden',
  'Norway',
  'Ireland',
  'Denmark',
  'Austria',
  'France',
] as const;

/** Round-robin across countries so consecutive names are never from the same country. */
function interleave(groups: readonly (readonly string[])[]): string[] {
  const out: string[] = [];
  const longest = Math.max(...groups.map((g) => g.length));
  for (let i = 0; i < longest; i++) {
    for (const g of groups) if (i < g.length) out.push(g[i]);
  }
  return out;
}

/** Manila, Bangkok, Ho Chi Minh City, Phnom Penh, Jakarta, Kuala Lumpur, Tokyo, Cebu City, ... */
export const DESTINATION_CITIES: readonly string[] = interleave(CITIES_BY_COUNTRY);

/** City, country, city, country, ... until both lists are used. */
export const HYBRID_ROSTER: readonly string[] = (() => {
  const out: string[] = [];
  const n = Math.max(DESTINATION_CITIES.length, WESTERN_COUNTRIES.length);
  for (let i = 0; i < n; i++) {
    if (i < DESTINATION_CITIES.length) out.push(DESTINATION_CITIES[i]);
    if (i < WESTERN_COUNTRIES.length) out.push(WESTERN_COUNTRIES[i]);
  }
  return out;
})();

/** Older names kept for existing imports. */
export const SEA_CITIES = DESTINATION_CITIES;
export const ASIAN_IP_HYBRID_ROSTER = HYBRID_ROSTER;

/** Southeast Asian visitors: local women and expat men both live here, so they get the hybrid roster. */
const SEA_COUNTRY_CODES = new Set(['PH', 'TH', 'VN', 'KH', 'ID', 'MY', 'SG', 'LA', 'MM', 'BN', 'TL']);

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
    return DESTINATION_CITIES;
  }

  if (SEA_COUNTRY_CODES.has(code) || searchParams?.geo === 'asia') {
    return HYBRID_ROSTER;
  }

  return DESTINATION_CITIES;
}

/** First value of a page searchParam (Next passes repeated params as arrays). */
export const firstParam = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v);
