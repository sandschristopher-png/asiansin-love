// CCBill webhook regression suite. Run: npm run billing:test
import { loadLib } from './lib/load-ts.mjs';

const ccb = await loadLib('billing/ccbill');
let passed = 0;
const failures = [];
const ok = (name, cond, detail = '') => (cond ? passed++ : failures.push(`${name}${detail ? ` -> ${detail}` : ''}`));

const NOW = new Date('2026-11-20T12:00:00Z');
const UUID = '6b86de5a-9988-4812-9eff-ff80fca42e1f';
const SECRET = 'test-secret-value-0123456789';
const ENV = {
  CCBILL_WEBHOOK_SECRET: SECRET,
  CCBILL_CLIENT_ACCNUM: '900000',
  CCBILL_CLIENT_SUBACC: '0001',
};
const q = (s) => new URLSearchParams(s);

// --- Parsing -------------------------------------------------------------------
{
  const form = ccb.parseCcbillBody(
    'application/x-www-form-urlencoded',
    'subscriptionId=111&transactionId=t1&X-userId=' + UUID,
    q('eventType=NewSaleSuccess&token=abc')
  );
  ok('form parses', form.ok === true);
  ok('form body fields', form.ok && form.fields.subscriptionId === '111' && form.fields['X-userId'] === UUID);
  ok('query fills eventType', form.ok && form.fields.eventType === 'NewSaleSuccess');
}
{
  const json = ccb.parseCcbillBody(
    'application/json; charset=utf-8',
    JSON.stringify({ subscriptionId: 222, transactionId: 't2', eventType: 'Refund' }),
    q('')
  );
  ok('json parses', json.ok === true);
  ok('json numbers become strings', json.ok && json.fields.subscriptionId === '222');
  ok('json body wins over query', ccb.parseCcbillBody('application/json', '{"eventType":"Void"}', q('eventType=Refund')).fields?.eventType === 'Void');
}
ok('bad json rejected', ccb.parseCcbillBody('application/json', '{nope', q('')).status === 400);
ok('json array rejected', ccb.parseCcbillBody('application/json', '[1,2]', q('')).status === 400);
ok('nested json rejected', ccb.parseCcbillBody('application/json', '{"a":{"b":1}}', q('')).status === 400);
ok('unsupported type rejected', ccb.parseCcbillBody('text/xml', '<a/>', q('')).status === 415);
ok('oversize body rejected', ccb.parseCcbillBody('application/x-www-form-urlencoded', 'x'.repeat(ccb.CCBILL_MAX_BODY_BYTES + 1), q('')).status === 413);

// --- Authentication (fails closed) ---------------------------------------------
const base = { clientAccnum: '900000', clientSubacc: '0001' };
ok('unconfigured fails closed', ccb.verifyCcbillRequest(q('token=' + SECRET), base, {}).status === 503);
ok('partial config fails closed', ccb.verifyCcbillRequest(q('token=' + SECRET), base, { CCBILL_WEBHOOK_SECRET: SECRET }).status === 503);
ok('missing token rejected', ccb.verifyCcbillRequest(q(''), base, ENV).status === 401);
ok('wrong token rejected', ccb.verifyCcbillRequest(q('token=nope'), base, ENV).status === 401);
ok('wrong account rejected', ccb.verifyCcbillRequest(q('token=' + SECRET), { ...base, clientAccnum: '1' }, ENV).status === 401);
ok('wrong sub-account rejected', ccb.verifyCcbillRequest(q('token=' + SECRET), { ...base, clientSubacc: '9' }, ENV).status === 401);
ok('valid request accepted', ccb.verifyCcbillRequest(q('token=' + SECRET), base, ENV).ok === true);

