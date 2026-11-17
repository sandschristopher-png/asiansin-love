/**
 * Master safety dictionary for chat messages: financial scams, sex solicitation, adult-content
 * selling, underage / extortion (zero tolerance), harassment and drugs, and off-platform funneling,
 * across English, Tagalog, Thai, Vietnamese, Indonesian / Malay, Khmer and Hindi / Urdu.
 *
 * How matching works (so obfuscation is caught and plain words are not):
 *   1. Text is folded: NFKC, invisible characters removed, Latin accents and the Vietnamese "d with
 *      stroke" removed, lowercase, apostrophes dropped. Terms and cue words go through the same fold.
 *   2. Latin text is split into tokens on anything that is not a letter or digit. A term matches when
 *      the tokens, joined with no separator, spell it exactly and start and end on token edges:
 *      "g-cash", "g.c.a.s.h", "open-bo", "v.c.s", "w.h.a.t.s.a.p.p" and "gcash" all match "gcash",
 *      while "upload" or "download" can never match a term that is not a whole token. A sentence
 *      boundary (". " "! " ", " or a newline) is never joined across.
 *   3. Thai, Khmer and other scripts without spaces use substring matching; terms of three code
 *      points or fewer must be a whole token instead (a two-consonant Khmer cluster sits inside
 *      ordinary words).
 *   4. Words that are also ordinary language ("short time ago", "maya", "dana", "plane ticket",
 *      "bj", "minor") carry a guard: a cue word nearby, a word that must not follow or precede it,
 *      or both. An unguarded entry is one that is rarely innocent.
 *
 * Reputation: category 0 costs 100 and blocks the send (the account is frozen for review); 1 costs
 * 25, 2 costs 20, 3 costs 20, 4 costs 15 (each once per message); 5 costs 4 per distinct term.
 * Regression cases: scripts/test-safety-rules.mjs.
 */

export type SafetyCategory = 0 | 1 | 2 | 3 | 4 | 5;

/** Banner kinds shown to the recipient; also stored in message_safety_flags.category. */
export type SafetyBanner = 'solicitation' | 'adult_content' | 'financial' | 'harassment' | 'off_platform';

export const CATEGORY_PENALTY: Record<SafetyCategory, number> = { 0: 100, 1: 25, 2: 20, 3: 20, 4: 15, 5: 4 };

export const CATEGORY_BANNER: Record<Exclude<SafetyCategory, 0>, SafetyBanner> = {
  1: 'solicitation',
  2: 'adult_content',
  3: 'financial',
  4: 'harassment',
  5: 'off_platform',
};

export interface SafetyHit {
  category: SafetyCategory;
  /** The dictionary term (never the member's own text). */
  term: string;
  penalty: number;
}

export interface SafetyVerdict {
  hits: SafetyHit[];
  hardBlock: boolean;
  categories: SafetyCategory[];
  /** Total reputation points for the message (category 0 = 100, 5 counted per distinct term). */
  deduction: number;
  /** Deduction without category 5, for when contact sharing is already allowed in the thread. */
  deductionWithoutFunnel: number;
  /** Banner for the recipient: the lowest-numbered category among 1-5, or null. */
  banner: SafetyBanner | null;
  /** Dictionary terms that matched, for moderation_log. */
  terms: string[];
}

// ---------------------------------------------------------------------------------------------
// Guards
// ---------------------------------------------------------------------------------------------

