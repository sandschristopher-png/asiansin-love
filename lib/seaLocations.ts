/**
 * Southeast Asia locations a Moment can be posted from, grouped by country. The database check on
 * moments.city (20261125_moments_vibes.sql) lists exactly these cities; scripts/test-moments-config.mjs
 * fails if the two drift. Names stay as written in every language. Only imports the pure metro-area
 * table, so server and client code can both use it.
 */
import { metroHubOf } from '@/lib/metroAreas';

export const SEA_LOCATIONS = [
  { country: 'Philippines', cities: ['Manila', 'Cebu', 'Davao', 'Angeles / Clark', 'Iloilo', 'Bacolod', 'Dumaguete', 'Palawan', 'Boracay', 'Baguio', 'Subic'] },
  { country: 'Thailand', cities: ['Bangkok', 'Chiang Mai', 'Phuket', 'Pattaya', 'Krabi', 'Koh Samui', 'Hua Hin', 'Chiang Rai'] },
  { country: 'Vietnam', cities: ['Ho Chi Minh City', 'Hanoi', 'Da Nang', 'Nha Trang', 'Hoi An', 'Phu Quoc', 'Dalat'] },
  { country: 'Indonesia', cities: ['Jakarta', 'Bali', 'Surabaya', 'Yogyakarta', 'Bandung', 'Lombok'] },
  { country: 'Cambodia', cities: ['Phnom Penh', 'Siem Reap', 'Sihanoukville', 'Kampot', 'Kratie'] },
  { country: 'Malaysia', cities: ['Kuala Lumpur', 'Penang', 'Johor Bahru', 'Kota Kinabalu', 'Malacca'] },
  { country: 'Singapore', cities: ['Singapore'] },
  { country: 'Laos', cities: ['Vientiane', 'Luang Prabang'] },
  { country: 'Brunei', cities: ['Bandar Seri Begawan'] },
] as const;

export type SeaCity = (typeof SEA_LOCATIONS)[number]['cities'][number];

export const SEA_CITIES: readonly SeaCity[] = SEA_LOCATIONS.flatMap((l) => l.cities) as SeaCity[];

const COUNTRY_BY_CITY = new Map<string, string>(SEA_LOCATIONS.flatMap((l) => l.cities.map((c) => [c, l.country] as const)));

export const isSeaCity = (v: unknown): v is SeaCity => typeof v === 'string' && COUNTRY_BY_CITY.has(v);

/** City centres (latitude, longitude), used to map a GPS fix to the nearest city in the list. */
const COORDS: Record<SeaCity, readonly [number, number]> = {
  Manila: [14.5995, 120.9842], Cebu: [10.3157, 123.8854], Davao: [7.1907, 125.4553], 'Angeles / Clark': [15.145, 120.5887],
  Iloilo: [10.7202, 122.5621], Bacolod: [10.6713, 122.9511], Dumaguete: [9.3068, 123.3054], Palawan: [9.7392, 118.7353],
  Boracay: [11.9674, 121.9248], Baguio: [16.4023, 120.596], Subic: [14.876, 120.27],
  Bangkok: [13.7563, 100.5018], 'Chiang Mai': [18.7883, 98.9853], Phuket: [7.8804, 98.3923], Pattaya: [12.9236, 100.8825],
  Krabi: [8.0863, 98.9063], 'Koh Samui': [9.512, 100.0136], 'Hua Hin': [12.5684, 99.9577], 'Chiang Rai': [19.9105, 99.8406],
  'Ho Chi Minh City': [10.8231, 106.6297], Hanoi: [21.0285, 105.8542], 'Da Nang': [16.0544, 108.2022], 'Nha Trang': [12.2388, 109.1967],
  'Hoi An': [15.8801, 108.338], 'Phu Quoc': [10.2899, 103.984], Dalat: [11.9404, 108.4583],
  Jakarta: [-6.2088, 106.8456], Bali: [-8.55, 115.2], Surabaya: [-7.2575, 112.7521], Yogyakarta: [-7.7956, 110.3695],
  Bandung: [-6.9175, 107.6191], Lombok: [-8.5833, 116.1167],
  'Phnom Penh': [11.5564, 104.9282], 'Siem Reap': [13.3671, 103.8448], Sihanoukville: [10.6093, 103.5296], Kampot: [10.6104, 104.1815], Kratie: [12.4881, 106.0188],
  'Kuala Lumpur': [3.139, 101.6869], Penang: [5.4141, 100.3288], 'Johor Bahru': [1.4927, 103.7414], 'Kota Kinabalu': [5.9804, 116.0735], Malacca: [2.1896, 102.2501],
  Singapore: [1.3521, 103.8198], Vientiane: [17.9757, 102.6331], 'Luang Prabang': [19.8845, 102.1347], 'Bandar Seri Begawan': [4.9031, 114.9398],
};

