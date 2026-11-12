/**
 * "Visiting Soon" shared rules: the destination hubs a trip can name, and the limits the server
 * action (actions/trips.ts) and the database trigger (20261112_visiting_soon.sql) both enforce.
 * No imports, so server code, client components and the Discover API can all use it.
 */

export const TRIP_HUBS = [
  { city: 'Manila', country: 'Philippines' },
  { city: 'Cebu City', country: 'Philippines' },
  { city: 'Davao', country: 'Philippines' },
  { city: 'Bangkok', country: 'Thailand' },
  { city: 'Phuket', country: 'Thailand' },
  { city: 'Chiang Mai', country: 'Thailand' },
  { city: 'Ho Chi Minh City', country: 'Vietnam' },
  { city: 'Da Nang', country: 'Vietnam' },
  { city: 'Hanoi', country: 'Vietnam' },
  { city: 'Phnom Penh', country: 'Cambodia' },
  { city: 'Siem Reap', country: 'Cambodia' },
  { city: 'Tokyo', country: 'Japan' },
  { city: 'Osaka', country: 'Japan' },
  { city: 'Jakarta', country: 'Indonesia' },
  { city: 'Bali', country: 'Indonesia' },
  { city: 'Kuala Lumpur', country: 'Malaysia' },
  { city: 'Singapore', country: 'Singapore' },
] as const;

export type TripHubCity = (typeof TRIP_HUBS)[number]['city'];

const COUNTRY_BY_CITY = new Map<string, string>(TRIP_HUBS.map((h) => [h.city, h.country]));

/** The hub's country, or null when `city` is not one of the curated destinations. */
export function hubCountry(city: unknown): string | null {
  return typeof city === 'string' ? COUNTRY_BY_CITY.get(city) ?? null : null;
}

/** Longest stop, soonest start, upcoming trips per member, and note length (database enforces the same). */
export const MAX_TRIP_DAYS = 90;
export const MAX_DAYS_AHEAD = 183;
export const MAX_UPCOMING_TRIPS = 3;
export const MAX_NOTE_LEN = 140;

/** A trip as Discover cards and profiles show it. Dates are calendar days (YYYY-MM-DD). */
export interface TripBrief {
  city: string;
  country: string | null;
  arrival: string;
  departure: string;
}

/** Local calendar date as YYYY-MM-DD (offset by `days`). */
export function isoToday(days = 0): string {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

const DAY_MS = 86_400_000;
const dayNumber = (iso: string) => {
  const [y, m, d] = iso.split('-').map(Number);
  return Math.round(Date.UTC(y, (m || 1) - 1, d || 1) / DAY_MS);
};

function monthDay(iso: string) {
  const [y, m, d] = iso.split('-').map(Number);
  return `${new Date(Date.UTC(y, (m || 1) - 1, d || 1)).toLocaleDateString('en-US', { month: 'short', timeZone: 'UTC' })} ${d}`;
}

/** "Nov 18 – Dec 2" (same month: "Nov 18 – 22"; one day: "Nov 18"; other year: with the years). */
export function formatRange(start: string, end: string): string {
  const [sy] = start.split('-').map(Number);
  const [ey] = end.split('-').map(Number);
  if (sy !== ey) return `${monthDay(start)}, ${sy} – ${monthDay(end)}, ${ey}`;
  if (start === end) return monthDay(start);
  const sMonth = monthDay(start).split(' ')[0];
  const eMonth = monthDay(end).split(' ')[0];
  return sMonth === eMonth ? `${monthDay(start)} – ${end.split('-')[2].replace(/^0/, '')}` : `${monthDay(start)} – ${monthDay(end)}`;
}

export type TripPhase = 'now' | 'upcoming' | 'past';

export function tripPhase(trip: { arrival: string; departure: string }, today = isoToday()): TripPhase {
  if (trip.departure < today) return 'past';
  if (trip.arrival <= today) return 'now';
  return 'upcoming';
}

/** "In Manila now" / "Arriving tomorrow" / "Arriving in 6 days" (for the manager's status pill). */
export function tripStatusLabel(trip: { city: string; arrival: string; departure: string }, today = isoToday()): string {
  const phase = tripPhase(trip, today);
  if (phase === 'now') return `In ${trip.city} now`;
  if (phase === 'past') return 'Ended';
  const days = dayNumber(trip.arrival) - dayNumber(today);
  return days <= 1 ? 'Arriving tomorrow' : `Arriving in ${days} days`;
}

/** Discover card / profile label: "In Manila now" or "Visiting Manila · Nov 18 – Dec 2". */
export function tripBadgeLabel(trip: TripBrief, today = isoToday()): string {
  return tripPhase(trip, today) === 'now'
    ? `In ${trip.city} now`
    : `Visiting ${trip.city} · ${formatRange(trip.arrival, trip.departure)}`;
}
