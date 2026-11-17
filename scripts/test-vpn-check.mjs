// VPN / proxy / Tor / datacenter detection regression suite. Run: npm run vpn:test
// Simulates a clean residential IP, a datacenter / Tor IP and a consumer VPN, plus provider
// timeouts and rate limits, and prints the reputation delta each connection produces.
import { loadLib } from './lib/load-ts.mjs';

const v = await loadLib('safety/vpnCheck');
const { getClientIp, isPrivateIp, tierFromIpInfo, networkGate, networkPenalty, canProvePresence, fetchIpInfo, lookupIp, assessNetwork, recordNetworkRisk, clearVpnCaches, HIGH_RISK_PENALTY } = v;

// AbortSignal.timeout timers are unref'd, so a fake fetch that only waits for the abort would let Node exit early.
const keepAlive = setInterval(() => {}, 1000);

let passed = 0;
const failures = [];
const rows = [];
const ok = (name, cond, detail = '') => (cond ? passed++ : failures.push(`${name}${detail ? ` -> ${detail}` : ''}`));
const H = (obj) => new Headers(obj);

// --- Client IP extraction ------------------------------------------------------------------
ok('Vercel: first public forwarded hop', getClientIp(H({ 'x-forwarded-for': '203.0.113.5, 76.76.21.1' }), { vercel: true }) === '203.0.113.5');
ok('Vercel: x-vercel-forwarded-for wins', getClientIp(H({ 'x-vercel-forwarded-for': '198.51.100.7', 'x-forwarded-for': '203.0.113.5' }), { vercel: true }) === '198.51.100.7');
ok('Vercel: a client-sent cf-connecting-ip is ignored', getClientIp(H({ 'cf-connecting-ip': '1.2.3.4', 'x-forwarded-for': '203.0.113.9' }), { vercel: true }) === '203.0.113.9');
ok('Cloudflare (not Vercel): cf-connecting-ip is used', getClientIp(H({ 'cf-connecting-ip': '1.2.3.4', 'x-forwarded-for': '203.0.113.9' }), { vercel: false }) === '1.2.3.4');
ok('private hops are skipped', getClientIp(H({ 'x-forwarded-for': '10.0.0.5, 192.168.1.2, 203.0.113.44' }), { vercel: true }) === '203.0.113.44');
ok('local dev yields null, not a bogus IP', getClientIp(H({ 'x-forwarded-for': '127.0.0.1, ::1' }), { vercel: true }) === null);
ok('Tailscale / CGNAT range is private', isPrivateIp('100.64.12.1') && isPrivateIp('100.127.0.9') && !isPrivateIp('100.128.0.1'));
ok('WireGuard / LAN / link-local are private', isPrivateIp('10.8.0.2') && isPrivateIp('172.16.5.1') && isPrivateIp('169.254.1.1') && !isPrivateIp('172.32.0.1'));
ok('IPv6 loopback, ULA and mapped private are private', isPrivateIp('::1') && isPrivateIp('fd12:3456::1') && isPrivateIp('::ffff:10.1.2.3') && isPrivateIp('fe80::1'));
ok('public IPv6 is public', !isPrivateIp('2001:db8::1'));
ok('no headers yields null', getClientIp(H({}), { vercel: true }) === null);

// --- Tiers -------------------------------------------------------------------------------------
const info = (o = {}) => ({ isVpn: false, isProxy: false, isTor: false, isDatacenter: false, isAbuser: false, asn: 7552, org: 'Viettel', country: 'VN', ...o });
ok('residential is clean', tierFromIpInfo(info()) === 'clean');
ok('plain datacenter is high risk', tierFromIpInfo(info({ isDatacenter: true })) === 'high');
ok('Tor is high risk', tierFromIpInfo(info({ isTor: true })) === 'high');
ok('open proxy is high risk', tierFromIpInfo(info({ isProxy: true })) === 'high');
ok('flagged abuser is high risk', tierFromIpInfo(info({ isAbuser: true })) === 'high');
ok('a consumer VPN on a datacenter ASN is a VPN, not a scammer', tierFromIpInfo(info({ isVpn: true, isDatacenter: true })) === 'vpn');

