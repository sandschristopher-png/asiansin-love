import { metroHubOf } from '@/lib/metroAreas';
import { hubCountry } from '@/lib/tripHubs';

/**
 * Travel Hub (/travel) rules shared by the page, its client sections and the tests. Imports only the two
 * dependency-free lib modules, so server code, client components and node test scripts can all use it.
 */

/** The hubs in the "Explore hubs" row: what the pill says, the trip hub it filters Discover by, and its city page. */
export const EXPLORE_HUBS = [
  { label: 'Manila', hub: 'Manila', guide: '/manila' },
  { label: 'Cebu', hub: 'Cebu City', guide: '/cebu' },
  { label: 'Bangkok', hub: 'Bangkok', guide: '/bangkok' },
  { label: 'Phnom Penh', hub: 'Phnom Penh', guide: '/phnom-penh' },
  { label: 'Kuala Lumpur', hub: 'Kuala Lumpur', guide: '/kuala-lumpur' },
  { label: 'Ho Chi Minh City', hub: 'Ho Chi Minh City', guide: '/cities/ho-chi-minh-city' },
] as const;

/** Discover filtered to the members who have an upcoming trip to `hub`. */
export function visitingHref(hub: string): string {
  return `/discover?visiting=${encodeURIComponent(hub)}`;
}

/**
 * The Asia hub a member lives in, or null (outside Asia, no city yet, or a city that is not a hub).
 * A municipality counts for its metro hub ("Taguig" -> "Manila", "Mandaue" -> "Cebu City"); a hub city
 * outside any metro area ("Phuket", "Singapore") counts as itself. Only curated trip hubs qualify, so the
 * result can always go straight into /discover?visiting=.
 */
export function viewerHub(city: string | null | undefined): string | null {
  const name = String(city ?? '').split(',')[0].trim();
  if (!name) return null;
  const hub = metroHubOf(name);
  if (hub && hubCountry(hub)) return hub;
  return hubCountry(name) ? name : null;
}

/** What a member can say about their travel, stored in profiles.travel_intent (20261201_travel_intent_pills.sql). */
export const TRAVEL_INTENTS = ['open_to_dates', 'local_guide', 'relocating'] as const;
export type TravelIntent = (typeof TRAVEL_INTENTS)[number];

export function isTravelIntent(value: unknown): value is TravelIntent {
  return typeof value === 'string' && (TRAVEL_INTENTS as readonly string[]).includes(value);
}
