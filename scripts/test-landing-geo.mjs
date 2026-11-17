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

// Auth hero audience: Southeast Asia reads "from" + Western countries, everyone else "in" + Southeast Asian cities
const geo = await loadLib('geoCities');
const aud = (code, params) => geo.resolveHeroAudience(code, params);
for (const c of ['PH', 'TH', 'VN', 'ID', 'MY', 'KH', 'SG', 'LA', 'BN', 'MM', 'TL']) ok('Southeast Asian visitor (' + c + ') sees Western places', aud(c) === 'asian');
for (const c of ['US', 'GB', 'AU', 'CA', 'DE', 'NO', 'NZ', 'FR']) ok('Western visitor (' + c + ') sees Southeast Asian cities', aud(c) === 'western');
ok('no country (local dev) shows the city roster', aud(null) === 'western' && aud('') === 'western');
ok('lower-case country code works', aud('ph') === 'asian');
ok('?geo=US forces the city roster from the Philippines', aud('PH', { geo: 'US' }) === 'western');
ok('?geo=TH forces the country roster from the US', aud('US', { geo: 'TH' }) === 'asian');
ok('?geo=asia and ?geo=sea force each roster', aud('US', { geo: 'asia' }) === 'asian' && aud('PH', { geo: 'sea' }) === 'western' && aud('PH', { target: 'asia' }) === 'western');
ok('the western roster is Southeast Asia only', geo.WESTERN_AUDIENCE_CITIES.length > 5 && !geo.WESTERN_AUDIENCE_CITIES.some((c) => /tokyo|seoul|osaka|new york|london/i.test(c)));
ok('the asian roster is Western countries only', geo.ASIAN_AUDIENCE_COUNTRIES.includes('United States') && !geo.ASIAN_AUDIENCE_COUNTRIES.some((c) => /philippines|thailand|vietnam|indonesia|malaysia|cambodia|singapore/i.test(c)));
ok('visitorCountry reads the edge headers in order', geo.visitorCountry(new Headers({ 'cf-ipcountry': 'PH', 'x-vercel-ip-country': 'US' })) === 'US' && geo.visitorCountry(new Headers({ 'x-country-code': 'th' })) === 'TH' && geo.visitorCountry(new Headers({ 'cf-ipcountry': 'XX' })) === null);

console.log(`Landing geo: ${passed} passed, ${failures.length} failed`);
if (failures.length) {
  for (const f of failures) console.error(' FAIL ' + f);
  process.exit(1);
}