// --- Gates and penalties --------------------------------------------------------------------
const gate = (tier, verified = false, trusted = false) => networkGate(tier, { verified, trusted });
ok('clean is never gated', gate('clean') === null && gate('unknown') === null);
ok('unverified on a VPN must verify', gate('vpn')?.code === 'NETWORK_VERIFICATION_REQUIRED');
ok('verified on a VPN is not gated', gate('vpn', true) === null);
ok('unverified on a high-risk network is restricted', gate('high')?.code === 'NETWORK_RESTRICTED');
ok('verified on a high-risk network can still message', gate('high', true) === null);
ok('trusted accounts are never gated', gate('high', false, true) === null && gate('vpn', false, true) === null);
ok('penalty: high -15, vpn 0, clean 0, trusted 0', networkPenalty('high', false) === 15 && networkPenalty('vpn', false) === 0 && networkPenalty('clean', false) === 0 && networkPenalty('high', true) === 0);
ok('a VPN or datacenter cannot prove presence in a city', !canProvePresence('vpn', false) && !canProvePresence('high', false) && canProvePresence('clean', false) && canProvePresence('unknown', false) && canProvePresence('vpn', true));

// --- Lookup, fail-open and caching ---------------------------------------------------------
const reply = (body, status = 200) => async () => ({ ok: status < 400, status, json: async () => body });
const RESIDENTIAL = { is_vpn: false, is_proxy: false, is_tor: false, is_datacenter: false, asn: { asn: 7552 }, company: { name: 'Viettel' }, location: { country_code: 'vn' } };
const DATACENTER = { is_vpn: false, is_proxy: false, is_tor: false, is_datacenter: true, asn: { asn: 16509 }, company: { name: 'Amazon' }, location: { country_code: 'ng' } };
const TOR = { is_tor: true, is_datacenter: true, asn: { asn: 4224 }, company: { name: 'Tor exit' }, location: { country_code: 'de' } };
const CONSUMER_VPN = { is_vpn: true, is_datacenter: true, asn: { asn: 9009 }, company: { name: 'M247' }, location: { country_code: 'ph' } };

clearVpnCaches();
const parsed = await fetchIpInfo('203.0.113.1', { fetchImpl: reply(RESIDENTIAL) });
ok('provider response is parsed', parsed?.asn === 7552 && parsed.org === 'Viettel' && parsed.country === 'VN');

const timeoutFetch = (_url, init) => new Promise((_res, rej) => init.signal.addEventListener('abort', () => rej(new Error('The operation timed out'))));
let threw = false;
let timedOut = null;
try {
  timedOut = await fetchIpInfo('203.0.113.2', { fetchImpl: timeoutFetch, timeoutMs: 40 });
} catch {
  threw = true;
}
ok('a provider timeout never throws', !threw);
ok('a provider timeout fails open (null result)', timedOut === null);
ok('a rate limit (429) fails open', (await fetchIpInfo('203.0.113.3', { fetchImpl: reply({}, 429) })) === null);
ok('an invalid body fails open', (await fetchIpInfo('203.0.113.4', { fetchImpl: async () => ({ ok: true, status: 200, json: async () => { throw new Error('bad json'); } }) })) === null);

// memory cache: a second lookup does not call the provider
clearVpnCaches();
let calls = 0;
const counting = async () => (calls++, { ok: true, status: 200, json: async () => RESIDENTIAL });
await lookupIp('203.0.113.50', { fetchImpl: counting });
const second = await lookupIp('203.0.113.50', { fetchImpl: counting });
ok('second lookup comes from memory without a provider call', calls === 1 && second.source === 'memory');