/** Cue words: one of them within a few tokens of the match makes an ambiguous term count. */
const CUES: Record<string, string[]> = {
  adult: ['sex', 'sexy', 'horny', 'naked', 'nude', 'nudes', 'suck', 'lick', 'fuck', 'fucking', 'kantot', 'libog', 'show', 'vc', 'video', 'cam', 'hot', 'wet', 'hard', 'send', 'pic', 'pics', 'pix', 'nsfw', 'bed', 'hookup', 'paid', 'price', 'rate', 'ราคา', 'เสียว', 'เซ็กส์', 'sange', 'bokep'],
  rates: ['rate', 'rates', 'price', 'prices', 'hour', 'hourly', 'night', 'overnight', 'service', 'fee', 'peso', 'pesos', 'php', 'baht', 'usd', 'dollar', 'dollars', 'per', 'short', 'shorttime', 'incall', 'outcall', 'ราคา', 'บาท', 'เรท', 'ชั่วโมง', 'รับงาน', 'บริการ', 'นัด', 'gia', 'tien', 'khach', 'gai', 'dich', 'vu', 'phong', 'nghin', 'bao', 'nhieu', 'តម្លៃ', 'ដុល្លារ', 'រៀល', 'សេវា', 'ម៉ាស្សា', 'ហូតែល'],
  finance: ['send', 'sent', 'transfer', 'pay', 'payment', 'paid', 'wallet', 'account', 'acct', 'acc', 'number', 'via', 'bank', 'deposit', 'topup', 'top', 'money', 'cash', 'load', 'qr', 'fund', 'funds', 'padala', 'pahingi', 'kailangan', 'bigay', 'tulong', 'need', 'help', 'borrow', 'lend', 'loan', 'urgent', 'kirim', 'bayar', 'minta', 'pinjam', 'chuyen', 'gui', 'xin', 'muon', 'tien', 'โอน', 'ส่ง', 'เงิน', 'ช่วย', 'ยืม', 'ขอ'],
  hardship: ['send', 'help', 'need', 'pay', 'paying', 'transfer', 'borrow', 'lend', 'loan', 'cover', 'support', 'money', 'cash', 'load', 'urgent', 'please', 'pls', 'plz', 'can', 'could', 'would', 'behind', 'due', 'overdue', 'stuck', 'short', 'buy', 'for', 'padala', 'pahingi', 'kailangan', 'wala', 'tulong', 'kulang'],
  drug: ['pill', 'pills', 'tab', 'tabs', 'buy', 'sell', 'selling', 'sale', 'molly', 'party', 'drug', 'drugs', 'dealer', 'gram', 'grams', 'snort', 'supply', 'high'],
  threatUp: ['up', 'bloody', 'black', 'hard', 'gonna', 'going'],
  bride: ['bride', 'brides', 'wife', 'wives', 'girl', 'girls', 'asian', 'filipina', 'thai', 'vietnamese', 'woman', 'women', 'catalog', 'catalogue', 'site', 'sites'],
  vip: ['nude', 'nudes', 'adult', 'content', 'join', 'pay', 'paid', 'fee', 'snap', 'onlyfans', 'telegram', 'sex', 'explicit', 'private'],
  link: ['my', 'join', 'nude', 'nudes', 'onlyfans', 'subscribe', 'sub', 'buy', 'free'],
  tribute: ['send', 'pay', 'paying', 'tip', 'cam', 'show', 'menu', 'nude', 'content', 'vcs', 'sexting'],
  invest: ['invest', 'profit', 'guaranteed', 'join', 'uncle', 'aunt', 'signal', 'deposit', 'return', 'returns', 'crypto', 'forex', 'vip'],
  allowance: ['sugar', 'baby', 'daddy', 'monthly', 'weekly', 'pay', 'paying', 'offer', 'offering', 'give', 'giving', 'generous'],
  ageCue: ['am', 'im', 'is', 'shes', 'hes', 'are', 'ur', 'age', 'aged', 'only', 'just', 'turning', 'turned', 'turn', 'i', 'she', 'he'],
  extort: ['you', 'your', 'photos', 'pics', 'nude', 'nudes', 'send', 'pay', 'will', 'gonna', 'going', 'leak', 'expose', 'family', 'wife', 'make', 'made', 'post', 'share'],
};

