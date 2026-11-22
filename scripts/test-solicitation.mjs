// Anti-solicitation filter and strike rules for public text. Run: npm run solicitation:test
import { loadLib } from './lib/load-ts.mjs';

const f = await loadLib('moderation/solicitationFilter');
let passed = 0;
const failures = [];
const ok = (name, cond) => (cond ? passed++ : failures.push(name));
const hit = (text) => f.detectSolicitation(text).hit;

// --- transactional dating -------------------------------------------------------------------------------------
for (const t of [
  'Looking for a provider mindset only',
  'p.r.o.v.i.d.e.r mindset please',
  'seeking a generous man',
  'looking for a generous partner who can spoil me',
  'monthly allowance please',
  'sugar daddy wanted',
  'Sugar baby here',
  'sd or sb',
  'sd/sb welcome',
  'mutually beneficial arrangement',
  'a sugar arrangement',
  'financial support needed',
  'pamper me',
  'paypig and findom welcome',
]) ok(`blocks: ${t}`, hit(t));

// --- bills and money requests -------------------------------------------------------------------------------------
for (const t of [
  'help with bills',
  'Can you help with rent?',
  'need help with school fees',
  'I need to pay tuition, please send help',
  'hospital bill is due, need support',
  'emergency money',
  'send money',
  'pang-load',
  'pang gastos',
]) ok(`blocks: ${t}`, hit(t));

// --- payment rails ----------------------------------------------------------------------------------------------
for (const t of ['g-c-a-s-h me', 'g.c.a.s.h', 'paymaya', 'remitly', 'western union', 'moneygram', 'cashapp', 'venmo', 'zelle', 'paypal', 'usdt', 'binance', 'send crypto to my wallet', 'send via wise', 'my wise account'])
  ok(`blocks: ${t}`, hit(t));

// --- ordinary language is left alone --------------------------------------------------------------------------
for (const t of [
  'My name is Maya',
  'That is a wise choice',
  'I like coffee with no sugar',
  'My internet provider is slow',
  'I work as a healthcare provider',
  'My dad is a generous man',
  'Flower arrangement is my hobby',
  'My sd card is full',
  'Tuition at my school is expensive',
  'I read about crypto in the news',
  'I love spoiling my dog',
  'Looking for someone kind, funny and ready for something real',
  'Coffee, hiking and street food on weekends',
]) ok(`allows: ${t}`, !hit(t));

ok('empty text is clean', !hit('') && !hit('   ') && !hit(null));
ok('terms are reported without the member text', f.detectSolicitation('looking for a generous man').terms.includes('generous man'));

// --- strikes ------------------------------------------------------------------------------------------------------
const s1 = f.nextStrike(0, 100);
ok('strike 1: warning, -15, still active', s1.strikes === 1 && s1.reputation === 85 && s1.visibility === 'active' && s1.lockHours === 0);
const s2 = f.nextStrike(1, 85);
ok('strike 2: -35 more (50 in all), held for 24h', s2.strikes === 2 && s2.reputation === 50 && s2.visibility === 'held' && s2.lockHours === 24);
const s3 = f.nextStrike(2, 50);
ok('strike 3: reputation 0, banned', s3.strikes === 3 && s3.reputation === 0 && s3.visibility === 'banned');
ok('strike 4 stays banned', f.nextStrike(3, 0).visibility === 'banned' && f.nextStrike(3, 0).strikes === 4);
ok('reputation never goes below zero', f.nextStrike(0, 10).reputation === 0 && f.nextStrike(1, 20).reputation === 0);
ok('a fresh member from 100 totals -50 after two strikes', f.nextStrike(1, f.nextStrike(0, 100).reputation).reputation === 50);
ok('messages exist for each strike', Object.keys(f.STRIKE_MESSAGES).length === 3 && f.STRIKE_MESSAGES[1].startsWith('Wrong platform'));

// --- who is hidden -----------------------------------------------------------------------------------------------
const now = Date.parse('2026-11-30T12:00:00Z');
ok('active profiles show', f.isHiddenFromFeeds({ visibility_status: 'active' }, now) === false && f.isHiddenFromFeeds({}, now) === false);
ok('banned profiles are always hidden', f.isHiddenFromFeeds({ visibility_status: 'banned' }, now) === true);
ok('a held profile is hidden while the hold runs', f.isHiddenFromFeeds({ visibility_status: 'held', edit_locked_until: '2026-12-01T10:00:00Z' }, now) === true);
ok('and shows again once it has run out', f.isHiddenFromFeeds({ visibility_status: 'held', edit_locked_until: '2026-11-30T11:00:00Z' }, now) === false);

console.log(`solicitation: ${passed} passed, ${failures.length} failed`);
if (failures.length) {
  for (const x of failures) console.error('  FAIL ' + x);
  process.exit(1);
}
