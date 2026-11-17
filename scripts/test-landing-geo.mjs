// Landing geo-routing regression suite. Run: npm run landing:test
import { loadLib } from './lib/load-ts.mjs';

const g = await loadLib('geoLanding');
let passed = 0;
const failures = [];
const ok = (name, cond) => (cond ? passed++ : failures.push(name));
const headers = (o) => (name) => o[name] ?? null;

ok('x-vercel-ip-country PH is the Philippines', g.isPhilippines(g.resolveCountry(headers({ 'x-vercel-ip-country': 'PH' }))));
ok('lower-case ph counts', g.isPhilippines(g.resolveCountry(headers({ 'x-vercel-ip-country': 'ph' }))));
ok('cf-ipcountry is used when vercel is absent', g.isPhilippines(g.resolveCountry(headers({ 'cf-ipcountry': 'PH' }))));
ok('x-country-code is the last resort', g.isPhilippines(g.resolveCountry(headers({ 'x-country-code': 'PH' }))));
ok('priority: vercel wins over cloudflare', !g.isPhilippines(g.resolveCountry(headers({ 'x-vercel-ip-country': 'US', 'cf-ipcountry': 'PH' }))));
ok('priority: cloudflare wins over x-country-code', g.isPhilippines(g.resolveCountry(headers({ 'cf-ipcountry': 'PH', 'x-country-code': 'US' }))));
ok('an unusable header falls through to the next', g.isPhilippines(g.resolveCountry(headers({ 'x-vercel-ip-country': '', 'cf-ipcountry': 'XX', 'x-country-code': 'PH' }))));
ok('no headers: not the Philippines', !g.isPhilippines(g.resolveCountry(headers({}))));
ok('another country is not the Philippines', !g.isPhilippines(g.resolveCountry(headers({ 'x-vercel-ip-country': 'TH' }))));
ok('?country=PH forces the PH page from abroad', g.isPhilippines(g.resolveCountry(headers({ 'x-vercel-ip-country': 'US' }), 'PH')));
ok('?country=US forces the global page from the Philippines', !g.isPhilippines(g.resolveCountry(headers({ 'x-vercel-ip-country': 'PH' }), 'US')));
ok('the override is case-insensitive and may be repeated', g.isPhilippines(g.resolveCountry(headers({}), ['ph', 'us'])));
ok('a junk override is ignored (headers decide)', g.isPhilippines(g.resolveCountry(headers({ 'x-vercel-ip-country': 'PH' }), 'banana')));
ok('an empty override is ignored', g.isPhilippines(g.resolveCountry(headers({ 'x-vercel-ip-country': 'PH' }), '')));
ok('cleanCountry rejects unknown and Tor codes', g.cleanCountry('XX') === null && g.cleanCountry('T1') === null && g.cleanCountry('PHL') === null);

console.log(`Landing geo: ${passed} passed, ${failures.length} failed`);
if (failures.length) {
  for (const f of failures) console.error(' FAIL ' + f);
  process.exit(1);
}