interface Opts {
  /** Counts only when one of these cue sets has a word within `window` tokens (or substring for non-Latin cues). */
  cue?: keyof typeof CUES;
  /** Skipped when the next token is one of these. */
  notNext?: string[];
  /** Skipped when one of the previous 3 tokens is one of these. */
  notPrev?: string[];
  /** Counts only when one of the previous `prevWithin` tokens is in the named cue set. */
  prev?: { within: number; cue: keyof typeof CUES };
}
type Entry = string | [string, Opts];

const MINOR_NEXT = ['issue', 'issues', 'problem', 'problems', 'injury', 'injuries', 'thing', 'things', 'detail', 'details', 'change', 'changes', 'league', 'key', 'chord', 'scale', 'role', 'mistake', 'mistakes', 'delay', 'delays', 'difference', 'accident', 'surgery', 'setback', 'inconvenience', 'concern', 'concerns', 'point', 'part', 'adjustment', 'update', 'updates', 'bug', 'bugs', 'fix', 'edit', 'edits', 'tweak', 'tweaks', 'in', 'at', 'on', 'for', 'of', 'to', 'amount', 'amounts', 'one', 'ones', 'incident', 'flaw', 'fault', 'cold', 'flu', 'pain', 'cut'];
const PAST = ['was', 'were', 'used', 'former', 'ex', 'when', 'once', 'ago'];
const AGE_PREV = { within: 3, cue: 'ageCue' } as const;

// ---------------------------------------------------------------------------------------------
// Category 0: zero tolerance
// ---------------------------------------------------------------------------------------------

const ages = [15, 16, 17];
const CAT0: Entry[] = [
  ['underage', { notNext: ['drinking', 'drinker', 'gambling', 'smoking'] }],
  ['minor', { prev: { within: 2, cue: 'minorPrev' as 'ageCue' }, notNext: MINOR_NEXT }],
  ...ages.flatMap((n): Entry[] => [
    `${n}yo`,
    `${n} yo`,
    `${n}y/o`,
    [`${n} yrs`, { prev: AGE_PREV }],
    [`${n} yr`, { prev: AGE_PREV }],
    [`${n} years old`, { prev: AGE_PREV }],
    [`${n} year old`, { prev: AGE_PREV }],
  ]),
  ['high school student', { notPrev: PAST }],
  ['highschooler', { notPrev: PAST }],
  'bata pa',
  'menor de edad',
  'ผู้เยาว์',
  'เด็กนักเรียน',
  'chưa đủ 18',
  'dưới 18',
  'di bawah umur',
  'anak sekolah',
  'ក្មេងមិនទាន់គ្រប់អាយុ',
  'naabalig',
  // Extortion / blackmail
  'sextortion',
  'leak your photos',
  'send to your family',
  'send to your wife',
  ['expose you', { notNext: ['to', 'in'] }],
  ['blackmail', { cue: 'extort' }],
  'revenge porn',
  ['deepfake', { cue: 'extort' }],
];

// ---------------------------------------------------------------------------------------------
// Category 1: sex solicitation, escorting, transactional dating
// ---------------------------------------------------------------------------------------------

