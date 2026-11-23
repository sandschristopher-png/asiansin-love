import { cityCenter, haversineKm, kmFromCity, matchSeaCity } from '@/lib/seaLocations';

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

/** Manila: only when there is neither a member location nor a pin to open on. [latitude, longitude]. */
export const FALLBACK_CENTER: readonly [number, number] = [14.5995, 120.9842];
export const FALLBACK_ZOOM = 12;

export interface MapStart {
  center: readonly [number, number];
  zoom: number;
  source: 'city';
}

/** The map never opens closer than this on a member's own area (city level: a neighbourhood, never a street). */
export const START_ZOOM = 12;
/** "Nearby" for the first view: pins within this distance of the member's city centre. */
export const NEARBY_KM = 100;
/** Framing the active pins: padding in px and the closest zoom allowed. */
export const FIT_PADDING = 48;
export const FIT_MAX_ZOOM = 14;

/**
 * Where the spot map opens: the centre of the member's profile city (a municipality counts as its hub) at city zoom. It
 * deliberately ignores profile coordinates and the device position, so the map can never open on, or reveal, a street near
 * someone's home. Null means the city is unknown or outside the cities we list; the page then frames the pins.
 */
export function pickMapStart(input: { city?: string | null }): MapStart | null {
  const named = matchSeaCity(input.city);
  const middle = named ? cityCenter(named) : null;
  return middle ? { center: middle, zoom: START_ZOOM, source: 'city' } : null;
}

/**
 * Whether to frame the active pins instead of staying on the member's city: there are pins, and either the member's city is
 * unknown or none of the pins is within NEARBY_KM of it (so someone outside Asia sees active spots, not an empty map).
 */
export function shouldFitPins(start: MapStart | null, pins: readonly { lat: number; lng: number }[]): boolean {
  if (pins.length === 0) return false;
  if (!start) return true;
  const [clat, clng] = start.center;
  return !pins.some((p) => haversineKm(clat, clng, p.lat, p.lng) <= NEARBY_KM);
}
