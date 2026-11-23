// Google Play Billing rules and the native sign-in return link. Run: npm run playbilling:test
import { loadLib } from './lib/load-ts.mjs';

const play = await loadLib('billing/googlePlay');
const api = await loadLib('billing/googlePlayApi');
const auth = await loadLib('nativeAuth');
const { SUPPORT_EMAIL } = await loadLib('support');

let passed = 0;
const failures = [];
const ok = (name, cond) => (cond ? passed++ : failures.push(name));

const NOW = new Date('2026-12-05T10:00:00Z');
const day = (n) => new Date(NOW.getTime() + n * 86_400_000).toISOString();
const ACCOUNT = await play.accountIdFor('00000000-0000-4000-8000-000000000001');
const sub = (over = {}) => ({
  subscriptionState: 'SUBSCRIPTION_STATE_ACTIVE',
  acknowledgementState: 'ACKNOWLEDGEMENT_STATE_PENDING',
  latestOrderId: 'GPA.1234-5678',
  lineItems: [{ productId: 'meetin_plus_3m', expiryTime: day(90) }],
  externalAccountIdentifiers: { obfuscatedExternalAccountId: ACCOUNT },
  ...over,
});
const want = { productId: 'meetin_plus_3m', accountId: ACCOUNT };

// Products
ok('three Plus subscriptions and one Boost consumable', play.PLAY_PRODUCTS.length === 4 && play.PLAY_PRODUCTS.filter((p) => p.kind === 'subscription').length === 3);
ok('each Plus plan has a product id', play.PLUS_PLAY_IDS['1m'] === 'meetin_plus_1m' && play.PLUS_PLAY_IDS['3m'] === 'meetin_plus_3m' && play.PLUS_PLAY_IDS['6m'] === 'meetin_plus_6m');
ok('a known product resolves, an unknown one does not', play.playProduct('meetin_plus_6m')?.plan === '6m' && play.playProduct('meetin_boost_1')?.kind === 'consumable' && play.playProduct('free_plus') === null && play.playProduct(5) === null);
ok('the package is the app id', play.PLAY_PACKAGE_NAME === 'asia.meetin.app');
ok('a plausible token passes; short, long and odd ones do not', play.isPlausibleToken('a'.repeat(40)) && !play.isPlausibleToken('short') && !play.isPlausibleToken('a'.repeat(3000)) && !play.isPlausibleToken('has space in it xxxxxxxxxx') && !play.isPlausibleToken(null));

// Obfuscated account id
const again = await play.accountIdFor('00000000-0000-4000-8000-000000000001');
const other = await play.accountIdFor('00000000-0000-4000-8000-000000000002');
ok('the account id is 64 hex characters and stable', /^[0-9a-f]{64}$/.test(ACCOUNT) && ACCOUNT === again);
ok('different members get different ids, and the id holds no raw member id', ACCOUNT !== other && !ACCOUNT.includes('00000000'));

// Subscriptions
let d = play.decideSubscription(sub(), want, NOW);
ok('an active subscription grants Plus until its expiry', d.ok && d.state === 'active' && d.expiresAt.toISOString() === day(90) && d.needsAck === true && d.orderId === 'GPA.1234-5678');
d = play.decideSubscription(sub({ acknowledgementState: 'ACKNOWLEDGEMENT_STATE_ACKNOWLEDGED' }), want, NOW);
ok('an acknowledged subscription needs no acknowledgement', d.ok && d.needsAck === false);
d = play.decideSubscription(sub({ subscriptionState: 'SUBSCRIPTION_STATE_CANCELED' }), want, NOW);
ok('a cancelled subscription keeps Plus until the paid period ends', d.ok && d.state === 'canceled' && d.expiresAt.toISOString() === day(90));
d = play.decideSubscription(sub({ subscriptionState: 'SUBSCRIPTION_STATE_CANCELED', lineItems: [{ productId: 'meetin_plus_3m', expiryTime: day(-1) }] }), want, NOW);
ok('a cancelled subscription past its end is expired', !d.ok && d.reason === 'expired');
d = play.decideSubscription(sub({ subscriptionState: 'SUBSCRIPTION_STATE_IN_GRACE_PERIOD', lineItems: [{ productId: 'meetin_plus_3m', expiryTime: day(-1) }] }), want, NOW);
ok('a grace period keeps Plus a day at a time', d.ok && d.state === 'grace' && d.expiresAt.getTime() === NOW.getTime() + 86_400_000);
d = play.decideSubscription(sub({ subscriptionState: 'SUBSCRIPTION_STATE_PENDING' }), want, NOW);
ok('a pending payment grants nothing yet', !d.ok && d.pending === true);
for (const [state, reason] of [['SUBSCRIPTION_STATE_EXPIRED', 'expired'], ['SUBSCRIPTION_STATE_ON_HOLD', 'on_hold'], ['SUBSCRIPTION_STATE_PAUSED', 'paused'], ['SUBSCRIPTION_STATE_SOMETHING_NEW', 'unknown_state']]) {
  d = play.decideSubscription(sub({ subscriptionState: state }), want, NOW);
  ok(`${state} is refused (${reason})`, !d.ok && !d.pending && d.reason === reason);
}
d = play.decideSubscription(sub({ lineItems: [{ productId: 'meetin_plus_1m', expiryTime: day(30) }] }), want, NOW);
ok('a token for a different product is refused', !d.ok && d.reason === 'wrong_product');
d = play.decideSubscription(sub({ externalAccountIdentifiers: { obfuscatedExternalAccountId: other } }), want, NOW);
ok("a token bought by another member's account is refused", !d.ok && d.reason === 'wrong_account');
d = play.decideSubscription(sub({ externalAccountIdentifiers: {} }), want, NOW);
ok('a token with no account id is refused', !d.ok && d.reason === 'wrong_account');
d = play.decideSubscription(sub({ lineItems: [{ productId: 'meetin_plus_3m' }] }), want, NOW);
ok('a subscription with no expiry is refused', !d.ok && d.reason === 'unknown_state');
ok('no answer from Google is refused', play.decideSubscription(null, want, NOW).ok === false);

