// City-level location rules: which city a profile shows, and which hub a city belongs to.
// Run: npm run location:test
import { loadLib } from './lib/load-ts.mjs';

const geo = await loadLib('geoCity');
const metro = await loadLib('metroAreas');
const sea = await loadLib('seaLocations');
let passed = 0;
const failures = [];
const ok = (name, cond) => (cond ? passed++ : failures.push(name));

// --- pickCity: the exact city, never a region, county or state --------------------------------------------
ok('Taguig stays Taguig (not Manila, not Metro Manila)', geo.pickCity({ city: 'Taguig', state: 'Metro Manila', country: 'Philippines' }) === 'Taguig');
ok('Makati, Pasig and Quezon City stay as they are', ['Makati', 'Pasig', 'Quezon City'].every((c) => geo.pickCity({ city: c, region: 'Metro Manila' }) === c));
ok('a municipality reported as town or municipality is used', geo.pickCity({ town: 'Mandaue', state: 'Central Visayas' }) === 'Mandaue' && geo.pickCity({ municipality: 'Pateros' }) === 'Pateros');
ok('city wins over town and municipality', geo.pickCity({ city: 'Pasay', town: 'Other', municipality: 'Another' }) === 'Pasay');
ok('Metro Manila as the only city-like value is skipped for a finer one', geo.pickCity({ city: 'Metro Manila', suburb: 'Poblacion' }) === 'Poblacion');
ok('Las Vegas from the county alone (zoom 10 result)', geo.pickCity({ county: 'Clark County', state: 'Nevada', country: 'United States' }) === 'Las Vegas');
ok('Paradise, Nevada is shown as Las Vegas', geo.pickCity({ town: 'Paradise', county: 'Clark County', state: 'Nevada' }) === 'Las Vegas');
ok('Paradise somewhere else is left alone', geo.pickCity({ town: 'Paradise', county: 'Butte County', state: 'California' }) === 'Paradise');
ok('City of Las Vegas itself is unchanged', geo.pickCity({ city: 'Las Vegas', county: 'Clark County', state: 'Nevada' }) === 'Las Vegas');
ok('a county is only a last resort and loses the County suffix', geo.pickCity({ county: 'Orange County', state: 'California' }) === 'Orange');
ok('nothing usable gives Unknown', geo.pickCity({}) === 'Unknown' && geo.pickCity(null) === 'Unknown' && geo.pickCity(undefined) === 'Unknown');

// --- Metro hubs: members inside a metro match the hub, and nothing else does -----------------------------
const MANILA_METRO = ['Taguig', 'Makati', 'Pasig', 'Pasay', 'Quezon City', 'Mandaluyong', 'Parañaque', 'Muntinlupa', 'San Juan', 'Marikina', 'Caloocan', 'Las Piñas', 'Metro Manila'];
ok('every Metro Manila city matches the Manila hub', MANILA_METRO.every((c) => metro.cityInHub(c, 'Manila')));
ok('Manila matches itself', metro.cityInHub('Manila', 'Manila'));
ok('accents and case do not matter', metro.cityInHub('PARANAQUE', 'manila') && metro.cityInHub('las piñas', 'Manila'));
ok('Cebu hub matches Cebu City, Mandaue and Lapu-Lapu', ['Cebu City', 'Mandaue', 'Lapu-Lapu', 'Lapu Lapu', 'Cebu'].every((c) => metro.cityInHub(c, 'Cebu City')));
ok('the Cebu hub does not match Manila members and vice versa', !metro.cityInHub('Mandaue', 'Manila') && !metro.cityInHub('Taguig', 'Cebu City'));
ok('a city outside every metro matches only itself', metro.cityInHub('Baguio', 'Baguio') && !metro.cityInHub('Baguio', 'Manila') && !metro.cityInHub('Las Vegas', 'Manila'));
ok('empty input never matches', !metro.cityInHub('', 'Manila') && !metro.cityInHub('Taguig', '') && !metro.cityInHub(null, null));
ok('Bangkok, Jakarta and Kuala Lumpur hubs have members too', metro.cityInHub('Nonthaburi', 'Bangkok') && metro.cityInHub('Tangerang', 'Jakarta') && metro.cityInHub('Petaling Jaya', 'Kuala Lumpur'));
ok('metroHubOf names the hub', metro.metroHubOf('Taguig') === 'Manila' && metro.metroHubOf('Mandaue') === 'Cebu City' && metro.metroHubOf('Las Vegas') === null);
ok('hubPlaceNames starts with the hub and includes members', metro.hubPlaceNames('Manila')[0] === 'Manila' && metro.hubPlaceNames('Manila').includes('Taguig') && metro.hubPlaceNames('Nowhere').join() === 'Nowhere');

// --- Search box: the hub name finds its members, the member name finds only that city --------------------
ok('searching manila finds Taguig and Makati members', metro.placeMatchesQuery('Taguig', 'manila') && metro.placeMatchesQuery('Makati', 'Manila'));
ok('searching taguig finds only Taguig', metro.placeMatchesQuery('Taguig', 'taguig') && !metro.placeMatchesQuery('Makati', 'taguig'));
ok('searching manila does not find Cebu or Las Vegas members', !metro.placeMatchesQuery('Mandaue', 'manila') && !metro.placeMatchesQuery('Las Vegas', 'manila'));
ok('an empty search matches everyone', metro.placeMatchesQuery('Las Vegas', '   '));

// --- Moments: a profile in a metro lands on its hub's Moments city ----------------------------------------
ok('Taguig and Quezon City start Moments on Manila', sea.matchSeaCity('Taguig') === 'Manila' && sea.matchSeaCity('Quezon City') === 'Manila');
ok('Mandaue and Lapu-Lapu start Moments on Cebu', sea.matchSeaCity('Mandaue') === 'Cebu' && sea.matchSeaCity('Lapu-Lapu') === 'Cebu');
ok('existing matches are unchanged', sea.matchSeaCity('Cebu City') === 'Cebu' && sea.matchSeaCity('Saigon') === 'Ho Chi Minh City' && sea.matchSeaCity('Bangkok') === 'Bangkok');
ok('a place with no Southeast Asia match stays unmatched (no Manila default)', sea.matchSeaCity('Las Vegas') === null && sea.matchSeaCity('') === null && sea.matchSeaCity(null) === null);

console.log(`location: ${passed} passed, ${failures.length} failed`);
if (failures.length) {
  for (const f of failures) console.error('  FAIL ' + f);
  process.exit(1);
}
