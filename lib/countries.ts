/** ISO-3166 alpha-2 code -> display name for every country the app offers or detects. */
export const COUNTRY_NAMES: Record<string, string> = {
  PH: 'Philippines',
  US: 'United States',
  TH: 'Thailand',
  VN: 'Vietnam',
  ID: 'Indonesia',
  MY: 'Malaysia',
  SG: 'Singapore',
  JP: 'Japan',
  KR: 'South Korea',
  TW: 'Taiwan',
  HK: 'Hong Kong',
  MO: 'Macau',
  KH: 'Cambodia',
  MM: 'Myanmar',
  LA: 'Laos',
  BN: 'Brunei',
  AE: 'United Arab Emirates',
  SA: 'Saudi Arabia',
  QA: 'Qatar',
  KW: 'Kuwait',
  BH: 'Bahrain',
  OM: 'Oman',
  CA: 'Canada',
  AU: 'Australia',
  GB: 'United Kingdom',
  NZ: 'New Zealand',
  TL: 'Timor-Leste',
  DE: 'Germany',
  NL: 'Netherlands',
  SE: 'Sweden',
  NO: 'Norway',
  FR: 'France',
};

const ALIASES: Record<string, string> = {
  usa: 'United States',
  'u.s.': 'United States',
  'u.s.a.': 'United States',
  'united states of america': 'United States',
  america: 'United States',
  uk: 'United Kingdom',
  'great britain': 'United Kingdom',
  england: 'United Kingdom',
  uae: 'United Arab Emirates',
  phils: 'Philippines',
  phl: 'Philippines',
  pilipinas: 'Philippines',
  'viet nam': 'Vietnam',
  korea: 'South Korea',
  'republic of korea': 'South Korea',
};

/**
 * Major cities whose name belongs to exactly one country. When a stored country disagrees
 * (e.g. "Manila" + "US" from a bad default), the city wins for display and on save.
 */
const CITY_COUNTRY: Record<string, string> = {
  manila: 'Philippines',
  'metro manila': 'Philippines',
  'quezon city': 'Philippines',
  makati: 'Philippines',
  'makati city': 'Philippines',
  taguig: 'Philippines',
  pasig: 'Philippines',
  cebu: 'Philippines',
  'cebu city': 'Philippines',
  davao: 'Philippines',
  'davao city': 'Philippines',
  'angeles city': 'Philippines',
  bislig: 'Philippines',
  bangkok: 'Thailand',
  phuket: 'Thailand',
  pattaya: 'Thailand',
  'chiang mai': 'Thailand',
  hanoi: 'Vietnam',
  'ho chi minh city': 'Vietnam',
  saigon: 'Vietnam',
  'da nang': 'Vietnam',
  jakarta: 'Indonesia',
  denpasar: 'Indonesia',
  bali: 'Indonesia',
  surabaya: 'Indonesia',
  'kuala lumpur': 'Malaysia',
  'phnom penh': 'Cambodia',
  'siem reap': 'Cambodia',
  vientiane: 'Laos',
};

/** Normalizes a stored/typed country to its display name ("US" -> "United States"). */
export function normalizeCountry(value: string | null | undefined): string {
  const raw = (value || '').trim();
  if (!raw) return '';
  const upper = raw.toUpperCase();
  if (COUNTRY_NAMES[upper]) return COUNTRY_NAMES[upper];
  const alias = ALIASES[raw.toLowerCase()];
  if (alias) return alias;
  const known = Object.values(COUNTRY_NAMES).find((n) => n.toLowerCase() === raw.toLowerCase());
  return known || raw;
}

/** Country for a city/country pair: an unambiguous known city overrides a mismatched country. */
export function resolveCountry(city: string | null | undefined, country: string | null | undefined): string {
  const fromCity = CITY_COUNTRY[(city || '').trim().toLowerCase()];
  return fromCity || normalizeCountry(country);
}