// Supabase cache: 24 hours per IP
const fakeDb = (tables = {}) => {
  const written = [];
  const rpcs = [];
  const db = {
    written,
    rpcs,
    from: (table) => ({
      select: () => ({ eq: (_c, value) => ({ maybeSingle: async () => ({ data: (tables[table] || {})[value] ?? null }) }) }),
      upsert: async (row) => {
        written.push({ table, row });
        tables[table] = { ...(tables[table] || {}), [row.user_id ?? row.ip]: row };
        return { error: null };
      },
    }),
    rpc: async (name, args) => (rpcs.push({ name, args }), { error: null }),
  };
  return db;
};
const hour = 3600 * 1000;
clearVpnCaches();
{
  const now = Date.now();
  const fresh = { ip: '203.0.113.60', is_vpn: false, is_proxy: false, is_tor: false, is_datacenter: true, is_abuser: false, asn: 16509, org: 'Amazon', country_code: 'NG', checked_at: new Date(now - 2 * hour).toISOString() };
  let n = 0;
  const f = async () => (n++, { ok: true, status: 200, json: async () => RESIDENTIAL });
  const r = await lookupIp('203.0.113.60', { db: fakeDb({ ip_reputation_cache: { '203.0.113.60': fresh } }), fetchImpl: f, now });
  ok('a 2 hour old cached row is used (no provider call)', n === 0 && r.source === 'cache' && r.info?.isDatacenter === true);
  clearVpnCaches();
  const stale = { ...fresh, checked_at: new Date(now - 25 * hour).toISOString() };
  const db = fakeDb({ ip_reputation_cache: { '203.0.113.60': stale } });
  const r2 = await lookupIp('203.0.113.60', { db, fetchImpl: f, now });
  ok('a 25 hour old row is refreshed and written back', n === 1 && r2.source === 'lookup' && db.written.some((w) => w.table === 'ip_reputation_cache'));
}

// --- End to end: assessNetwork + recordNetworkRisk, with printed deltas ---------------------
const reqHeaders = (ip, country) => H({ 'x-forwarded-for': ip, 'x-vercel-ip-country': country });
const scenario = async (label, ip, body, { verified = false, trusted = false, declared = 'PH', fetchImpl } = {}) => {
  clearVpnCaches();
  const db = fakeDb({ trusted_members: trusted ? { u1: { user_id: 'u1' } } : {} });
  const a = await assessNetwork(reqHeaders(ip, 'PH'), { userId: 'u1', db, vercel: true, fetchImpl: fetchImpl ?? reply(body) });
  let alerts = 0;
  const rec = await recordNetworkRisk(db, 'u1', a, { event: 'message', declaredCountry: declared, onAlert: () => alerts++ });
  const g = networkGate(a.tier, { verified, trusted: a.trusted });
  const delta = db.rpcs.reduce((n, c) => n + c.args.p_deduction, 0);
  rows.push([label, a.tier, a.checked ? 'yes' : 'no', `-${delta}`, g ? g.code : 'open', rec.mismatch ? 'mismatch logged' : '']);
  return { a, rec, g, delta, db, alerts };
};