const CAT1: Entry[] = [
  // English / global
  'escort service', 'call girl', 'callgirl', 'prostitute', 'hooker', 'sex work', 'sex worker', 'full service',
  'girlfriend experience', 'gfe',
  ['bj', { cue: 'adult' }], ['hj', { cue: 'adult' }], 'cbj', 'bbbj', ['cim', { cue: 'adult' }], ['cof', { cue: 'adult' }], 'dtf',
  'one night stand', 'friends with benefits', 'fwb', 'casual sex', 'paid sex', 'sex for money', 'pay for sex',
  ['short time', { notNext: ['ago', 'later', 'before', 'frame', 'period', 'span', 'notice', 'away'] }],
  ['long time', { cue: 'rates' }],
  ['longtime', { cue: 'rates' }],
  'overnight rate', 'hourly rate', 'my rate', 'incall', 'in-call', 'outcall', 'out-call', 'hotel meet', 'motel meet',
  'erotic massage', 'sensual massage', 'happy ending', 'nuru', 'body to body', 'spakol', 'paid meet', 'pay per meet',
  ['ppm', { cue: 'adult' }], 'sugar baby', 'sugar daddy', 'sd/sb', 'monthly allowance', ['allowance', { cue: 'allowance' }],
  // Philippines
  'pokpok', 'puta', 'burikat', 'bayaran', 'babaeng bayaran', 'pa-book', 'pabook', 'pa-walk', 'pawalk', 'extra service',
  'kantot', 'kantutan', 'iyot', 'iyutan', 'jakol', 'chupa', 'tsupa', ['puke', { cue: 'adult' }], ['titi', { cue: 'adult' }], ['tite', { cue: 'adult' }],
  'libog', 'malibog', 'vc show', 'private show',
  // Thailand
  'รับงาน', 'รับงานเอง', 'ขายตัว', 'ขายบริการ', 'ไซด์ไลน์', 'sideline', ['ค้างคืน', { cue: 'rates' }], ['ชั่วคราว', { cue: 'rates' }],
  'นวดกระปู๋', 'นวดพริตตี้', 'นวดนาบ', 'ค้าประเวณี', 'เย็ด', 'เงี่ยน', 'อมควย', 'เลียหี', 'เปิดกล้องเสียว', 'คอลเสียว',
  // Vietnam
  'gái gọi', 'đi khách', 'bán dâm', 'mại dâm', ['tàu nhanh', { cue: 'rates' }], ['qua đêm', { cue: 'rates' }], 'massage kích dục',
  'tình một đêm', 'sgbb', 'địt', 'lồn', 'cặc', 'bú cu', 'nứng', 'chat sex', 'call sex',
  // Indonesia / Malaysia
  'open bo', 'openbo', 'vcs', 'video call sex', 'cewek panggilan', 'perek', 'lonte', 'pelacur', ['psk', { cue: 'adult' }], 'pijat plus',
  'pijat plus plus', 'esek-esek', 'ngentot', 'memek', 'kontol', 'colmek', ['coli', { cue: 'adult' }], 'sange', 'bokep', 'sundal', 'jalang',
  // Cambodia
  'ស្រីខូច', 'លក់ខ្លួន', 'រកស៊ីផ្លូវភេទ', 'ម៉ាស្សាពិសេស', ['ដេកជាមួយ', { cue: 'rates' }], ['មួយយប់', { cue: 'rates' }], ['មួយភ្លែត', { cue: 'rates' }],
  'ចុយ', 'ក្ត', 'កន្ដួយ', 'ខលសិច',
  // India / Pakistan
  'paid service', 'full night', 'one shot', 'two shot', 'randi', 'randi khana', 'dhandha', 'dhanda', 'chudai', 'chodna',
  ['lund', { cue: 'adult' }], ['chut', { cue: 'adult' }], 'gaand', 'bhabhi service', 'aunty service', 'cam service', 'nude call', 'paid vc', 'sex chat',
];

// ---------------------------------------------------------------------------------------------
// Category 2: adult content selling and cam funneling
// ---------------------------------------------------------------------------------------------

const CAT2: Entry[] = [
  'onlyfans', 'only fans', ['of link', { cue: 'link' }], 'fansly', 'patreon', 'manyvids', 'chaturbate', 'stripchat', 'bongacams',
  'livejasmin', 'cam4', 'myfreecams', 'pornhub', 'xvideos', 'xnxx',
  ['vip channel', { cue: 'vip' }], ['vip group', { cue: 'vip' }], 'private channel', 'paid channel', 'premium snap', 'private snap',
  'sell nudes', 'selling nudes', 'buy my nudes', 'nude pics', 'nude videos', 'explicit content', 'adult content', 'paid content',
  'private content', ['custom video', { cue: 'adult' }], 'video call show', 'vc price', 'video call price', 'cam show',
  'sexting menu', 'tip menu', ['tribute', { cue: 'tribute' }],
];

