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
const n = normalizeForModeration('W\u200bh-a-t-s-A-p-p  m3   n0w');
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
  ['zero width', 'what\u200bsapp', true],
  ['leet', 'wh@ts@pp m3', true],
  ['leet telegram', 'te1egr4m', true],
  ['fullwidth', 'ｔｅｌｅｇｒａｍ', true],
  ['spelled digits', 'zero nine one seven five five five one two three four', true],
  ['mixed spelled digits', 'my number is nine one seven 555 1234', true],
  ['letters for digits', 'O9I7 555 I234', true],
  ['obfuscated email', 'jennyc at gmail dot com', true],
  ['zero-width phone', '0917\u200b123\u200b4567', true],
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

// --- Translate button: only for non-English messages (lib/language.ts) -----------------
const { needsTranslation } = await loadLib('language');
const translateCases = [
  ['Kumusta ka na? Miss na kita', true],
  ['Ingat ka palagi po', true],
  ['Unsa imong ginabuhat karon?', true],
  ['Gwapa kaayo ka bitaw', true],
  ['Apa kabar sayang?', true],
  ['Sawasdee khrap, sabai dee mai?', true],
  ['Anh yeu em nhieu lam', true],
  ['Em ăn cơm chưa?', true],
  ['คิดถึงนะ', true],
  ['ok na ba?', true],
  ['Test', false],
  ['Hi', false],
  ['How was your day? 😊', false],
  ['I miss you so much', false],
  ['Do you speak Hindi or Tagalog?', false],
  ['Hey man, may I call you later?', false],
  ['Lang and Ilan are my cousins', false],
  ['See you at 7:30!', false],
  ['❤️👨‍👩‍👧', false],
];
for (const [text, expected] of translateCases) {
  check(`translate ${expected ? 'shown' : 'hidden'}: ${text}`, needsTranslation(text) === expected);
}

// --- Bio rule screen (lib/moderation/textFilter.ts) ----------------------------------
const { validateBio } = await loadLib('moderation/textFilter');
const bioRuleCases = [
  ['url', 'see https://mysite.com', 'link'],
  ['bare domain', 'visit jenny.love for more', 'link'],
  ['dot love', 'find me at jenny dot love', 'link'],
  ['[dot]', 'jenny[dot]com', 'link'],
  ['.ph domain', 'shop at mystore.ph', 'link'],
  ['whatsapp', 'message me on WhatsApp', 'messenger'],
  ['telegram', 'Telegram only', 'messenger'],
  ['tg handle', 'tg: jenny88', 'messenger'],
  ['line id', 'Line ID jen88', 'messenger'],
  ['wechat', 'add my wechat', 'messenger'],
  ['viber', 'viber me', 'messenger'],
  ['ig', 'IG jenny.travels', 'messenger'],
  ['fb', 'fb jenny cruz', 'messenger'],
  ['phone 7 digits', 'call 555 1234', 'phone'],
  ['+63', 'text +63 917', 'phone'],
  ['+66', '+66 81 234 5678', 'phone'],
  ['+1', '+1 415 555 0100', 'phone'],
  ['email', 'jenny.cruz@gmail.com', 'email'],
  ['gcash', 'send gcash pls', 'financial'],
  ['paypal', 'PayPal accepted', 'financial'],
  ['crypto', 'into crypto trading', 'financial'],
  ['usdt', 'USDT', 'financial'],
  ['allowance', 'looking for allowance', 'financial'],
  ['sponsor', 'need a sponsor', 'financial'],
];
for (const [name, text, category] of bioRuleCases) {
  const v = validateBio(text);
  check(`bio rule blocks ${name}`, !v.ok && v.category === category, JSON.stringify(v));
}
const bioRuleClean = [
  'I love cooking adobo for my family and travelling around Cebu.',
  'Nurse from Davao, 28, love the beach and karaoke nights.',
  'Looking for a kind, honest man who loves dogs. I am online most evenings.',
  'Born in 1995. Working in Bangkok since 2019.',
  'I have a Ph.D in biology and I enjoy line dancing.',
  '',
];
for (const text of bioRuleClean) {
  const v = validateBio(text);
  check(`bio rule allows: ${text.slice(0, 40)}`, v.ok, JSON.stringify(v));
}

