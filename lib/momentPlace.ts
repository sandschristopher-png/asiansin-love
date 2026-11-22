/**
 * Spot-tagged Moments: the place text, and the links that hand it to an external maps app. No imports, no map SDK:
 * the app only builds a search or directions link ("<place>, <city>") and lets Google Maps or Apple Maps do the rest.
 */
export const MAX_PLACE = 80;

export type NavMode = 'walk' | 'drive' | 'transit';
export type NavApp = 'google' | 'apple';

/** Collapses whitespace, removes control characters and caps the length. Empty means "no spot". */
export function cleanPlace(raw: unknown): string {
  return String(raw ?? '')
    .replace(/[\u0000-\u001f\u007f]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, MAX_PLACE)
    .trim();
}

/** What the maps app searches for: the spot, in the Moment's city. */
export function placeQuery(place: string, city: string): string {
  const spot = cleanPlace(place);
  const where = String(city ?? '').trim();
  return where ? `${spot}, ${where}` : spot;
}

const GOOGLE_MODE: Record<NavMode, string> = { walk: 'walking', drive: 'driving', transit: 'transit' };
const APPLE_MODE: Record<NavMode, string> = { walk: 'w', drive: 'd', transit: 'r' };

/** Directions to the place, from wherever the member is, by the chosen mode. */
export function directionsUrl(app: NavApp, query: string, mode: NavMode): string {
  const q = encodeURIComponent(query);
  return app === 'google'
    ? `https://www.google.com/maps/dir/?api=1&destination=${q}&travelmode=${GOOGLE_MODE[mode]}`
    : `https://maps.apple.com/?daddr=${q}&dirflg=${APPLE_MODE[mode]}`;
}
