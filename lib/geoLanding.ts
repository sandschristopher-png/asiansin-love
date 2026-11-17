/**
 * Which landing page a visitor gets. Pure, so it is unit-tested (scripts/test-landing-geo.mjs).
 *
 * Country comes from the edge's geolocation headers, first usable one wins:
 *   x-vercel-ip-country, cf-ipcountry, x-country-code
 * A `?country=XX` search param overrides them for QA: `?country=PH` shows the Philippines page from
 * anywhere, any other code (for example `?country=US`) shows the global page from anywhere.
 */
export const GEO_HEADERS = ['x-vercel-ip-country', 'cf-ipcountry', 'x-country-code'] as const;

/** An ISO 3166-1 alpha-2 code, upper-cased; anything else (empty, "XX" unknown, "T1" Tor) is not a country. */
export function cleanCountry(raw: string | null | undefined): string | null {
  const v = (raw ?? '').trim().toUpperCase();
  return /^[A-Z]{2}$/.test(v) && v !== 'XX' ? v : null;
}

export function countryFromHeaders(get: (name: string) => string | null | undefined): string | null {
  for (const name of GEO_HEADERS) {
    const c = cleanCountry(get(name));
    if (c) return c;
  }
  return null;
}

/** The visitor's country: the QA override when it is a valid code, otherwise the edge headers. */
export function resolveCountry(get: (name: string) => string | null | undefined, override?: string | string[] | null): string | null {
  const o = cleanCountry(Array.isArray(override) ? override[0] : override);
  return o ?? countryFromHeaders(get);
}

export const isPhilippines = (country: string | null): boolean => country === 'PH';
