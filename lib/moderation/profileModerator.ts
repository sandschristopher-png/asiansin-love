/**
 * Profile text moderation (bios, "looking for", highlight stories), run server-side by
 * PATCH /api/profile and POST /api/profile/highlights.
 *
 *   - Contact details are MASKED and the cleaned text is saved:
 *       phone numbers (digits, spaced, or spelled out) -> [contact removed]
 *       URLs / domains (incl. "name dot com")            -> [link removed]
 *       messenger handles, @handles, emails              -> [handle removed]
 *   - Payment / crypto solicitation and commercial (sugar, pay-per-meet, escort) terms BLOCK the
 *     save: they are not masked, the member must rewrite the text.
 *   - penaltyPoints: PHONE 10, URL 10, HANDLE 5, PAYMENT 15, COMMERCIAL_SOLICITATION 25, counted
 *     once per violation type and capped at 25. The route only charges types that are NEW
 *     compared with the stored text (re-saving the same text costs nothing).
 *
 * Self-contained (no imports) so scripts/test-moderation.mjs can load it directly.
 */

export type ProfileViolation = 'PHONE' | 'URL' | 'HANDLE' | 'PAYMENT' | 'COMMERCIAL_SOLICITATION';

export interface ModerationResult {
  isClean: boolean;
  sanitizedText: string;
  violations: Array<ProfileViolation>;
  penaltyPoints: number;
}

export const PROFILE_PENALTY_POINTS: Record<ProfileViolation, number> = {
  PHONE: 10,
  URL: 10,
  HANDLE: 5,
  PAYMENT: 15,
  COMMERCIAL_SOLICITATION: 25,
};

/** Most a single save can cost, however many violation types it contains. */
export const PROFILE_PENALTY_CAP = 25;

export const MASK = {
  PHONE: '[contact removed]',
  URL: '[link removed]',
  HANDLE: '[handle removed]',
} as const;

export const PROFILE_BLOCK_MESSAGE =
  'Payments, gifts, sponsorship and paid arrangements are not allowed on asiansin.love. Please remove that part and save again.';

const BLOCKING: ProfileViolation[] = ['PAYMENT', 'COMMERCIAL_SOLICITATION'];

export function isBlockingViolation(v: ProfileViolation): boolean {
  return BLOCKING.includes(v);
}

/** Points for a set of violation types (each type once), capped per save. */
export function penaltyFor(violations: Iterable<ProfileViolation>): number {
  let total = 0;
  for (const v of new Set(violations)) total += PROFILE_PENALTY_POINTS[v];
  return Math.min(PROFILE_PENALTY_CAP, total);
}

// --- Patterns ------------------------------------------------------------------------------

const TLDS = 'com|net|org|ph|th|vn|id|my|sg|kh|la|mm|io|me|co|app|ly|xyz|info|asia|link|site|online|live|love|biz|us|uk';
const DIGIT_WORD = 'zero|oh|one|two|three|four|five|six|seven|eight|nine';

/** Messengers whose name is never an ordinary word: a following token is treated as a handle. */
const STRONG_MESSENGER = String.raw`whats\s*app|wh?atsapp|watsapp|telegram|we\s*chat|viber|kakao(?:\s*talk)?|insta(?:gram)?|snap\s*chat|facebook|tiktok|discord`;
/** Short / ambiguous names ("line dancing", "IG" as initials): need an explicit separator. */
const WEAK_MESSENGER = String.raw`line|ig|fb|tg|wa|sc|signal|messenger|snap`;

const MASK_RULES: { type: Exclude<ProfileViolation, 'PAYMENT' | 'COMMERCIAL_SOLICITATION'>; re: RegExp }[] = [
  // Emails first, so their domain is not also reported as a link.
  { type: 'HANDLE', re: /\b[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}\b/gi },
  { type: 'HANDLE', re: /\b[a-z0-9._%+-]+\s*(?:\(at\)|\[at\]|\s+at\s+)\s*(?:gmail|yahoo|hotmail|outlook|icloud|proton(?:mail)?)(?:\s*(?:\.|dot)\s*com)?\b/gi },

  // Links: scheme, www., name.tld (also "name dot com" / "name [dot] com"), with optional path.
  { type: 'URL', re: /\bhttps?:\/\/\S+/gi },
  { type: 'URL', re: /\bwww\s*\.\s*\S+/gi },
  { type: 'URL', re: new RegExp(String.raw`\b[a-z0-9-]{2,}(?:\s*\.\s*|\s*\[\s*dot\s*\]\s*|\s*\(\s*dot\s*\)\s*|\s+dot\s+)(?:${TLDS})\b(?:\/\S*)?`, 'gi') },

  // Messenger + handle: "whatsapp jenny_92", "IG: @jenny", "line id jenny", "telegram is jen".
  //   Strong names: an explicit separator, or a handle-looking token (has a digit, _ or .), so
  //   "I love instagram photography" is left alone.
  { type: 'HANDLE', re: new RegExp(String.raw`\b(?:${STRONG_MESSENGER})\b\s*(?:\bid\b|\bis\b|:|@|=)\s*@?[a-z0-9_.]{3,30}`, 'gi') },
  { type: 'HANDLE', re: new RegExp(String.raw`\b(?:${STRONG_MESSENGER})\b\s+@?(?=[a-z0-9_.]*[0-9_.])[a-z0-9_.]{3,30}`, 'gi') },
  //   Weak names need ":", "@", "=" or "id" ("my favorite line is from Titanic" stays).
  { type: 'HANDLE', re: new RegExp(String.raw`\b(?:${WEAK_MESSENGER})\b\s*(?:id\s*[:@=]?|[:@=])\s*@?[a-z0-9_.]{3,30}`, 'gi') },
  // "add me on whatsapp" (funnel without a handle)
  { type: 'HANDLE', re: new RegExp(String.raw`\b(?:add|message|msg|text|contact|find|dm|follow|reach)\s+me\s+(?:on|at|via|in)\s+(?:${STRONG_MESSENGER}|${WEAK_MESSENGER})\b`, 'gi') },
  // Standalone @handle
  { type: 'HANDLE', re: /(?<![\w.@])@[a-z0-9_.]{3,30}/gi },

  // Phones: spelled-out / mixed digit words (7+), then 7+ digits with common separators.
  { type: 'PHONE', re: new RegExp(String.raw`\b(?:${DIGIT_WORD}|\d)(?:[\s,.-]*\b(?:${DIGIT_WORD}|\d)\b){6,}`, 'gi') },
  { type: 'PHONE', re: /(?:\+\s?)?\d(?:[\s.()-]{0,2}\d){6,}/g },
];

