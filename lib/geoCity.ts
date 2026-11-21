/**
 * Picks the city a profile should show from a Nominatim reverse-geocode address. The rule is "the
 * actual city or municipality": Taguig, Makati, Mandaue, Las Vegas, never a region ("Metro Manila"),
 * a county ("Clark County") or a state, unless the result has nothing finer. No imports, so the
 * browser, the server and the test script can all use it.
 */

export interface NominatimAddress {
  city?: string;
  town?: string;
  municipality?: string;
  village?: string;
  hamlet?: string;
  city_district?: string;
  suburb?: string;
  county?: string;
  state_district?: string;
  state?: string;
  region?: string;
  country?: string;
  country_code?: string;
  [key: string]: unknown;
}

/** Names that describe a whole region rather than a place a member lives in. */
const REGION_LABELS = new Set(['metro manila', 'metropolitan manila', 'national capital region', 'ncr', 'greater manila']);

/**
 * Unincorporated towns that the post office (and every member) calls by the big neighbour's name.
 * Keyed by "county|state" so "Paradise" only becomes Las Vegas inside Clark County, Nevada.
 */
const POSTAL_CITY: Record<string, { city: string; towns: readonly string[] }> = {
  'clark county|nevada': {
    city: 'Las Vegas',
    towns: ['paradise', 'spring valley', 'enterprise', 'winchester', 'sunrise manor', 'whitney', 'summerlin south', 'lone mountain'],
  },
};

const clean = (v: unknown): string => (typeof v === 'string' ? v.trim() : '');
const lower = (v: unknown): string => clean(v).toLowerCase();
const isPlace = (v: unknown): boolean => clean(v) !== '' && !REGION_LABELS.has(lower(v));

/** "Clark County" -> "Clark" is not a place either: only used as a last resort, without the suffix word. */
const stripCounty = (v: string): string => v.replace(/\s+(county|province|regency)$/i, '').trim();

export function pickCity(addr: NominatimAddress | null | undefined): string {
  const a = addr ?? {};
  const postal = POSTAL_CITY[`${lower(a.county)}|${lower(a.state)}`];

  // Nominatim reports a municipality under city, town, municipality or village depending on its size.
  const place = [a.city, a.town, a.municipality, a.village, a.hamlet].find(isPlace);
  if (place) {
    const name = clean(place);
    return postal && postal.towns.includes(name.toLowerCase()) ? postal.city : name;
  }
  // No city-level name at all inside a mapped county: use the postal city for it.
  if (postal) return postal.city;

  // Finer-than-city fallbacks, then the broad ones as a last resort.
  const district = [a.city_district, a.suburb].find(isPlace);
  if (district) return clean(district);
  const broad = [a.county, a.state_district, a.state, a.region].find(isPlace);
  return broad ? stripCounty(clean(broad)) : 'Unknown';
}
