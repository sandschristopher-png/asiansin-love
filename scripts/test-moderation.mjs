// Moderation regression suite: evasion cases must be caught, ordinary chat must pass.
// Run: node scripts/test-moderation.mjs
import { loadLib } from './lib/load-ts.mjs';

const { detectContactSharing, evaluateMessageModeration, evaluateBioModeration, normalizeForModeration } =
  await loadLib('moderation');

let passed = 0;
const failures = [];
function check(name, ok, detail = '') {
  if (ok) passed++;
  else failures.push(`${name}${detail ? ` -> ${detail}` : ''}`);
}

// --- Normalizer -------------------------------------------------------------
const n = normalizeForModeration('W​h-a-t-s-A-p-p  m3   n0w');
check('normalizer strips zero-width + collapses', n.collapsed.includes('whatsapp'), n.collapsed);
check('normalizer collapses whitespace', !/\s{2,}/.test(n.normalized), n.normalized);
check('normalizer leet map', normalizeForModeration('s3nd m0n3y').normalized === 'send money');
check('normalizer @ and $', normalizeForModeration('$ugar d@ddy').normalized === 'sugar daddy');
check('normalizer fullwidth (NFKC)', normalizeForModeration('ｗｈａｔｓａｐｐ').normalized === 'whatsapp');

// --- Contact sharing: must be detected ------------------------------------------
const contactCases = [
  ['plain whatsapp', 'add me on whatsapp', false],
  ['plain phone', 'my number 0917 123 4567', false],
  ['intl phone', 'text me +63 917 555 1234 ok', false],
  ['email', 'email me jenny.cruz@gmail.com', false],
  ['t.me link', 'join t.me/jennyc', false],
  ['wa.me link', 'wa.me/639171234567', false],
  ['my ig is', 'my ig is jenny_travels', false],
  ['ig colon', 'ig: jenny.travels', false],
  ['line id', 'my line id is jen88', false],
  ['call me at', 'call me at 0917-555-1234', false],
  ['telegram', 'are you on telegram?', false],
  ['hyphen split', 'w-h-a-t-s-a-p-p me', true],
  ['dot split', 't.e.l.e.g.r.a.m', true],
  ['spaced letters', 'find me on w h a t s a p p', true],
  ['zero width', 'what​sapp', true],
  ['leet', 'wh@ts@pp m3', true],
  ['leet telegram', 'te1egr4m', true],
  ['fullwidth', 'ｔｅｌｅｇｒａｍ', true],
  ['spelled digits', 'zero nine one seven five five five one two three four', true],
  ['mixed spelled digits', 'my number is nine one seven 555 1234', true],
  ['letters for digits', 'O9I7 555 I234', true],
  ['obfuscated email', 'jennyc at gmail dot com', true],
  ['zero-width phone', '0917​123​4567', true],
  ['symbol split platform', 'snap*chat me', true],
  ['dot spelled link', 't dot me/jenny', true],
];
for (const [name, text, evasion] of contactCases) {
  const r = detectContactSharing(text);
  check(`contact: ${name}`, r.detected, JSON.stringify(text));
  if (r.detected) check(`contact evasion flag: ${name}`, r.evasion === evasion, `expected evasion=${evasion}`);
}

// --- Contact sharing: must NOT be detected (false positives) ---------------------
const safeContact = [
  'Waiting in line for coffee this morning',
  'I got mixed signals from my last date',
  'We chat every evening after work',
  'Lets meet at 7:30 near the mall',
  'I am 25 years old and 5 4 tall',
  'I have lived in Manila since 2019 2020 was rough',
  'Prices went from 1000 - 2000 baht',
  'It cost 500 000 dong for dinner',
  'Can you lend me a hand moving next week?',
  'That was a long time ago honestly',
  'My line of work is nursing',
  'Call me at night if you want to talk here',
  'I love the vibe - really cozy place',
  'I have one son and two dogs',
  'My mom calls me at 7 every day',
  'The hotel egg breakfast was great',
];
for (const text of safeContact) {
  const r = detectContactSharing(text);
  check(`no contact: ${text}`, !r.detected, r.matches.join(', '));
}