// ---------------------------------------------------------------------------------------------
// Category 3: financial scams, local wallets, wire and crypto
// ---------------------------------------------------------------------------------------------

const H = { cue: 'hardship' } as const;
const F = { cue: 'finance' } as const;
const CAT3: Entry[] = [
  // Philippines
  'gcash', 'g-cash', ['maya', F], 'paymaya', 'coins.ph', 'palawan express', 'palawan pawnshop', 'cebuana', 'cebuana lhuillier',
  'mlhuillier', 'm lhuillier', 'lbc padala', 'smart padala', ['bdo', F], ['bpi', F], 'unionbank', 'landbank',
  'paload', 'pa-load', 'pasaload', 'pang-load', 'pang load', ['pamasahe', H], 'pang-gastos', 'pang gastos', 'pambili', 'pang-rent',
  'pang rent', 'pang-tuition', 'pang tuition', ['ospital', H], 'pang-gamot',
  'need load', 'no load', 'send load', 'buy load', 'for load',
  // Thailand
  'promptpay', 'prompt pay', 'truemoney', 'true money', 'kasikorn', 'kbank', ['scb', F], 'krungthai', 'bangkok bank',
  'โอนเงิน', 'ขอเงิน', ['ค่าเดินทาง', F], ['ค่าห้อง', F], ['เติมเงิน', F], 'เดือดร้อนเรื่องเงิน',
  // Vietnam
  ['momo', F], 'zalopay', 'zalo pay', 'vnpay', 'vietcombank', 'techcombank', 'bidv', 'agribank', 'mbbank', 'chuyển khoản', 'xin tiền',
  'mượn tiền', 'nạp thẻ', ['tiền nhà', H],
  // Indonesia / Malaysia
  ['dana', F], ['ovo', F], 'gopay', 'go-pay', 'shopeepay', 'linkaja', ['bca', F], ['mandiri', F], ['bri', F], ['bni', F], 'touch n go',
  'tng ewallet', 'duitnow', 'maybank', 'cimb', 'transfer duit', 'minta duit', 'pinjam duit', ['pulsa', F], 'isi pulsa', ['bayar kos', H], ['uang kos', H],
  // Cambodia
  'aba pay', 'aba bank', 'wing money', 'acleda', 'pi pay', 'bakong', 'វេរលុយ', 'សុំលុយ', 'ខ្ចីលុយ', 'បញ្ចូលលុយ',
  // Singapore
  'paynow', 'paylah', 'dbs paylah', 'grabpay', 'singtel dash',
  // India / Pakistan
  ['upi', F], 'paytm', 'phonepe', 'phone pe', 'gpay', 'google pay', 'bhim', 'jazzcash', 'jazz cash', 'easypaisa', 'easy paisa',
  'sadapay', 'nayapay', 'raast', ['imps', F], ['neft', F], ['rtgs', F], ['ifsc', F], ['iban', F], 'mobile recharge', 'balance dalwa', 'paise bhej',
  'paise chahiye', ['udhar', F], 'customs fee', 'clearance fee', 'parcel fee',
  // Wire, gift cards, crypto
  'western union', 'moneygram', 'remitly', 'worldremit', 'xoom', 'ria money', 'paypal', 'venmo', 'cashapp', 'cash app', 'zelle',
  'apple gift card', 'steam card', 'google play card', 'razer gold', 'usdt', 'trc20', 'erc20', 'binance', 'okx', 'bybit', 'coinbase',
  'trust wallet', 'metamask', 'forex', 'binary options', ['trading platform', { cue: 'invest' }], ['signal group', { cue: 'invest' }],
  'guaranteed profit', 'liquidity mining', 'pig butchering',
  // Requests for money and hardship stories
  'send money', 'wire money', 'transfer money', 'need money', 'borrow money', 'lend me', 'financial help', 'financial support',
  'pay my rent', ['rent is due', H], ['electric bill', H], ['wifi bill', H], ['internet bill', H], 'out of load', 'my mom is sick',
  'mother is sick', ['in the hospital', H], ['hospital bill', H], 'medicine money', ['school fee', H], ['tuition fee', H], ['visa fee', H],
  'ticket money', ['plane ticket', H], 'buy me a phone', ['broken phone', H], 'help me financially', 'short on cash', 'broke right now',
];

