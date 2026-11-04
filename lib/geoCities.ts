/**
 * Auth hero city rosters, picked by the visitor's country (edge IP header, no VPN needed).
 * Western visitors see Southeast Asian cities (they're seeking partners there); visitors from Asia
 * see Western cities. `?geo=asia` forces the Asian roster for local testing.
 */

export const SEA_CITIES = [
  'Bangkok', 'Manila', 'Singapore', 'Saigon', 'Cebu',
  'Kuala Lumpur', 'Phnom Penh', 'Hanoi', 'Chiang Mai',
  'Da Nang', 'Jakarta', 'Phuket',
];

export const WESTERN_CITIES = [
  'Los Angeles', 'London', 'Sydney', 'New York', 'Melbourne',
  'Toronto', 'Vancouver', 'San Francisco', 'Brisbane', 'Chicago',
];

export const ASIAN_COUNTRY_CODES = new Set(['PH', 'TH', 'VN', 'KH', 'ID', 'MY', 'SG', 'JP', 'KR', 'TW', 'LA', 'MM']);

/** Country from Vercel or Cloudflare's edge header; 'US' when neither is present (local dev). */
export function visitorCountry(h: Headers): string {
  return h.get('x-vercel-ip-country') || h.get('cf-ipcountry') || 'US';
}

export function citiesForVisitor(country: string, geoParam: string | string[] | undefined): string[] {
  const isAsianVisitor = ASIAN_COUNTRY_CODES.has(country.toUpperCase()) || geoParam === 'asia';
  return isAsianVisitor ? WESTERN_CITIES : SEA_CITIES;
}
