// Master safety dictionary regression suite. Run: npm run safety:test
// Checks every category fires with the right reputation delta, obfuscation is collapsed, ordinary
// words stay clean, and the message decision + report rules apply the same numbers end to end.
import { readFileSync } from 'node:fs';
import { loadLib } from './lib/load-ts.mjs';

const { evaluateMasterSafety, CATEGORY_PENALTY } = await loadLib('safety/masterSafetyRules');
const { decideMessageOutcome } = await loadLib('reputation');
const { REPORT_REASONS, reportPenalty, reportExcerpt, reasonForCategory } = await loadLib('safety/reportRules');

let passed = 0;
const failures = [];
const rows = [];
const ok = (name, cond, detail = '') => (cond ? passed++ : failures.push(`${name}${detail ? ` -> ${detail}` : ''}`));

/** [text, expected categories (sorted), expected deduction] */
const POSITIVES = [
  // Category 3: financial
  ['Send to my GCash', [3], 20],
  ['send to my g-cash please', [3], 20],
  ['send to my g.c.a.s.h', [3], 20],
  ['My JazzCash number', [3], 20],
  ['transfer via Western Union', [3], 20],
  ['I need load', [3], 20],
  ['can you send money to my Dana account', [3], 20],
  ['ขอเงิน หน่อย', [3], 20],
  ['I need help, my mom is sick', [3], 20],
  // Category 1: solicitation
  ['Open BO Jakarta', [1], 25],
  ['open-bo?', [1], 25],
  ['v.c.s tonight', [1], 25],
  ['รับงานครับ', [1], 25],
  ['escort service available', [1], 25],
  ['I do short time, 500 php', [1], 25],
  ['my rate is 2000', [1], 25],
  ['gái gọi giá rẻ', [1], 25],
  ['looking for a sugar daddy', [1], 25],
  // Category 2: adult content selling
  ['Buy my OnlyFans', [2], 20],
  ['join my vip group, nude pics inside', [2], 20],
  ['check chaturbate', [2], 20],
  // Category 4: harassment, drugs
  ['go die', [4], 15],
  ['buy weed', [4], 15],
  ['ยาบ้า ราคาดี', [4], 15],
  ['you are a bitch', [4], 15],
  ['mail order bride', [4], 15],
  // Category 5: funneling (4 per distinct term)
  ['Add me on WhatsApp', [5], 8],
  ['w.h.a.t.s.a.p.p', [5], 4],
  ['message me on telegram', [5], 8],
  ['my wechat is jane', [5], 4],
  // Combinations
  ['send money to my gcash and open bo', [1, 3], 45],
  ['open bo, add me on whatsapp', [1, 5], 33],
  // Category 0: zero tolerance
  ["I'm 16yo", [0], 100],
  ['i am 17 years old', [0], 100],
  ['she is a minor', [0], 100],
  ['this is sextortion', [0], 100],
  ["I will blackmail you unless you send photos", [0], 100],
  ['bata pa ako', [0], 100],
  ['menor de edad', [0], 100],
  ['ผู้เยาว์', [0], 100],
  ['revenge porn', [0], 100],
  // Leetspeak and spacing
  ['0pen b0', [1], 25],
  ['wh4tsapp', [5], 4],
];

for (const [text, cats, deduction] of POSITIVES) {
  const v = evaluateMasterSafety(text);
  const good = JSON.stringify(v.categories) === JSON.stringify(cats) && v.deduction === deduction;
  ok(`positive: ${text}`, good, `got categories ${JSON.stringify(v.categories)} deduction ${v.deduction}`);
  rows.push([text, v.categories.join('+') || '-', `-${v.deduction}`, v.hardBlock ? 'HARD BLOCK' : '']);
}

const NEGATIVES = [
  'upload', 'download', 'I will upload the photos and download the app', 'short time ago', 'I saw her a short time ago',
  'escort you to dinner', 'ice coffee', 'ice water', 'rate the restaurant', 'long time no see', 'a longtime friend',
  'I have a minor issue with my phone', 'minor in psychology', '15 yrs experience in IT', 'I worked 17 years at the bank',
  'My friend Dana called me', 'Maya is my sister', 'I bought a plane ticket to Manila', 'Is the tuition fee high there?',
  'my kid gets an allowance', 'I want to puke', 'what a nice hotel', 'let us meet for dinner on Saturday', 'how was your day',
  'I teach high school students', 'I was a high school student once', 'we expose you to new things', 'deepfake videos are scary',
  'a tribute band played', 'I love the beach in Cebu', 'see you at 7:30 pm', 'the dam is near the lake',
];
for (const text of NEGATIVES) {
  const v = evaluateMasterSafety(text);
  ok(`clean: ${text}`, v.hits.length === 0, `matched ${JSON.stringify(v.terms)}`);
}

