/**
 * Moderation wordlists for asiansin.love, grouped by category and severity.
 *
 * Text patterns run against the NORMALIZED forms produced by lib/moderation.ts: lowercase,
 * invisible characters stripped, whitespace collapsed, leetspeak mapped to letters (so they must
 * not rely on digits) and single-letter runs joined ("w h a t s a p p" -> "whatsapp").
 * Patterns that need digits (phones, "call me at ...") live in lib/moderation.ts and run on the
 * un-leeted text instead.
 *
 * Severity:
 *   high   -> message is quarantined for admin review, sender loses reputation
 *   medium -> message is delivered with a safety warning, small reputation deduction
 *
 * Keep entries specific: ordinary words ("line", "signal", "long time", "maya") must not match on
 * their own. Add a false-positive case to scripts/test-moderation.mjs with every new entry.
 */

export type Severity = 'high' | 'medium';

export type WordlistCategory =
  | 'financial_scam'
  | 'crypto_scam'
  | 'wallet_mention'
  | 'commercial_solicitation'
  | 'explicit_request'
  | 'harassment_slur'
  | 'harassment_threat'
  | 'harassment_insult';

export interface WordlistRule {
  category: WordlistCategory;
  severity: Severity;
  patterns: RegExp[];
}

// ---------------------------------------------------------------------------
// Contact evasion (off-platform funnelling before the contact gate unlocks)
// ---------------------------------------------------------------------------

/** Messaging apps / socials whose bare mention counts as contact sharing. */
export const CONTACT_PLATFORM_PATTERNS: RegExp[] = [
  /\bwhats?\s*app\b/,
  /\bwats\s*app\b/,
  /\btele\s*gram\b/,
  /\bviber\b/,
  /\bwe[-._]?chat\b/, // "we chat" (two words) is ordinary English and is not matched
  /\bsnap\s*chat\b/,
  /\bkakao\s*(talk)?\b/,
  /\binsta\s*gram\b/,
  /\bkik\s*(me|messenger)\b/,
  /\bzalo\b/,
  /\bline\s*(app|id)\b/,
  /\b(add|find|text|message|msg|dm|pm|reach|contact|call)\s+me\s+(on|via|in)\s+(line|signal|ig|insta|snap|fb|facebook|messenger|tg|wa|skype|discord)\b/,
  /\b(my|ur|your)\s+(ig|insta|snap|tg|wa|fb|facebook|skype|discord|kik)\s*(handle|id|username|user|name|account|acc)?\s*(is|:|=|@|-)/,
  /\b(ig|insta|snap|tg|wa|fb|skype|discord|kik)\s*[:=]\s*@?[a-z0-9_.]{3,}/,
  /\bhmu\s+(on|at)\s+(ig|insta|snap|tg|wa|fb|line|whats\s*app|tele\s*gram)\b/,
];

/**
 * Distinctive platform names that are matched against the fully collapsed text (every space and
 * symbol removed), catching "w.h-a t s app" style splitting. Only terms that cannot plausibly
 * appear across ordinary word boundaries belong here ("wechat" -> "we chat about" does not).
 */
export const CONTACT_COLLAPSED_TERMS = ['whatsapp', 'telegram', 'instagram', 'snapchat', 'kakaotalk'];

/** Link shorteners for chat apps; checked with dots and slashes intact (and " dot " spelled out). */
export const CONTACT_LINK_PATTERNS: RegExp[] = [
  /\bt\s*\.\s*me\s*\//,
  /\btelegram\s*\.\s*me\b/,
  /\bwa\s*\.\s*me\b/,
  /\bm\s*\.\s*me\s*\//,
  /\bline\s*\.\s*me\b/,
  /\binstagram\s*\.\s*com\s*\//,
  /\bfacebook\s*\.\s*com\s*\//,
  /\bsnapchat\s*\.\s*com\s*\//,
  /\bchat\s*\.\s*whatsapp\s*\.\s*com\b/,
];

/** Spelled-out digits, converted to digits before phone-number checks. */
export const NUMBER_WORDS: Record<string, string> = {
  zero: '0',
  one: '1',
  two: '2',
  three: '3',
  four: '4',
  five: '5',
  six: '6',
  seven: '7',
  eight: '8',
  nine: '9',
};

// ---------------------------------------------------------------------------
// Scams, solicitation and harassment
// ---------------------------------------------------------------------------