{
  const s = await scenario('clean residential IP', '203.0.113.70', RESIDENTIAL, { declared: 'VN' });
  ok('residential: tier clean, is_vpn false, 0 penalty, nothing recorded, not gated', s.a.tier === 'clean' && s.delta === 0 && s.db.written.filter((w) => w.table === 'member_ip_flags').length === 0 && s.g === null);
}
{
  const s = await scenario('datacenter IP in Lagos, unverified', '203.0.113.71', DATACENTER, { declared: 'PH' });
  ok('datacenter: tier high, -15, spoof flag recorded, messaging gated, staff alerted', s.a.tier === 'high' && s.delta === HIGH_RISK_PENALTY && s.rec.mismatch && s.g?.code === 'NETWORK_RESTRICTED' && s.alerts === 1);
  const flag = s.db.written.find((w) => w.table === 'member_ip_flags')?.row;
  ok('flag row carries ASN, organisation and the country mismatch', flag?.asn === 16509 && flag?.org === 'Amazon' && flag?.ip_country === 'NG' && flag?.declared_country === 'PH' && flag?.country_mismatch === true);
}
{
  const s = await scenario('Tor exit node, verified member', '203.0.113.72', TOR, { verified: true, declared: 'PH' });
  ok('Tor: high tier, -15, but a verified member is not blocked from messaging', s.a.tier === 'high' && s.delta === 15 && s.g === null);
}
{
  const s = await scenario('consumer VPN on a Manila exit, unverified', '203.0.113.73', CONSUMER_VPN, { declared: 'PH' });
  ok('consumer VPN: no penalty, never banned, asked to verify before messaging', s.a.tier === 'vpn' && s.delta === 0 && s.g?.code === 'NETWORK_VERIFICATION_REQUIRED');
  ok('consumer VPN: cannot prove presence in a city', !canProvePresence(s.a.tier, s.a.trusted));
  ok('consumer VPN: still logged for the Admin Console', s.db.written.some((w) => w.table === 'member_ip_flags' && w.row.tier === 'vpn'));
}
{
  const s = await scenario('admin / trusted account on a datacenter IP', '203.0.113.74', DATACENTER, { trusted: true });
  ok('trusted: never penalised, flagged or gated', s.a.trusted && s.a.tier === 'clean' && s.delta === 0 && s.g === null && s.db.written.length === 0);
}
{
  const s = await scenario('provider timeout', '203.0.113.75', null, { fetchImpl: timeoutFetch });
  ok('timeout: no crash, fails open (unknown tier, not gated, no penalty)', s.a.tier === 'unknown' && s.a.checked === false && s.g === null && s.delta === 0);
}
{
  const s = await scenario('provider rate limited (429)', '203.0.113.76', {}, { fetchImpl: reply({}, 429) });
  ok('429: fails open', s.a.tier === 'unknown' && s.g === null && s.delta === 0);
}
{
  const s = await scenario('local development (no public IP)', '127.0.0.1', RESIDENTIAL);
  ok('no public IP: nothing is checked and nothing is gated', s.a.ip === null && s.a.tier === 'unknown' && s.g === null);
}

// The high-risk penalty is applied once per 24 hours, not once per request
{
  clearVpnCaches();
  const db = fakeDb();
  const a = await assessNetwork(reqHeaders('203.0.113.80', 'PH'), { userId: 'u2', db, vercel: true, fetchImpl: reply(DATACENTER) });
  const first = await recordNetworkRisk(db, 'u2', a, { event: 'message', declaredCountry: 'PH' });
  const again = await recordNetworkRisk(db, 'u2', a, { event: 'message', declaredCountry: 'PH' });
  ok('penalty applies once per 24 hours', first.penalized && !again.penalized && db.rpcs.length === 1, `rpc calls ${db.rpcs.length}`);
  ok('penalty goes through the SECURITY DEFINER RPC', db.rpcs[0].name === 'apply_moderation_penalty' && db.rpcs[0].args.p_deduction === 15 && db.rpcs[0].args.p_category === 'ip_high_risk');
}

console.log('\nconnection'.padEnd(46), 'tier'.padEnd(8), 'checked'.padEnd(8), 'rep'.padEnd(6), 'messaging'.padEnd(34), 'note');
for (const [label, tier, checked, rep, gateCode, note] of rows) {
  console.log(String(label).padEnd(45), String(tier).padEnd(8), String(checked).padEnd(8), String(rep).padEnd(6), String(gateCode).padEnd(34), note);
}
clearInterval(keepAlive);
if (failures.length) {
  console.error(`\n${failures.length} failed, ${passed} passed\n` + failures.join('\n'));
  process.exit(1);
}
console.log(`\nvpn check: ${passed} checks passed`);