// --- Profile moderator (lib/moderation/profileModerator.ts) ----------------------------------
const { moderateProfileText, penaltyFor } = await loadLib('moderation/profileModerator');
const profileCases = [
  // [name, text, expected violations, must contain in sanitized, must NOT contain in sanitized]
  ['phone digits', 'Call me 0917 123 4567 anytime', ['PHONE'], '[contact removed]', '4567'],
  ['phone intl', 'text +63 917 555 1234 ok', ['PHONE'], '[contact removed]', '1234'],
  ['phone spelled', 'zero nine one seven one two three four five six seven', ['PHONE'], '[contact removed]', 'seven'],
  ['url scheme', 'see https://jenny.example/x', ['URL'], '[link removed]', 'https'],
  ['domain', 'visit jenny.com tonight', ['URL'], '[link removed]', 'jenny.com'],
  ['dot com spelled', 'jenny dot com', ['URL'], '[link removed]', 'dot com'],
  ['ig handle', 'IG: @jen_92', ['HANDLE'], '[handle removed]', 'jen_92'],
  ['whatsapp handle', 'whatsapp jenny92 please', ['HANDLE'], '[handle removed]', 'jenny92'],
  ['funnel', 'add me on telegram', ['HANDLE'], '[handle removed]', 'telegram'],
  ['email', 'email jen@gmail.com', ['HANDLE'], '[handle removed]', 'gmail'],
  ['sugar', 'Looking for a sugar daddy', ['COMMERCIAL_SOLICITATION'], 'sugar daddy', null],
  ['sugar spaced', 's u g a r d a d d y', ['COMMERCIAL_SOLICITATION'], null, null],
  ['sugar leet', '$ugar b@by here', ['COMMERCIAL_SOLICITATION'], null, null],
  ['ppm', 'ppm only, no time wasters', ['COMMERCIAL_SOLICITATION'], null, null],
  ['payment gcash', 'send gcash pls', ['PAYMENT'], null, null],
  ['payment crypto', 'I can teach you bitcoin trading', ['PAYMENT'], null, null],
];
for (const [name, text, expected, has, hasNot] of profileCases) {
  const r = moderateProfileText(text);
  const ok =
    expected.every((v) => r.violations.includes(v)) &&
    (has === null || r.sanitizedText.includes(has)) &&
    (hasNot === null || !r.sanitizedText.includes(hasNot));
  check(`profile: ${name}`, ok, JSON.stringify(r));
}
const profileClean = [
  'I love line dancing and my favorite line is from Titanic',
  'I love instagram photography',
  'I work in call center, night shift',
  'Born in 1995. Working in Bangkok since 2019.',
  'I have a Ph.D in biology.',
  'Teacher, 29, 5ft 4in, love karaoke and the beach',
];
for (const text of profileClean) {
  const r = moderateProfileText(text);
  check(`profile clean: ${text.slice(0, 40)}`, r.isClean && r.sanitizedText === text, JSON.stringify(r));
}
check('profile penalty: phone 10', penaltyFor(['PHONE']) === 10);
check('profile penalty: handle 5', penaltyFor(['HANDLE']) === 5);
check('profile penalty: phone+url = 20', penaltyFor(['PHONE', 'URL']) === 20);
check('profile penalty: capped at 25', penaltyFor(['PHONE', 'URL', 'PAYMENT']) === 25);
check('profile penalty: commercial 25', penaltyFor(['COMMERCIAL_SOLICITATION']) === 25);
check('profile penalty: dup types counted once', penaltyFor(['HANDLE', 'HANDLE']) === 5);

const total = passed + failures.length;
for (const f of failures) console.error('  FAIL', f);
console.log(`moderation: ${passed}/${total} passed (${((passed / total) * 100).toFixed(1)}%)`);
process.exit(failures.length === 0 ? 0 : 1);
