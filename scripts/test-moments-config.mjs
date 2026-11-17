// Moments configuration regression suite. Run: npm run moments:test
// Keeps the database migration in step with the TypeScript lists (cities, vibes, prompts), and
// checks the GPS-to-city mapping, the signed location token and the daily prompt rotation.
import fs from 'node:fs';
import { loadLib } from './lib/load-ts.mjs';

const sea = await loadLib('seaLocations');
const mom = await loadLib('moments');
const loc = await loadLib('momentLocation');

let passed = 0;
const failures = [];
const ok = (name, cond, detail = '') => (cond ? passed++ : failures.push(`${name}${detail ? ` -> ${detail}` : ''}`));
const sameSet = (a, b) => a.length === b.length && [...a].sort().join('|') === [...b].sort().join('|');

const sql = fs.readFileSync('supabase/migrations/20261125_moments_vibes.sql', 'utf8');
const listAfter = (marker) => {
  const i = sql.indexOf(marker);
  const open = sql.indexOf('(', i);
  const close = sql.indexOf(')', open);
  return [...sql.slice(open, close).matchAll(/'((?:[^']|'')+)'/g)].map((m) => m[1].replace(/''/g, "'"));
};

// --- Migration lists equal the TypeScript lists ----------------------------------------------
ok('46 cities in the SEA list', sea.SEA_CITIES.length === 46, String(sea.SEA_CITIES.length));
ok('no duplicate cities', new Set(sea.SEA_CITIES).size === sea.SEA_CITIES.length);
ok('migration city check equals SEA_CITIES', sameSet(listAfter('check (city in'), sea.SEA_CITIES));
ok('migration vibe check equals VIBE_TAGS', sameSet(listAfter('check (vibe_tag is null or vibe_tag in'), mom.VIBE_TAGS));
ok('migration prompt check equals MOMENT_PROMPTS', sameSet(listAfter('check (prompt_question is null or prompt_question in'), mom.MOMENT_PROMPTS));
ok('every legacy activity tag maps to a valid vibe', Object.values(mom.LEGACY_ACTIVITY_VIBE).every((v) => mom.isVibeTag(v)));
for (const [from, to] of Object.entries(mom.LEGACY_ACTIVITY_VIBE)) ok(`migration backfills ${from} -> ${to}`, sql.includes(`when '${from}' then '${to}'`));
ok('the migration adds location_verified', /add column if not exists location_verified boolean not null default false/.test(sql));

// --- Locations ---------------------------------------------------------------------------------
ok('the 9 countries are all present', sea.SEA_LOCATIONS.map((l) => l.country).join(',') === 'Philippines,Thailand,Vietnam,Indonesia,Cambodia,Malaysia,Singapore,Laos,Brunei');
ok('countryOfCity', sea.countryOfCity('Chiang Mai') === 'Thailand' && sea.countryOfCity('Angeles / Clark') === 'Philippines' && sea.countryOfCity('Tokyo') === null);
ok('isSeaCity rejects Tokyo and Osaka', !sea.isSeaCity('Tokyo') && !sea.isSeaCity('Osaka') && sea.isSeaCity('Bandar Seri Begawan'));
ok('matchSeaCity aliases', sea.matchSeaCity('Cebu City') === 'Cebu' && sea.matchSeaCity('Saigon') === 'Ho Chi Minh City' && sea.matchSeaCity('manila, philippines') === 'Manila' && sea.matchSeaCity('Tokyo') === null && sea.matchSeaCity('') === null);

// --- GPS fix -> nearest city ---------------------------------------------------------------------
const near = (lat, lng) => sea.nearestSeaCity(lat, lng)?.city ?? null;
ok('central Manila', near(14.5547, 121.0244) === 'Manila');
ok('Canggu resolves to Bali', near(-8.6478, 115.1385) === 'Bali');
ok('Bangkok', near(13.7367, 100.5231) === 'Bangkok');
ok('Singapore, not Johor Bahru', near(1.2903, 103.8519) === 'Singapore');
ok('Johor Bahru', near(1.4655, 103.7578) === 'Johor Bahru');
ok('Tokyo is outside Southeast Asia', near(35.6762, 139.6503) === null);
ok('Los Angeles is outside Southeast Asia', near(34.0522, -118.2437) === null);
ok('the middle of the Pacific is outside', near(0, -160) === null);
ok('invalid coordinates are refused', near(NaN, 100) === null && near(91, 100) === null && near(10, 181) === null);