const PAYMENT_RE = new RegExp(
  String.raw`\b(?:g\s*cash|paymaya|maya\s*wallet|pay\s*pal|venmo|cash\s*app|zelle|western\s*union|money\s*gram|remitly|wise\s*transfer|bank\s*transfer|wire\s*(?:me|transfer)|send\s+(?:me\s+)?money|gift\s*cards?|crypto(?:currency)?|bitcoin|btc|ethereum|usdt|tether|binance|forex|investment\s+opportunit(?:y|ies))\b`,
  'i'
);
const COMMERCIAL_RE = new RegExp(
  String.raw`\b(?:sugar\s*(?:daddy|daddies|baby|babies|mommy|mama|arrangement)|ppm|pay\s*per\s*meet|allowance|looking\s+for\s+(?:a\s+)?sponsor|sponsorship|escort(?:s|ing)?|outcalls?|incalls?|happy\s*ending|rates?\s+per\s+(?:hour|hr|night)|hourly\s+rate|paid\s+(?:meet(?:up)?s?|dates?)|generous\s+(?:gentleman|gentlemen|man|men|guy)|donations?\s+(?:welcome|accepted)|services\s+offered|massage\s+services?)\b`,
  'i'
);
/** Long, unambiguous terms checked on the collapsed text to catch "s u g a r d a d d y". */
const COLLAPSED_COMMERCIAL = ['sugardaddy', 'sugarbaby', 'sugarmommy', 'paypermeet', 'happyending'];
const COLLAPSED_PAYMENT = ['westernunion', 'moneygram', 'bitcoin', 'binance', 'cashapp'];

const LEET: Record<string, string> = { '@': 'a', $: 's', '0': 'o', '1': 'i', '!': 'i', '|': 'l', '3': 'e', '5': 's', '7': 't', '8': 'b' };

function clean(text: string): string {
  return String(text || '')
    .normalize('NFKC')
    .replace(/[​-‍⁠﻿­]/g, '');
}

function deLeet(text: string): string {
  return text.toLowerCase().replace(/[@$0-9!|]/g, (c) => LEET[c] ?? c);
}

export function moderateProfileText(text: string): ModerationResult {
  const original = clean(text);
  const found = new Set<ProfileViolation>();

  // Blocking categories: read the raw, de-leeted and collapsed forms.
  const leet = deLeet(original);
  const collapsed = leet.replace(/[^a-z]/g, '');
  if (COMMERCIAL_RE.test(original) || COMMERCIAL_RE.test(leet) || COLLAPSED_COMMERCIAL.some((t) => collapsed.includes(t))) {
    found.add('COMMERCIAL_SOLICITATION');
  }
  if (PAYMENT_RE.test(original) || PAYMENT_RE.test(leet) || COLLAPSED_PAYMENT.some((t) => collapsed.includes(t))) {
    found.add('PAYMENT');
  }

  // Masking categories run on the raw text (digits must survive).
  let sanitized = original;
  for (const { type, re } of MASK_RULES) {
    sanitized = sanitized.replace(re, () => {
      found.add(type);
      return MASK[type];
    });
  }
  // Tidy runs of the same mask and stray spacing left by replacements.
  sanitized = sanitized
    .replace(/(\[(?:contact|link|handle) removed\])(?:[\s,;:/|-]*\1)+/g, '$1')
    .replace(/[ \t]{2,}/g, ' ')
    .trim();

  const violations = [...found];
  return {
    isClean: violations.length === 0,
    sanitizedText: sanitized,
    violations,
    penaltyPoints: penaltyFor(violations),
  };
}
