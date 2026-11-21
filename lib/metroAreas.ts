/**
 * Metro areas: a member's profile always stores the exact city or municipality (Taguig, Makati,
 * Mandaue...), while hubs, trip destinations and the city pages name the big city around it
 * ("Manila", "Cebu City"). This module is the one place that knows which exact places belong to
 * which hub, so a hub filter still finds a member who lives in Taguig and a card still says
 * "Taguig". No imports, so server code, client components and test scripts can all use it.
 */

interface MetroArea {
  /** The hub as the trip hubs and city pages name it (lib/tripHubs.ts). */
  hub: string;
  /** Other names for the hub itself. */
  aliases: readonly string[];
  /** Cities and municipalities inside the metro area. */
  members: readonly string[];
}

export const METRO_AREAS: readonly MetroArea[] = [
  {
    hub: 'Manila',
    aliases: ['Metro Manila', 'Manila City', 'City of Manila', 'National Capital Region', 'NCR', 'Greater Manila', 'Metropolitan Manila'],
    members: [
      'Taguig', 'Makati', 'Pasig', 'Pasay', 'Quezon City', 'Mandaluyong', 'Paranaque', 'Muntinlupa', 'San Juan', 'Marikina',
      'Caloocan', 'Las Pinas', 'Valenzuela', 'Malabon', 'Navotas', 'Pateros', 'Bonifacio Global City', 'BGC', 'Fort Bonifacio',
      'Ortigas', 'Alabang', 'Eastwood', 'Cubao',
    ],
  },
  {
    hub: 'Cebu City',
    aliases: ['Cebu', 'Metro Cebu', 'Greater Cebu', 'Cebu Metropolitan Area'],
    members: ['Mandaue', 'Lapu-Lapu', 'Mactan', 'Talisay', 'Consolacion', 'Liloan', 'Cordova', 'Minglanilla'],
  },
  {
    hub: 'Davao',
    aliases: ['Davao City'],
    members: ['Panabo', 'Tagum', 'Digos', 'Samal', 'Island Garden City of Samal'],
  },
  {
    hub: 'Bangkok',
    aliases: ['Krung Thep', 'Bangkok Metropolitan Region', 'Greater Bangkok'],
    members: ['Nonthaburi', 'Samut Prakan', 'Pathum Thani', 'Samut Sakhon', 'Nakhon Pathom'],
  },
  {
    hub: 'Ho Chi Minh City',
    aliases: ['Saigon', 'Ho Chi Minh', 'HCMC', 'Sai Gon'],
    members: ['Thu Duc', 'Binh Thanh', 'Tan Binh', 'Go Vap', 'Phu Nhuan', 'Bien Hoa', 'Thuan An', 'Di An'],
  },
  {
    hub: 'Jakarta',
    aliases: ['DKI Jakarta', 'Greater Jakarta', 'Jabodetabek'],
    members: ['Tangerang', 'South Tangerang', 'Tangerang Selatan', 'Bekasi', 'Depok', 'Bogor'],
  },
  {
    hub: 'Kuala Lumpur',
    aliases: ['KL', 'Greater Kuala Lumpur', 'Klang Valley'],
    members: ['Petaling Jaya', 'Shah Alam', 'Subang Jaya', 'Klang', 'Cyberjaya', 'Putrajaya', 'Ampang', 'Cheras', 'Kajang'],
  },
  {
    hub: 'Bali',
    aliases: [],
    members: ['Denpasar', 'Ubud', 'Canggu', 'Seminyak', 'Kuta', 'Sanur', 'Uluwatu', 'Badung', 'Gianyar'],
  },
];

/** Lower-case, accents and punctuation removed: "Parañaque" and "paranaque" compare equal. */
export function normalizePlace(value: unknown): string {
  return String(value ?? '')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

const HUB_OF = new Map<string, string>();
const PLACES_OF = new Map<string, string[]>();
for (const area of METRO_AREAS) {
  const names = [area.hub, ...area.aliases, ...area.members];
  PLACES_OF.set(area.hub, [...names]);
  for (const name of names) HUB_OF.set(normalizePlace(name), area.hub);
}

/** The hub a place belongs to ("Taguig" -> "Manila", "Mandaue" -> "Cebu City"), or null. A hub maps to itself. */
export function metroHubOf(place: string | null | undefined): string | null {
  return HUB_OF.get(normalizePlace(place)) ?? null;
}

/**
 * Whether a member's exact city sits inside a hub's metro area. A city outside every metro area only
 * matches itself, so Cebu City never matches Manila and an unlisted town never matches a hub.
 */
export function cityInHub(city: string | null | undefined, hub: string | null | undefined): boolean {
  const wanted = normalizePlace(hub);
  const have = normalizePlace(city);
  if (!wanted || !have) return false;
  if (have === wanted) return true;
  const area = HUB_OF.get(wanted);
  return area !== undefined && HUB_OF.get(have) === area;
}

/** Every name a hub filter should accept as a destination or city for that hub (the hub itself first). */
export function hubPlaceNames(hub: string): string[] {
  const area = HUB_OF.get(normalizePlace(hub));
  return area ? [...(PLACES_OF.get(area) ?? [hub])] : [hub];
}

/**
 * Free-text search: does the query match the member's exact city, or the hub that city belongs to?
 * "manila" finds Taguig and Makati members; "taguig" finds only Taguig. Matching is by substring on
 * the normalized text, like the existing search box.
 */
export function placeMatchesQuery(city: string | null | undefined, query: string): boolean {
  const q = normalizePlace(query);
  if (!q) return true;
  if (normalizePlace(city).includes(q)) return true;
  const hub = metroHubOf(city);
  return hub !== null && normalizePlace(hub).includes(q);
}
