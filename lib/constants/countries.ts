/**
 * Regional country catalog for intent-aware selectors (Discover filters, onboarding).
 * Women on the platform are mostly in Southeast Asia; men mostly in Western countries.
 */
import { COUNTRY_NAMES, normalizeCountry } from '@/lib/countries';

export interface CountryOption {
  code: string;
  name: string;
}

/** All 11 ASEAN / Southeast Asian nations, alphabetical. */
export const SOUTHEAST_ASIA_COUNTRIES: readonly CountryOption[] = [
  { code: 'BN', name: 'Brunei' },
  { code: 'KH', name: 'Cambodia' },
  { code: 'ID', name: 'Indonesia' },
  { code: 'LA', name: 'Laos' },
  { code: 'MY', name: 'Malaysia' },
  // Personal communications services are covered by the OFAC general license for Burma.
  { code: 'MM', name: 'Myanmar' },
  { code: 'PH', name: 'Philippines' },
  { code: 'SG', name: 'Singapore' },
  { code: 'TH', name: 'Thailand' },
  { code: 'TL', name: 'Timor-Leste' },
  { code: 'VN', name: 'Vietnam' },
];

export const TOP_WESTERN_COUNTRIES: readonly CountryOption[] = [
  { code: 'US', name: 'United States' },
  { code: 'CA', name: 'Canada' },
  { code: 'GB', name: 'United Kingdom' },
  { code: 'AU', name: 'Australia' },
  { code: 'NZ', name: 'New Zealand' },
  { code: 'DE', name: 'Germany' },
  { code: 'NL', name: 'Netherlands' },
  { code: 'SE', name: 'Sweden' },
  { code: 'NO', name: 'Norway' },
  { code: 'FR', name: 'France' },
];

export const ALL_COUNTRIES_VALUE = 'All';
export const OTHER_COUNTRY_VALUE = 'Other';

/** Country list for the gender being browsed: women -> SEA, men -> Western. */
export function countriesForSeeking(seeking: 'female' | 'male' | null | undefined): readonly CountryOption[] {
  return seeking === 'male' ? TOP_WESTERN_COUNTRIES : SOUTHEAST_ASIA_COUNTRIES;
}

const CATALOG: Record<string, string> = Object.fromEntries(
  [...SOUTHEAST_ASIA_COUNTRIES, ...TOP_WESTERN_COUNTRIES].map((c) => [c.code, c.name])
);

/** "mm" / "MM" / "Myanmar" / "Burma" -> "Myanmar". Unknown values pass through trimmed. */
export function canonicalCountry(value: string | null | undefined): string {
  const raw = (value || '').trim();
  if (!raw) return '';
  const upper = raw.toUpperCase();
  if (CATALOG[upper]) return CATALOG[upper];
  if (COUNTRY_NAMES[upper]) return COUNTRY_NAMES[upper];
  const lower = raw.toLowerCase();
  if (lower === 'burma') return 'Myanmar';
  if (lower === 'east timor' || lower === 'timor leste') return 'Timor-Leste';
  return normalizeCountry(raw);
}

/**
 * Exact country match on names or ISO-3166 alpha-2 codes. "All" matches everything; "Other"
 * matches anything outside the given list.
 */
export function countryMatches(
  profileCountry: string | null | undefined,
  selected: string,
  list: readonly CountryOption[] = [...SOUTHEAST_ASIA_COUNTRIES, ...TOP_WESTERN_COUNTRIES]
): boolean {
  if (!selected || selected.toLowerCase() === ALL_COUNTRIES_VALUE.toLowerCase()) return true;
  const have = canonicalCountry(profileCountry).toLowerCase();
  if (selected.toLowerCase() === OTHER_COUNTRY_VALUE.toLowerCase()) {
    return !list.some((c) => c.name.toLowerCase() === have);
  }
  return have !== '' && have === canonicalCountry(selected).toLowerCase();
}
