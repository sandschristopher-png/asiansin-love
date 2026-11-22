// Travel Hub (/travel) rules: which hub a member lives in, the hub row, and the travel intents. Run: npm run travel:test
import { loadLib } from './lib/load-ts.mjs';

const hub = await loadLib('travelHub');
const trips = await loadLib('tripHubs');
const metro = await loadLib('metroAreas');
let passed = 0;
const failures = [];
const ok = (name, cond) => (cond ? passed++ : failures.push(name));

// --- viewerHub: the Asia hub a member's city belongs to ------------------------------------------------------
ok('Manila is Manila', hub.viewerHub('Manila') === 'Manila');
ok('metro municipalities map to Manila', ['Taguig', 'Makati', 'Pasig', 'Quezon City', 'Parañaque', 'Mandaluyong'].every((c) => hub.viewerHub(c) === 'Manila'));
ok('Cebu and its municipalities map to Cebu City', ['Cebu', 'Cebu City', 'Mandaue', 'Lapu-Lapu'].every((c) => hub.viewerHub(c) === 'Cebu City'));
ok('Bangkok, Kuala Lumpur and Ho Chi Minh City resolve', hub.viewerHub('Bangkok') === 'Bangkok' && hub.viewerHub('Petaling Jaya') === 'Kuala Lumpur' && hub.viewerHub('Saigon') === 'Ho Chi Minh City');
ok('Phnom Penh and its districts resolve', hub.viewerHub('Phnom Penh') === 'Phnom Penh' && hub.viewerHub('Takhmao') === 'Phnom Penh' && hub.viewerHub('Chamkar Mon') === 'Phnom Penh');
ok('a hub city outside any metro area counts as itself', hub.viewerHub('Phuket') === 'Phuket' && hub.viewerHub('Singapore') === 'Singapore' && hub.viewerHub('Siem Reap') === 'Siem Reap');
ok('a "City, Country" label is read by its city', hub.viewerHub('Taguig, Philippines') === 'Manila');
ok('accents and case do not matter', hub.viewerHub('PARAÑAQUE') === 'Manila' && hub.viewerHub('  bangkok ') === 'Bangkok');
ok('outside Asia is not a hub', ['Las Vegas', 'London', 'Los Angeles', 'Berlin', 'Sydney'].every((c) => hub.viewerHub(c) === null));
ok('Asian cities that are not hubs are not hubs', hub.viewerHub('Tokyo') === null && hub.viewerHub('Seoul') === null);
ok('no city, null and junk are not hubs', hub.viewerHub('') === null && hub.viewerHub(null) === null && hub.viewerHub(undefined) === null && hub.viewerHub('Unknown') === null);
ok('every hub result can go straight into the Discover filter', ['Taguig', 'Mandaue', 'Takhmao', 'Phuket', 'Petaling Jaya'].every((c) => trips.hubCountry(hub.viewerHub(c)) !== null));

// --- the "Explore hubs" row ------------------------------------------------------------------------------------
ok('six hubs in the row', hub.EXPLORE_HUBS.length === 6);
ok('every pill filters by a curated trip hub', hub.EXPLORE_HUBS.every((h) => trips.hubCountry(h.hub) !== null));
ok('every pill has a guide page', hub.EXPLORE_HUBS.every((h) => h.guide.startsWith('/')));
ok('the row names the six launch hubs', ['Manila', 'Cebu', 'Bangkok', 'Phnom Penh', 'Kuala Lumpur', 'Ho Chi Minh City'].every((l) => hub.EXPLORE_HUBS.some((h) => h.label === l)));
ok('Cebu filters by Cebu City, the trip hub name', hub.EXPLORE_HUBS.find((h) => h.label === 'Cebu')?.hub === 'Cebu City');
ok('every hub in the row is a metro hub or its own place', hub.EXPLORE_HUBS.every((h) => metro.metroHubOf(h.hub) === h.hub));
ok('the Discover link encodes the hub', hub.visitingHref('Ho Chi Minh City') === '/discover?visiting=Ho%20Chi%20Minh%20City' && hub.visitingHref('Manila') === '/discover?visiting=Manila');

// --- travel intents --------------------------------------------------------------------------------------------
ok('three intents', hub.TRAVEL_INTENTS.length === 3);
ok('the intents are the values the migration allows', ['open_to_dates', 'local_guide', 'relocating'].every((v) => hub.TRAVEL_INTENTS.includes(v)));
ok('isTravelIntent accepts them and rejects anything else', hub.TRAVEL_INTENTS.every(hub.isTravelIntent) && !hub.isTravelIntent('expat') && !hub.isTravelIntent('') && !hub.isTravelIntent(null) && !hub.isTravelIntent(3));

console.log(`travel hub: ${passed} passed, ${failures.length} failed`);
if (failures.length) {
  for (const f of failures) console.error('  FAIL ' + f);
  process.exit(1);
}
