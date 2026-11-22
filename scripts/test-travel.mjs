// Travel Hub (/travel) rules: which hub a member lives in, the hub row, and the travel intents. Run: npm run travel:test
import { loadLib } from './lib/load-ts.mjs';

const hub = await loadLib('travelHub');
const trips = await loadLib('tripHubs');
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

// --- the Discover link --------------------------------------------------------------------------------------------
ok('the Discover link encodes the hub', hub.visitingHref('Ho Chi Minh City') === '/discover?visiting=Ho%20Chi%20Minh%20City' && hub.visitingHref('Manila') === '/discover?visiting=Manila');

// --- Discover's hub filter: Plus, plus the Travel Hub's own-hub preview for everyone ---------------------------
const allow = (o) => hub.visitingFilterAllowed({ hub: 'Manila', viewerIsPlus: false, preview: null, viewerCity: null, ...o });
ok('Plus members always get the hub filter', allow({ viewerIsPlus: true }) === true && allow({ viewerIsPlus: true, hub: 'Bangkok' }) === true);
ok('a free member does not get the filter on its own', allow({ viewerCity: 'Manila' }) === false);
ok('the preview shows a free member their own hub', allow({ preview: 'travel', viewerCity: 'Manila' }) === true);
ok('a metro municipality is its hub (Taguig sees Manila)', allow({ preview: 'travel', viewerCity: 'Taguig' }) === true);
ok('a free member cannot preview another hub', allow({ preview: 'travel', viewerCity: 'Bangkok' }) === false && allow({ preview: 'travel', viewerCity: 'Cebu City' }) === false);
ok('outside Asia, or with no city, the preview is refused', allow({ preview: 'travel', viewerCity: 'Las Vegas' }) === false && allow({ preview: 'travel', viewerCity: null }) === false);
ok('another preview value does not count', allow({ preview: 'discover', viewerCity: 'Manila' }) === false && allow({ preview: '', viewerCity: 'Manila' }) === false);
ok('an unknown or empty hub is never allowed', allow({ hub: '', viewerIsPlus: true }) === false && allow({ hub: 'Tokyo', viewerIsPlus: true }) === false && allow({ hub: "Manila'--", viewerIsPlus: true }) === false);

// --- travel intents --------------------------------------------------------------------------------------------
ok('three intents', hub.TRAVEL_INTENTS.length === 3);
ok('the intents are the values the migration allows', ['open_to_dates', 'local_guide', 'relocating'].every((v) => hub.TRAVEL_INTENTS.includes(v)));
ok('isTravelIntent accepts them and rejects anything else', hub.TRAVEL_INTENTS.every(hub.isTravelIntent) && !hub.isTravelIntent('expat') && !hub.isTravelIntent('') && !hub.isTravelIntent(null) && !hub.isTravelIntent(3));

console.log(`travel hub: ${passed} passed, ${failures.length} failed`);
if (failures.length) {
  for (const f of failures) console.error('  FAIL ' + f);
  process.exit(1);
}