// ---------------------------------------------------------------------------------------------
// Category 4: harassment, slurs, threats, illegal substances
// ---------------------------------------------------------------------------------------------

const CAT4: Entry[] = [
  'kill yourself', 'kys', 'go die', 'i will kill', 'rape you', ['beat you', { cue: 'threatUp' }], ['slap you', { cue: 'threatUp' }],
  'whore', 'slut', 'bitch', 'cunt', 'faggot', 'nigger', 'chink', 'gook', 'gold digger', 'golddigger',
  ['mail order', { cue: 'bride' }], ['mail-order', { cue: 'bride' }],
  'shabu', 'crystal meth', 'cocaine', 'heroin', ['ecstasy', { cue: 'drug' }], 'mdma', 'ketamine', 'buy weed', 'weed for sale',
  'ยาบ้า', 'ยาไอซ์', 'ma túy', 'sabu-sabu',
];

// ---------------------------------------------------------------------------------------------
// Category 5: off-platform funneling
// ---------------------------------------------------------------------------------------------

const CAT5: Entry[] = [
  'whatsapp', 'whats app', 'wa.me', 'telegram', 't.me', 'viber', 'line id', 'line app', 'zalo', 'wechat', 'we chat', 'kakao',
  'kakaotalk', 'botim', ['imo', { cue: 'link' }], 'snapchat', 'add me on', 'text me on', 'message me on', 'dm me on', 'my number is', 'call me on',
];

// ---------------------------------------------------------------------------------------------
// Compilation
// ---------------------------------------------------------------------------------------------

const INVISIBLE_RE = /[­͏؜ᅟᅠ឴឵᠋-᠏​-‏‪-‮⁠-⁯ㅤ︀-️﻿ﾠ]/g;
const NON_LATIN_RE = /[฀-๿ក-៿぀-ヿ一-鿿가-힯]/;