// Boost
const prod = (over = {}) => ({ purchaseState: 0, consumptionState: 0, orderId: 'GPA.9', obfuscatedExternalAccountId: ACCOUNT, ...over });
let b = play.decideProduct(prod(), { accountId: ACCOUNT });
ok('a purchased Boost is granted and not yet consumed', b.ok && b.alreadyConsumed === false && b.orderId === 'GPA.9');
b = play.decideProduct(prod({ consumptionState: 1 }), { accountId: ACCOUNT });
ok('a consumed Boost is still ok (retry safe)', b.ok && b.alreadyConsumed === true);
b = play.decideProduct(prod({ purchaseState: 2 }), { accountId: ACCOUNT });
ok('a pending Boost waits', !b.ok && b.pending === true);
b = play.decideProduct(prod({ purchaseState: 1 }), { accountId: ACCOUNT });
ok('a cancelled Boost is refused', !b.ok && b.reason === 'canceled');
b = play.decideProduct(prod({ obfuscatedExternalAccountId: other }), { accountId: ACCOUNT });
ok("another member's Boost is refused", !b.ok && b.reason === 'wrong_account');
ok('no answer for a Boost is refused', play.decideProduct({}, { accountId: ACCOUNT }).ok === false);

// Service account key
const key = JSON.stringify({ client_email: 'play@project.iam.gserviceaccount.com', private_key: '-----BEGIN PRIVATE KEY-----\\nabc\\n-----END PRIVATE KEY-----\\n' });
ok('a plain JSON key is read', api.readServiceAccount({ GOOGLE_PLAY_SERVICE_ACCOUNT_JSON: key })?.client_email === 'play@project.iam.gserviceaccount.com');
ok('a base64 key is read, and escaped newlines are restored', api.readServiceAccount({ GOOGLE_PLAY_SERVICE_ACCOUNT_JSON: Buffer.from(key).toString('base64') })?.private_key.includes('\nabc\n') === true);
ok('a missing or broken key means not configured', api.readServiceAccount({}) === null && api.readServiceAccount({ GOOGLE_PLAY_SERVICE_ACCOUNT_JSON: 'not json' }) === null && api.readServiceAccount({ GOOGLE_PLAY_SERVICE_ACCOUNT_JSON: '{"a":1}' }) === null);

// Native Google / LINE sign-in return link
ok('the redirect is the app link', auth.NATIVE_AUTH_REDIRECT === 'asia.meetin.app://auth/callback');
let r = auth.parseNativeAuthUrl('asia.meetin.app://auth/callback?code=abc123');
ok('a return link with a code is read', r?.kind === 'code' && r.code === 'abc123');
r = auth.parseNativeAuthUrl('asia.meetin.app://auth/callback/?code=abc123&state=x');
ok('a trailing slash and extra parameters are fine', r?.kind === 'code' && r.code === 'abc123');
r = auth.parseNativeAuthUrl('asia.meetin.app://auth/callback?error=access_denied&error_description=User+cancelled');
ok('a provider error is read', r?.kind === 'error' && r.error === 'access_denied' && r.description === 'User cancelled');
ok('other schemes, hosts and paths are ignored', auth.parseNativeAuthUrl('https://meetin.asia/auth/callback?code=x') === null && auth.parseNativeAuthUrl('asia.meetin.app://evil/callback?code=x') === null && auth.parseNativeAuthUrl('asia.meetin.app://auth/other?code=x') === null && auth.parseNativeAuthUrl('other.app://auth/callback?code=x') === null);
ok('empty, broken and code-less links are ignored', auth.parseNativeAuthUrl('') === null && auth.parseNativeAuthUrl(null) === null && auth.parseNativeAuthUrl('not a url') === null && auth.parseNativeAuthUrl('asia.meetin.app://auth/callback') === null);
ok('an oversized code is ignored', auth.parseNativeAuthUrl(`asia.meetin.app://auth/callback?code=${'a'.repeat(3000)}`) === null);
ok('the code goes to /auth/callback with the page the member was heading to', auth.callbackPathFor({ kind: 'code', code: 'abc' }, '/moments') === '/auth/callback?code=abc&next=%2Fmoments');
ok('without a destination there is no next', auth.callbackPathFor({ kind: 'code', code: 'abc' }, null) === '/auth/callback?code=abc');
ok('an error goes to /auth/callback too', auth.callbackPathFor({ kind: 'error', error: 'access_denied', description: 'No' }, null) === '/auth/callback?error=access_denied&error_description=No');

// Support address
ok('support mail is help@meetin.asia', SUPPORT_EMAIL === 'help@meetin.asia');

console.log(`play billing: ${passed} passed, ${failures.length} failed`);
if (failures.length) {
  for (const f of failures) console.error('  FAIL ' + f);
  process.exit(1);
}