// --- Dedupe key and event time -------------------------------------------------
ok('key from transactionId', ccb.ccbillEventKey({ eventType: 'NewSaleSuccess', transactionId: 'T9' }) === 'NewSaleSuccess:tx:T9');
ok('key from subscription and timestamp', ccb.ccbillEventKey({ eventType: 'Cancellation', subscriptionId: '5', timestamp: '2026-11-20 10:00:00' }) === 'Cancellation:sub:5:2026-11-20 10:00:00');
ok('no key without identifiers', ccb.ccbillEventKey({ eventType: 'Refund' }) === null);
ok('no key without event type', ccb.ccbillEventKey({ transactionId: 'T9' }) === null);
ok('event time parsed as UTC', ccb.ccbillEventTime({ timestamp: '2026-11-20 10:00:00' }, NOW).toISOString() === '2026-11-20T10:00:00.000Z');
ok('event time falls back to now', ccb.ccbillEventTime({ timestamp: 'garbage' }, NOW).getTime() === NOW.getTime());

// --- Effects -------------------------------------------------------------------
const future = '2026-12-20 00:00:00';
const grant = ccb.decideEffect({ eventType: 'NewSaleSuccess', subscriptionId: '7', nextRenewalDate: future }, NOW);
ok('new sale grants', grant.kind === 'grant' && grant.subscriptionId === '7');
ok('new sale period end from renewal date', grant.kind === 'grant' && grant.periodEnd.toISOString() === '2026-12-20T00:00:00.000Z');
ok('renewal grants', ccb.decideEffect({ eventType: 'RenewalSuccess', subscriptionId: '7' }, NOW).kind === 'grant');
ok('upgrade grants', ccb.decideEffect({ eventType: 'UpgradeSuccess', subscriptionId: '8' }, NOW).kind === 'grant');
ok('reactivation grants', ccb.decideEffect({ eventType: 'UserReactivation', subscriptionId: '7' }, NOW).kind === 'grant');
ok('old Upgrades name is ignored', ccb.decideEffect({ eventType: 'Upgrades', subscriptionId: '8' }, NOW).kind === 'ignore');
ok('cancellation keeps access', ccb.decideEffect({ eventType: 'Cancellation', subscriptionId: '7' }, NOW).kind === 'cancel');
ok('expiration revokes as expired', ccb.decideEffect({ eventType: 'Expiration', subscriptionId: '7' }, NOW).status === 'expired');
ok('chargeback revokes', ccb.decideEffect({ eventType: 'Chargeback', subscriptionId: '7' }, NOW).status === 'chargeback');
ok('refund revokes', ccb.decideEffect({ eventType: 'Refund', subscriptionId: '7' }, NOW).status === 'refunded');
ok('void revokes', ccb.decideEffect({ eventType: 'Void', subscriptionId: '7' }, NOW).status === 'voided');
ok('failed renewal is ignored', ccb.decideEffect({ eventType: 'RenewalFailure', subscriptionId: '7' }, NOW).kind === 'ignore');
ok('grant without subscription is ignored', ccb.decideEffect({ eventType: 'NewSaleSuccess' }, NOW).kind === 'ignore');
ok('unknown event is ignored', ccb.decideEffect({ eventType: 'Something' }, NOW).kind === 'ignore');

// --- Period end fallback -------------------------------------------------------
const fallback = ccb.nextPeriodEnd(undefined, NOW);
ok('missing renewal date uses fallback', fallback.getTime() - NOW.getTime() === ccb.FALLBACK_PERIOD_DAYS * 86400000);
ok('past renewal date uses fallback', ccb.nextPeriodEnd('2020-01-01 00:00:00', NOW).getTime() > NOW.getTime());

// --- Pass-through member id ----------------------------------------------------
ok('pass-through UUID read', ccb.passThroughUserId({ 'X-userId': UUID }) === UUID);
ok('pass-through lowercase key read', ccb.passThroughUserId({ 'x-userId': UUID }) === UUID);
ok('pass-through non-UUID rejected', ccb.passThroughUserId({ 'X-userId': 'bob' }) === null);
ok('pass-through missing', ccb.passThroughUserId({}) === null);

console.log(`ccbill: ${passed} passed, ${failures.length} failed`);
if (failures.length) {
  for (const f of failures) console.error('  FAIL ' + f);
  process.exit(1);
}