// Constants and ordering
ok('penalty table', CATEGORY_PENALTY[0] === 100 && CATEGORY_PENALTY[1] === 25 && CATEGORY_PENALTY[2] === 20 && CATEGORY_PENALTY[3] === 20 && CATEGORY_PENALTY[4] === 15 && CATEGORY_PENALTY[5] === 4);
ok('banner picks the lowest category', evaluateMasterSafety('send money to my gcash and open bo').banner === 'solicitation');
ok('banner for funneling', evaluateMasterSafety('Add me on WhatsApp').banner === 'off_platform');
ok('hard block has no banner', evaluateMasterSafety("I'm 16yo").banner === null);
ok('terms never empty on a hit', evaluateMasterSafety('Open BO Jakarta').terms.length > 0);

// What /api/messages does with each message (decideMessageOutcome), with the contact gate locked / unlocked
const decide = (text, unlocked = false) => decideMessageOutcome(text, unlocked);
const d = (name, text, unlocked, outcome, deduction, extra = {}) => {
  const r = decide(text, unlocked);
  ok(`decision: ${name}`, r.outcome === outcome && r.deduction === deduction && Object.entries(extra).every(([k, v]) => r[k] === v), `got ${r.outcome} -${r.deduction} ${JSON.stringify(r.safetyCategory)}`);
  rows.push([`[send] ${name}`, outcome, `-${r.deduction}`, r.safetyCategory ?? '']);
};
d('hard block', "I'm 16yo", false, 'hard_block', 100);
d('hard block even when unlocked', 'revenge porn', true, 'hard_block', 100);
d('funneling while locked is blocked, costs 4 per term', 'Add me on WhatsApp', false, 'soft_block', 8);
d('funneling after unlock is delivered with a banner, free', 'Add me on WhatsApp', true, 'deliver', 0, { safetyCategory: 'off_platform' });
d('dictionary-only financial hit is delivered with a banner', 'my wifi bill is due, can you help', true, 'deliver_with_warning', 20, { safetyCategory: 'financial' });
d('ordinary chat is clean', 'upload the photos, then ice coffee later', true, 'deliver', 0, { safetyCategory: null });

// Reports: immediate reputation hit, one report per (reporter, message)
ok('report reasons', REPORT_REASONS.length === 6);
ok('underage report is 100', reportPenalty('underage') === 100);
ok('other reports are 10', ['financial_scam', 'sex_solicitation', 'adult_content', 'inappropriate_content', 'off_platform_steering'].every((r) => reportPenalty(r) === 10));
ok('unknown reason falls back to 10', reportPenalty('whatever') === 10);
ok('excerpt is trimmed and capped', reportExcerpt('  hello   world  '.repeat(60)).length <= 300 && !/\s{2}/.test(reportExcerpt('a    b')));
ok('reason maps to the safety category', reasonForCategory('financial_scam') === 'financial' && reasonForCategory('sex_solicitation') === 'solicitation');
const migration = readFileSync(new URL('../supabase/migrations/20261122_safety_reports.sql', import.meta.url), 'utf8');
ok('migration dedupes per reporter and message', /unique\s*\(\s*reporter_id\s*,\s*message_id\s*\)/i.test(migration));
ok('migration keeps flags receiver-only', /message_safety_flags/.test(migration) && /receiver_id\s*=\s*auth\.uid\(\)/.test(migration));
ok('migration keeps freezes server-only', /create table if not exists public.account_freezes/.test(migration) && !/create policy[^;]*account_freezes/i.test(migration));

console.log('\ntext'.padEnd(52), 'category'.padEnd(10), 'rep'.padEnd(7), 'note');
for (const [text, cat, rep, note] of rows) console.log(String(text).slice(0, 50).padEnd(52), String(cat).padEnd(10), String(rep).padEnd(7), note);
if (failures.length) {
  console.error(`\n${failures.length} failed, ${passed} passed\n` + failures.join('\n'));
  process.exit(1);
}
console.log(`\nsafety rules: ${passed} checks passed`);