/** Same fold for text, terms and cue words. */
export function foldForSafety(text: string): string {
  return String(text ?? '')
    .normalize('NFKC')
    .replace(INVISIBLE_RE, '')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .normalize('NFC')
    .toLowerCase()
    .replace(/đ/g, 'd')
    .replace(/['’`]/g, '');
}

interface Tok {
  s: string;
  /** A sentence boundary sits between the previous token and this one. */
  hard: boolean;
}

function tokenize(folded: string): Tok[] {
  const out: Tok[] = [];
  const re = /([\p{L}\p{N}\p{M}]+)|([^\p{L}\p{N}\p{M}]+)/gu;
  let sep = '';
  let m: RegExpExecArray | null;
  while ((m = re.exec(folded)) !== null) {
    if (m[1]) {
      const hard = out.length > 0 && (/[\n\r]/.test(sep) || (/[.!?;:,]/.test(sep) && /\s/.test(sep)));
      out.push({ s: m[1], hard });
      sep = '';
    } else {
      sep = m[2];
    }
  }
  return out;
}

interface Term {
  category: SafetyCategory;
  display: string;
  opts: Opts;
  /** Latin terms: token-joined spelling. Script terms: folded string. */
  compact: string;
  script: boolean;
  hasDigit: boolean;
  /** Short script terms must be a whole token. */
  standalone: boolean;
  /** Short Latin acronyms: one token, or a run of single letters, never a join of longer words. */
  strictShort: boolean;
}

function compile(entries: Entry[], category: SafetyCategory): Term[] {
  return entries.map((e) => {
    const [display, opts] = typeof e === 'string' ? [e, {} as Opts] : e;
    const folded = foldForSafety(display);
    const script = NON_LATIN_RE.test(folded);
    const compact = script ? folded.replace(/\s+/g, '') : tokenize(folded).map((t) => t.s).join('');
    return {
      category,
      display,
      opts,
      compact,
      script,
      hasDigit: /\d/.test(compact),
      standalone: script && Array.from(compact).length <= 3,
      strictShort: !script && compact.length <= 4 && !/\s|[-/.]/.test(display),
    };
  });
}

const TERMS: Term[] = [
  ...compile(CAT0, 0),
  ...compile(CAT1, 1),
  ...compile(CAT2, 2),
  ...compile(CAT3, 3),
  ...compile(CAT4, 4),
  ...compile(CAT5, 5),
];

const LATIN = TERMS.filter((t) => !t.script);
const SCRIPT = TERMS.filter((t) => t.script);
const LATIN_BY_COMPACT = new Map<string, Term[]>();
const PREFIXES = new Set<string>();
let MAX_LEN = 0;
for (const t of LATIN) {
  const list = LATIN_BY_COMPACT.get(t.compact) ?? [];
  list.push(t);
  LATIN_BY_COMPACT.set(t.compact, list);
  MAX_LEN = Math.max(MAX_LEN, t.compact.length);
  for (let i = 1; i <= t.compact.length; i++) PREFIXES.add(t.compact.slice(0, i));
}

const CUE_SETS = new Map<string, { latin: Set<string>; script: string[] }>();
for (const [name, words] of Object.entries(CUES)) {
  const latin = new Set<string>();
  const script: string[] = [];
  for (const w of words) {
    const f = foldForSafety(w);
    if (NON_LATIN_RE.test(f)) script.push(f);
    else latin.add(f);
  }
  CUE_SETS.set(name, { latin, script });
}
// "minor" reads as a person only after one of these.
CUE_SETS.set('minorPrev', {
  latin: new Set(['a', 'an', 'am', 'im', 'is', 'are', 'was', 'were', 'still', 'legally', 'being', 'shes', 'hes', 'ur', 'u', 'you', 'she', 'he', 'still']),
  script: [],
});

const CUE_WINDOW = 6;

function cueNearby(name: string, tokens: Tok[], start: number, end: number, folded: string): boolean {
  const set = CUE_SETS.get(name);
  if (!set) return false;
  for (let i = Math.max(0, start - CUE_WINDOW); i <= Math.min(tokens.length - 1, end + CUE_WINDOW); i++) {
    if (i >= start && i <= end) continue;
    if (set.latin.has(tokens[i].s)) return true;
  }
  return set.script.some((w) => folded.includes(w));
}

function guardsPass(t: Term, tokens: Tok[], start: number, end: number, folded: string): boolean {
  const { cue, notNext, notPrev, prev } = t.opts;
  if (notNext && end + 1 < tokens.length && !tokens[end + 1].hard && notNext.includes(tokens[end + 1].s)) return false;
  if (notPrev) {
    for (let i = Math.max(0, start - 3); i < start; i++) if (notPrev.includes(tokens[i].s)) return false;
  }
  if (prev) {
    const set = CUE_SETS.get(prev.cue);
    let ok = false;
    for (let i = Math.max(0, start - prev.within); i < start && set; i++) if (set.latin.has(tokens[i].s)) ok = true;
    if (!ok) return false;
  }
  if (cue && !cueNearby(cue, tokens, start, end, folded)) return false;
  return true;
}

function matchLatin(folded: string, allowDigitTerms: boolean, found: Map<string, Term>): void {
  const tokens = tokenize(folded);
  for (let i = 0; i < tokens.length; i++) {
    let joined = '';
    for (let j = i; j < tokens.length; j++) {
      if (j > i && tokens[j].hard) break;
      joined += tokens[j].s;
      if (joined.length > MAX_LEN || !PREFIXES.has(joined)) break;
      const list = LATIN_BY_COMPACT.get(joined);
      if (!list) continue;
      for (const t of list) {
        if (t.hasDigit && !allowDigitTerms) continue;
        if (t.strictShort && j > i) {
          // A join of several tokens is fine only for a run of single letters ("v c s").
          let singles = true;
          for (let k = i; k <= j; k++) if (tokens[k].s.length !== 1) singles = false;
          if (!singles) continue;
        }
        if (!guardsPass(t, tokens, i, j, folded)) continue;
        found.set(`${t.category}:${t.compact}`, t);
      }
    }
  }
}

function matchScript(folded: string, found: Map<string, Term>): void {
  const tokens = tokenize(folded);
  const squeezed = folded.replace(/\s+/g, '');
  for (const t of SCRIPT) {
    const hit = t.standalone ? tokens.some((k) => k.s === t.compact) : folded.includes(t.compact) || squeezed.includes(t.compact);
    if (!hit) continue;
    if (t.opts.cue && !cueNearby(t.opts.cue, [], 0, -1, folded)) continue;
    found.set(`${t.category}:${t.compact}`, t);
  }
}

const LEET_A: Record<string, string> = { '0': 'o', '1': 'i', '3': 'e', '4': 'a', '5': 's', '7': 't', '@': 'a', $: 's' };
const LEET_B: Record<string, string> = { ...LEET_A, '1': 'l' };
const leet = (s: string, map: Record<string, string>) => s.replace(/[013457@$]/g, (c) => map[c] ?? c);

/** Run the dictionary over one message. Pure and synchronous. */
export function evaluateMasterSafety(text: string): SafetyVerdict {
  const empty: SafetyVerdict = { hits: [], hardBlock: false, categories: [], deduction: 0, deductionWithoutFunnel: 0, banner: null, terms: [] };
  if (!text || typeof text !== 'string') return empty;

  const folded = foldForSafety(text);
  const found = new Map<string, Term>();
  matchLatin(folded, true, found);
  matchScript(folded, found);
  if (/[013457@$]/.test(folded)) {
    // Leetspeak ("0pen b0", "wh4tsapp"): only terms without digits, so "15yo" is never rewritten.
    matchLatin(leet(folded, LEET_A), false, found);
    matchLatin(leet(folded, LEET_B), false, found);
  }
  if (found.size === 0) return empty;

  const hits: SafetyHit[] = Array.from(found.values()).map((t) => ({ category: t.category, term: t.display, penalty: CATEGORY_PENALTY[t.category] }));
  const categories = Array.from(new Set(hits.map((h) => h.category))).sort() as SafetyCategory[];
  const hardBlock = categories.includes(0);

  let withoutFunnel = 0;
  for (const c of [1, 2, 3, 4] as const) if (categories.includes(c)) withoutFunnel += CATEGORY_PENALTY[c];
  const funnelTerms = new Set(hits.filter((h) => h.category === 5).map((h) => h.term)).size;
  const total = hardBlock ? CATEGORY_PENALTY[0] : Math.min(100, withoutFunnel + funnelTerms * CATEGORY_PENALTY[5]);

  const soft = categories.filter((c): c is Exclude<SafetyCategory, 0> => c !== 0);
  return {
    hits,
    hardBlock,
    categories,
    deduction: total,
    deductionWithoutFunnel: hardBlock ? CATEGORY_PENALTY[0] : Math.min(100, withoutFunnel),
    banner: hardBlock || soft.length === 0 ? null : CATEGORY_BANNER[soft[0]],
    terms: hits.map((h) => h.term),
  };
}