export const MODERATION_WORDLISTS: WordlistRule[] = [
  {
    // Romance / hardship scams: explicit requests for money or gift cards.
    category: 'financial_scam',
    severity: 'high',
    patterns: [
      /\bsend\s+(me\s+)?(some\s+)?(money|cash|funds)\b/,
      /\b(lend|loan)\s+me\s+(some\s+)?(money|cash|\$?\d+|php|usd|thb|baht|pesos?|dollars?|dong)\b/,
      /\bborrow\s+(some\s+)?money\b/,
      /\bneed\s+(some\s+)?(money|cash)\s+(for|to)\b/,
      /\b(urgent|emergency)\s+(money|cash|loan)\b/,
      /\bwestern\s*union\b/,
      /\bmoney\s*gram\b/,
      /\bremitly\b/,
      /\bworld\s*remit\b/,
      /\b(itunes|steam|google\s*play|amazon|apple|sephora)\s+(gift\s*)?cards?\b/,
      /\bgift\s*cards?\s+(for|to)\s+me\b/,
      /\bsend\s+(me\s+)?(a\s+)?gift\s*cards?\b/,
      /\bsend\s+(me\s+)?(some\s+)?(pamasahe|load|pasaload)\b/,
      /\bpasaload\b/,
      /\bfare\s+money\b/,
      /\b(help|pay|money|send|cover)\b.{0,30}\bhospital\s+bills?\b/,
      /\b(pay|help\s+(me\s+)?with|cover)\s+(my\s+)?(rent|bills|tuition|debts?)\b/,
      /\bmoney\s+for\s+(my\s+)?(rent|bills|ticket|visa|flight|tuition)\b/,
      /\b(customs|clearance|release)\s+fee\b/,
      /\bmonthly\s+allowance\b/,
      /\b(looking\s+for|need)\s+(a\s+)?sponsor\b/,
      /\bspoil\s+me\s+financially\b/,
      /\b(gcash|paymaya|promptpay|truemoney|paypal|cash\s*app|venmo|zelle)\s+me\b/,
      /\bsend\s+(it\s+)?(to|via|thru|through)\s+(my\s+)?(gcash|paymaya|promptpay|truemoney|paypal|cash\s*app|venmo|zelle|bank\s+account)\b/,
      /\b(my|here\s+is\s+my)\s+(gcash|paymaya|promptpay|truemoney|paypal|bank)\s+(number|account|acct|details)\b/,
    ],
  },
  {
    // Pig-butchering: a crypto / trading token near an investment or yield promise.
    category: 'crypto_scam',
    severity: 'high',
    patterns: [
      /\b(crypto|forex|usdt|bitcoin|btc|binance|metamask|trading)\b.{1,45}\b(invest(ment)?|guaranteed?\s*(profit|returns?)|daily\s*(yield|profit)|passive\s*income|deposit)\b/,
      /\b(invest(ment)?|guaranteed?\s*(profit|returns?)|daily\s*(yield|profit)|passive\s*income|deposit)\b.{1,45}\b(crypto|forex|usdt|bitcoin|btc|binance|metamask|trading)\b/,
      /\b(trading|investment)\s+(platform|app|mentor|signals?)\b/,
      /\bdouble\s+your\s+money\b/,
      /\bmy\s+(uncle|aunt|aunty|cousin|mentor)\s+(is\s+)?(a\s+)?(trader|analyst|insider)\b/,
    ],
  },
  {
    // Payment rails mentioned without a direct request: delivered with a caution banner.
    category: 'wallet_mention',
    severity: 'medium',
    patterns: [
      /\bg[-\s]?cash\b/,
      /\bpay\s*maya\b/,
      /\bprompt\s*pay\b/,
      /\btrue\s*(money|wallet)\b/,
      /\baba\s*pay\b/,
      /\bwing\s*bank\b/,
      /\bbakong\b/,
      /\bmomo\s*wallet\b/,
      /\bzalo\s*pay\b/,
      /\bviettel\s*pay\b/,
      /\bduit\s*now\b/,
      /\bpalawan\s*express\b/,
      /\bcebuana\b/,
      /\bm\s*lhuillier\b/,
    ],
  },
  {
    // Sex work, escorting and paid content.
    category: 'commercial_solicitation',
    severity: 'high',
    patterns: [
      /\bbar\s*fine\b/,
      /\bwhat('?s|\s+is)\s+(your|ur)\s+rates?\b/,
      /\b(my|your|ur)\s+rates?\s+(for|per)\s+(the\s+)?(night|hour|date|session|meet)\b/,
      /\b(hourly|overnight|short\s*time|long\s*time)\s+(rate|price|fee)\b/,
      /\bhow\s+much\s+(for|per)\s+(the\s+|one\s+|an?\s+)?(night|hour|session)\b/,
      /\bpay\s+(per|to)\s+meet\b/,
      /\bppm\b/,
      /\bsugar\s*(baby|daddy|mommy|mama)\b/,
      /\bnsa\s+arrangement\b/,
      /\b(freelance|freelancer)\s+(girl|escort|worker)\b/,
      /\bescort\s+(service|services|girl|girls|agency)\b/,
      /\b(i\s+am|i'?m|im)\s+(an\s+)?escort\b/,
      /\bhappy\s+ending\s+massage\b/,
      /\bmassage\s+with\s+(a\s+)?happy\s+ending\b/,
      /\b(incall|outcall)\b/,
      /\bonly\s*fans\b/,
      /\bfansly\b/,
      /\b(selling|sell|buy)\s+(my\s+)?(pics|photos|videos|content|nudes)\b/,
      /\b(custom|paid|premium|exclusive)\s+(content|videos|pics)\b/,
      /\bpremium\s+snap\b/,
      /\bmeet\s+for\s+(money|cash)\b/,
      /\bcash\s*meet\b/,
    ],
  },
  {
    // Demands for nudes / explicit media.
    category: 'explicit_request',
    severity: 'high',
    patterns: [
      /\bsend\s+(me\s+)?(your\s+)?nudes?\b/,
      /\b(naked|nude|bold|spicy|sexy|dirty)\s+(pics?|photos?|videos?|selfies?)\b/,
      /\bpics?\s+without\s+clothes\b/,
      /\btake\s+off\s+(your\s+)?clothes\b/,
      /\bshow\s+(me\s+)?(your\s+)?(body|boobs|tits|pussy|dick|chest|private\s+parts)\b/,
      /\b(boob|tit|dick|cock|pussy)\s+pics?\b/,
      /\bstrip\s+(on|for)\s+(cam|me)\b/,
      /\bvideo\s+call\s+naked\b/,
      /\b(pic|nude)\s+trade\b/,
    ],
  },
  {
    // Slurs: kept deliberately short. Extend with care and add a false-positive test each time.
    category: 'harassment_slur',
    severity: 'high',
    patterns: [
      /\bchinks?\b(?!\s+in\s+(the|his|her|my|your|their|our)\s+armou?r)/,
      /\bgooks?\b/,
      /\bnigg(er|a)s?\b/,
      /\bfaggots?\b/,
      /\btrann(y|ies)\b/,
      /\bladyboy\s+freak\b/,
    ],
  },
  {
    category: 'harassment_threat',
    severity: 'high',
    patterns: [
      /\b(i('?ll|\s+will)|gonna|going\s+to)\s+(kill|rape)\s+(you|u)\b/,
      /\bkill\s+(yourself|urself)\b/,
      /\bkys\b/,
    ],
  },
  {
    category: 'harassment_insult',
    severity: 'medium',
    patterns: [
      /\b(stupid|ugly|fat|dumb|cheap)\s+(bitch|whore|slut|cow|pig)\b/,
      /\b(you('?re|\s+are)|ur|u\s+r)\s+(a\s+)?(whore|slut|bitch|retard)\b/,
      /\bf+u+c+k+\s+(you|u|off)\b/,
      /\bretard(ed)?\b/,
    ],
  },
];

/**
 * Distinctive multi-word abuse terms matched against the collapsed text ("b-a-r f.i.n.e",
 * "o n l y f a n s"). Same rule as CONTACT_COLLAPSED_TERMS: nothing that can form by accident
 * across ordinary word boundaries.
 */
export const COLLAPSED_ABUSE_TERMS: Array<{ term: string; category: WordlistCategory; severity: Severity }> = [
  { term: 'onlyfans', category: 'commercial_solicitation', severity: 'high' },
  { term: 'westernunion', category: 'financial_scam', severity: 'high' },
  { term: 'moneygram', category: 'financial_scam', severity: 'high' },
  { term: 'sendnudes', category: 'explicit_request', severity: 'high' },
  { term: 'barfine', category: 'commercial_solicitation', severity: 'high' },
];