// --- Signed location token ---------------------------------------------------------------------
process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-service-role-secret';
const t0 = Date.now();
const tok = loc.signLocationToken('user-1', 'Manila', t0);
ok('token verifies for the same member and city', loc.verifyLocationToken(tok, 'user-1', 'Manila', t0 + 1000));
ok('token fails for another member', !loc.verifyLocationToken(tok, 'user-2', 'Manila', t0 + 1000));
ok('token fails for another city', !loc.verifyLocationToken(tok, 'user-1', 'Cebu', t0 + 1000));
ok('token expires after 15 minutes', !loc.verifyLocationToken(tok, 'user-1', 'Manila', t0 + loc.LOCATION_TOKEN_TTL_MS + 1));
const [payload, sig] = tok.split('.');
const forged = Buffer.from(JSON.stringify({ u: 'user-1', c: 'Cebu', e: t0 + 60000 })).toString('base64url');
ok('a rewritten payload fails', !loc.verifyLocationToken(`${forged}.${sig}`, 'user-1', 'Cebu', t0 + 1000));
ok('a damaged signature fails', !loc.verifyLocationToken(`${payload}.${sig.slice(0, -2)}xx`, 'user-1', 'Manila', t0 + 1000));
ok('garbage fails', !loc.verifyLocationToken('abc', 'user-1', 'Manila') && !loc.verifyLocationToken('', 'user-1', 'Manila'));
const keep = process.env.SUPABASE_SERVICE_ROLE_KEY;
process.env.SUPABASE_SERVICE_ROLE_KEY = '';
ok('no secret: nothing signs and nothing verifies', loc.signLocationToken('user-1', 'Manila') === null && !loc.verifyLocationToken(tok, 'user-1', 'Manila', t0 + 1000));
process.env.SUPABASE_SERVICE_ROLE_KEY = keep;

// --- Daily prompt rotation -----------------------------------------------------------------------
const d1 = new Date('2026-11-16T01:00:00Z');
const d2 = new Date('2026-11-16T23:00:00Z');
const d3 = new Date('2026-11-17T01:00:00Z');
ok('same prompt all day (UTC)', mom.promptOfDay(d1) === mom.promptOfDay(d2));
ok('the next day moves to the next prompt', mom.MOMENT_PROMPTS.indexOf(mom.promptOfDay(d3)) === (mom.MOMENT_PROMPTS.indexOf(mom.promptOfDay(d1)) + 1) % mom.MOMENT_PROMPTS.length);
const week = new Set(Array.from({ length: 5 }, (_, i) => mom.promptOfDay(new Date(d1.getTime() + i * 86_400_000))));
ok('5 days cover all 5 prompts', week.size === 5);

// --- Shared vibe ------------------------------------------------------------------------------------
ok('Coffee & Cafes shares Cafe Hopping', mom.sharesVibe(['Coffee & Cafes'], 'cafe_hopping'));
ok('Cooking & Food shares Street Food', mom.sharesVibe(['Cooking & Food'], 'street_food'));
ok('Beach & Ocean shares Beaches & Sunsets', mom.sharesVibe(['Beach & Ocean'], 'beach_sunset'));
ok('Fitness & Gym shares Gym & Walks', mom.sharesVibe(['Fitness & Gym'], 'fitness_wellness'));
ok('Nature Walks shares City Walks', mom.sharesVibe(['Nature Walks'], 'city_walks'));
ok('Entrepreneurship shares Remote Work', mom.sharesVibe(['Entrepreneurship'], 'remote_work'));
ok('Travel shares Weekend Trips', mom.sharesVibe(['Travel'], 'weekend_trips'));
ok('Art & Design shares Hidden Local Gems', mom.sharesVibe(['Art & Design'], 'local_gems'));
ok('unrelated interests do not match', !mom.sharesVibe(['Gaming', 'Faith & Church', 'Pets & Animals'], 'cafe_hopping'));
ok('no interests, no shared vibe', !mom.sharesVibe([], 'cafe_hopping'));
ok('"art" does not match inside another word', !mom.sharesVibe(['Smart Home'], 'local_gems'));

console.log(`Moments config: ${passed} checks passed${failures.length ? `, ${failures.length} FAILED` : ''}`);
for (const f of failures) console.log(`  FAIL ${f}`);
process.exit(failures.length ? 1 : 0);