/** Farthest a GPS fix can be from a city centre and still count as "in" that city's area. */
export const SEA_CITY_RADIUS_KM = 100;

function haversineKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const rad = Math.PI / 180;
  const dLat = (lat2 - lat1) * rad;
  const dLon = (lon2 - lon1) * rad;
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1 * rad) * Math.cos(lat2 * rad) * Math.sin(dLon / 2) ** 2;
  return 6371 * 2 * Math.asin(Math.min(1, Math.sqrt(a)));
}

/**
 * The listed city nearest to a GPS fix, or null when the fix is invalid or farther than
 * SEA_CITY_RADIUS_KM from every city (so a fix outside Southeast Asia never matches).
 */
export function nearestSeaCity(lat: number, lng: number): { city: SeaCity; km: number } | null {
  if (!Number.isFinite(lat) || !Number.isFinite(lng) || Math.abs(lat) > 90 || Math.abs(lng) > 180) return null;
  let best: { city: SeaCity; km: number } | null = null;
  for (const city of SEA_CITIES) {
    const [clat, clng] = COORDS[city];
    const km = haversineKm(lat, lng, clat, clng);
    if (!best || km < best.km) best = { city, km };
  }
  return best && best.km <= SEA_CITY_RADIUS_KM ? best : null;
}

/** Country codes of the Southeast Asian countries in the list (as the edge header reports them). */
export const SEA_COUNTRY_CODES = ['PH', 'TH', 'VN', 'ID', 'KH', 'MY', 'SG', 'LA', 'BN'] as const;

/** The country a city sits in ("Chiang Mai" -> "Thailand"), or null for anything outside the list. */
export const countryOfCity = (city: string): string | null => COUNTRY_BY_CITY.get(city) ?? null;

/** Common spellings and larger-area names that should land on one of our cities. */
const ALIASES: Record<string, SeaCity> = {
  'cebu city': 'Cebu',
  'davao city': 'Davao',
  angeles: 'Angeles / Clark',
  clark: 'Angeles / Clark',
  'angeles city': 'Angeles / Clark',
  saigon: 'Ho Chi Minh City',
  'ho chi minh': 'Ho Chi Minh City',
  hcmc: 'Ho Chi Minh City',
  'kuala lumpur': 'Kuala Lumpur',
  kl: 'Kuala Lumpur',
  'george town': 'Penang',
  denpasar: 'Bali',
  ubud: 'Bali',
  canggu: 'Bali',
  'koh samui': 'Koh Samui',
  'ko samui': 'Koh Samui',
  melaka: 'Malacca',
};

/**
 * Best match for a free-text place (a profile city or a trip destination) among our cities, or null.
 * Case-insensitive; "Cebu City" and "Saigon" resolve to "Cebu" and "Ho Chi Minh City".
 */
export function matchSeaCity(raw: string | null | undefined): SeaCity | null {
  const text = String(raw ?? '').trim().toLowerCase();
  if (text.length < 2) return null;
  if (ALIASES[text]) return ALIASES[text];
  for (const city of SEA_CITIES) if (city.toLowerCase() === text) return city;
  // A municipality inside a metro area ("Taguig", "Mandaue") lands on its hub's Moments city.
  const hub = metroHubOf(text);
  if (hub) {
    const hubKey = hub.toLowerCase();
    const sea = ALIASES[hubKey] ?? SEA_CITIES.find((c) => c.toLowerCase() === hubKey);
    if (sea) return sea;
  }
  for (const [alias, city] of Object.entries(ALIASES)) if (text.includes(alias)) return city;
  for (const city of SEA_CITIES) if (text.length > 3 && (text.includes(city.toLowerCase()) || city.toLowerCase().includes(text))) return city;
  return null;
}
