/**
 * Best-effort IANA time zone for a member's city / country, for the chat header's local time
 * ("Manila 10:45 AM"). Single-zone countries map directly; multi-zone countries need a known
 * city. Returns null when unsure, and the caller then shows no time rather than a wrong one.
 */

const COUNTRY_ZONES: Record<string, string> = {
  philippines: 'Asia/Manila',
  thailand: 'Asia/Bangkok',
  vietnam: 'Asia/Ho_Chi_Minh',
  'viet nam': 'Asia/Ho_Chi_Minh',
  cambodia: 'Asia/Phnom_Penh',
  laos: 'Asia/Vientiane',
  myanmar: 'Asia/Yangon',
  malaysia: 'Asia/Kuala_Lumpur',
  singapore: 'Asia/Singapore',
  japan: 'Asia/Tokyo',
  'south korea': 'Asia/Seoul',
  korea: 'Asia/Seoul',
  china: 'Asia/Shanghai',
  taiwan: 'Asia/Taipei',
  'hong kong': 'Asia/Hong_Kong',
  india: 'Asia/Kolkata',
  'united arab emirates': 'Asia/Dubai',
  'united kingdom': 'Europe/London',
  ireland: 'Europe/Dublin',
  germany: 'Europe/Berlin',
  france: 'Europe/Paris',
  netherlands: 'Europe/Amsterdam',
  switzerland: 'Europe/Zurich',
  italy: 'Europe/Rome',
  spain: 'Europe/Madrid',
  sweden: 'Europe/Stockholm',
  norway: 'Europe/Oslo',
  denmark: 'Europe/Copenhagen',
  'new zealand': 'Pacific/Auckland',
};

const CITY_ZONES: Record<string, string> = {
  // Indonesia
  jakarta: 'Asia/Jakarta', bandung: 'Asia/Jakarta', surabaya: 'Asia/Jakarta', yogyakarta: 'Asia/Jakarta',
  bali: 'Asia/Makassar', denpasar: 'Asia/Makassar', makassar: 'Asia/Makassar',
  // United States
  'los angeles': 'America/Los_Angeles', 'san francisco': 'America/Los_Angeles', 'san diego': 'America/Los_Angeles',
  'las vegas': 'America/Los_Angeles', seattle: 'America/Los_Angeles', portland: 'America/Los_Angeles',
  'san jose': 'America/Los_Angeles', sacramento: 'America/Los_Angeles',
  phoenix: 'America/Phoenix', denver: 'America/Denver', 'salt lake city': 'America/Denver',
  chicago: 'America/Chicago', houston: 'America/Chicago', dallas: 'America/Chicago', austin: 'America/Chicago',
  'san antonio': 'America/Chicago', minneapolis: 'America/Chicago',
  'new york': 'America/New_York', boston: 'America/New_York', miami: 'America/New_York', atlanta: 'America/New_York',
  washington: 'America/New_York', philadelphia: 'America/New_York', orlando: 'America/New_York',
  honolulu: 'Pacific/Honolulu', anchorage: 'America/Anchorage',
  // Canada
  toronto: 'America/Toronto', montreal: 'America/Toronto', vancouver: 'America/Vancouver', calgary: 'America/Edmonton',
  // Australia
  sydney: 'Australia/Sydney', melbourne: 'Australia/Melbourne', brisbane: 'Australia/Brisbane',
  perth: 'Australia/Perth', adelaide: 'Australia/Adelaide',
};

export function timeZoneFor(city?: string | null, country?: string | null): string | null {
  const c = String(city || '').split(',')[0].trim().toLowerCase();
  if (c && CITY_ZONES[c]) return CITY_ZONES[c];
  const k = String(country || '').trim().toLowerCase();
  return COUNTRY_ZONES[k] ?? null;
}

/** "10:45 AM" in the given zone, or null if the zone is unknown to this runtime. */
export function localTimeIn(zone: string | null, now = new Date()): string | null {
  if (!zone) return null;
  try {
    return new Intl.DateTimeFormat('en-US', { hour: 'numeric', minute: '2-digit', timeZone: zone }).format(now);
  } catch {
    return null;
  }
}
