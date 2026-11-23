import { kmFromCity } from '@/lib/seaLocations';

/**
 * Spot map rules: how a pin is validated and stored, which style the map uses, and how the filter pills narrow the pins.
 * Kept free of React and maplibre so the server route and the tests can use it.
 */

/**
 * Light, desaturated vector basemap (OpenFreeMap "positron": keyless, free for commercial use, attribution is shown by the
 * map). Swap it by setting NEXT_PUBLIC_MAP_STYLE_URL (for example a MapTiler style URL that carries its own key).
 */
export const MAP_STYLE_URL = process.env.NEXT_PUBLIC_MAP_STYLE_URL || 'https://tiles.openfreemap.org/styles/positron';

/** A pin must sit this close to its Moment's city centre, so a pin cannot be dropped across the world. */
export const MAX_PIN_KM = 100;
/** Pins are stored to 3 decimals (about 110 m): a venue or a corner, never a door. */
export const PIN_DECIMALS = 3;

export function roundPin(n: number): number {
  const k = 10 ** PIN_DECIMALS;
  return Math.round(n * k) / k;
}

export function isLatLng(lat: unknown, lng: unknown): lat is number {
  return (
    typeof lat === 'number' && typeof lng === 'number' && Number.isFinite(lat) && Number.isFinite(lng) && Math.abs(lat) <= 90 && Math.abs(lng) <= 180
  );
}

/**
 * The pin to store for a Moment, or null when it should be dropped (not numbers, out of range, no place name, or too far
 * from the Moment's city). The spot name still posts without it.
 */
export function pinToStore(city: string, place: string, lat: unknown, lng: unknown): { lat: number; lng: number } | null {
  if (!place.trim() || !isLatLng(lat, lng)) return null;
  const la = Number(lat);
  const ln = Number(lng);
  const km = kmFromCity(city, la, ln);
  if (km === null || km > MAX_PIN_KM) return null;
  return { lat: roundPin(la), lng: roundPin(ln) };
}

/** The filter pills on the map: one "Looking for" value (or none), plus the Local guide picks switch. */
export function pinVisible(
  author: { intent?: string | null; localGuide?: boolean },
  filters: { intent: string | null; picks: boolean }
): boolean {
  if (filters.picks && !author.localGuide) return false;
  if (filters.intent && author.intent !== filters.intent) return false;
  return true;
}