// --- Scams / solicitation / harassment: must be flagged ----------------------------
const flagged = [
  ['send money', 'can you send me money for my rent', 'high', 'financial_scam'],
  ['leet money', 's3nd m0n3y pls', 'high', 'financial_scam'],
  ['gift card', 'buy me itunes gift cards', 'high', 'financial_scam'],
  ['western union split', 'w e s t e r n u n i o n', 'high', 'financial_scam'],
  ['gcash request', 'gcash me 500 for load', 'high', 'financial_scam'],
  ['hospital', 'please help me pay the hospital bills', 'high', 'financial_scam'],
  ['lend money', 'lend me $200 please', 'high', 'financial_scam'],
  ['crypto', 'my uncle is a trader, invest in usdt for daily profit', 'high', 'crypto_scam'],
  ['bar fine', 'my bar fine is cheap', 'high', 'commercial_solicitation'],
  ['rate', "what's your rate for the night", 'high', 'commercial_solicitation'],
  ['onlyfans split', 'check my o-n-l-y-f-a-n-s', 'high', 'commercial_solicitation'],
  ['sugar daddy', 'looking for a sugar daddy', 'high', 'commercial_solicitation'],
  ['leet sugar', '$ugar d@ddy wanted', 'high', 'commercial_solicitation'],
  ['nudes', 'send nudes', 'high', 'explicit_request'],
  ['nudes leet', 's3nd nud3s', 'high', 'explicit_request'],
  ['slur', 'go home you chink', 'high', 'harassment_slur'],
  ['threat', 'i will kill you', 'high', 'harassment_threat'],
  ['wallet mention', 'do you use gcash there?', 'medium', 'wallet_mention'],
  ['insult', 'you are a whore', 'medium', 'harassment_insult'],
];
for (const [name, text, severity, category] of flagged) {
  const r = evaluateMessageModeration(text);
  check(`flag: ${name}`, r.highestSeverity === severity && r.violations.some((v) => v.category === category),
    `${JSON.stringify(text)} -> ${r.highestSeverity} ${r.violations.map((v) => v.category).join(',')}`);
}

// --- Ordinary chat: must stay clean -----------------------------------------------
const clean = [
  'Hi! How was your weekend in Cebu?',
  'I work in IT and love hiking on Sundays',
  'Not looking for a sugar daddy, just someone kind',
  'I want a happy ending to my love story',
  'There is a chink in his armor for sure',
  'Can you lend me a hand moving next week?',
  'I will escort you to the airport',
  'That was a long time ago honestly',
  'I am a nurse, my shift ends at 7:30',
  'I turned 28 last month and celebrated with family',
  'The visa fee for Thailand went up this year',
  'Maya is my best friend from college',
  'I studied trading history at university',
  'I would never hurt you',
  'We chat every evening after work',
  'Big cash prizes at the fiesta!',
  'Are you free on Saturday for coffee?',
];
for (const text of clean) {
  const r = evaluateMessageModeration(text);
  check(`clean: ${text}`, r.isClean, r.flaggedPhrases.join(', '));
}

// --- Bios ---------------------------------------------------------------------------
check('bio: contact rejected', !evaluateBioModeration('Add me on IG: jen.travels').ok);
check('bio: leet contact rejected', !evaluateBioModeration('wh@ts@pp me').ok);
check('bio: scam rejected', !evaluateBioModeration('Looking for a sponsor, send money').ok);
check('bio: normal bio ok', evaluateBioModeration('Nurse from Davao. I love beaches, karaoke and long talks. 5 2 and proud!').ok);

const total = passed + failures.length;
for (const f of failures) console.error('  FAIL', f);
console.log(`moderation: ${passed}/${total} passed (${((passed / total) * 100).toFixed(1)}%)`);
process.exit(failures.length === 0 ? 0 : 1);
