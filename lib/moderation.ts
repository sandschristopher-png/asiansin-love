/**
 * Moderation engine for Meet in Asia.
 *
 * Every check runs on several forms of the same text so simple evasion does not get through:
 *   plain      lowercase raw text
 *   normalized NFKC, invisible characters stripped, accents removed, whitespace collapsed and
 *              leetspeak mapped to letters (both the "1 = i" and "1 = l" readings)
 *   despaced   normalized, with runs of single characters joined ("w h a t s a p p" -> "whatsapp")
 *   collapsed  normalized with every space / symbol removed (only distinctive terms are matched)
 * Digit-based checks (phone numbers, "call me at ...") use the un-leeted text, with spelled-out
 * digits ("nine one seven") converted, so times (7:30), ages and prices are left alone.
 *
 * Wordlists live in lib/moderationWordlists.ts; reputation deductions in lib/reputation.ts.
 * Regression cases: scripts/test-moderation.mjs.
 */
import {
  CONTACT_COLLAPSED_TERMS,
  CONTACT_LINK_PATTERNS,
  CONTACT_PLATFORM_PATTERNS,
  COLLAPSED_ABUSE_TERMS,
  MODERATION_WORDLISTS,
  NUMBER_WORDS,
  type Severity,
  type WordlistCategory,
} from './moderationWordlists';

export type { Severity, WordlistCategory } from './moderationWordlists';

// ---------------------------------------------------------------------------
// Normalization
// ---------------------------------------------------------------------------

// Zero-width / invisible / bidi-control characters used to split words.
const INVISIBLE_RE =
  /[\u00AD\u034F\u061C\u115F\u1160\u17B4\u17B5\u180B-\u180F\u200B-\u200F\u202A-\u202E\u2060-\u206F\u3164\uFE00-\uFE0F\uFEFF\uFFA0]/g;

const LEET_COMMON: Record<string, string> = {
  '@': 'a',
  '4': 'a',
  '$': 's',
  '5': 's',
  '0': 'o',
  '3': 'e',
  '7': 't',
  '8': 'b',
};

function leet(text: string, oneAs: 'i' | 'l'): string {
  let out = '';
  for (const ch of text) {
    if (ch === '1' || ch === '!' || ch === '|') out += oneAs;
    else out += LEET_COMMON[ch] ?? ch;
  }
  return out;
}

/** Joins runs of 3+ single characters split by separators: "w-h-a-t-s" -> "whats". */
function despace(text: string): string {
  return text.replace(/(?<![a-z0-9])(?:[a-z0-9][^a-z0-9\n]{1,3}){2,}[a-z0-9](?![a-z0-9])/g, (m) =>
    m.replace(/[^a-z0-9]/g, '')
  );
}

function baseClean(text: string): string {
  return text
    .normalize('NFKC')
    .replace(INVISIBLE_RE, '')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '') // Latin combining accents only; Thai / Vietnamese base letters stay
    .normalize('NFC')
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim();
}

export interface NormalizedText {
  plain: string;
  /** Invisible characters stripped and whitespace collapsed, no leet mapping (digits intact). */
  cleaned: string;
  normalized: string;
  despaced: string;
  collapsed: string;
  /** Every letter-based form to run wordlist patterns against. */
  variants: string[];
}

export function normalizeForModeration(text: string): NormalizedText {
  const plain = String(text || '').toLowerCase();
  const cleaned = baseClean(String(text || ''));
  const normalized = leet(cleaned, 'i');
  const normalizedL = leet(cleaned, 'l');
  const despaced = despace(normalized);
  const despacedL = despace(normalizedL);
  const collapsed = normalized.replace(/[^a-z0-9]/g, '');
  const variants = Array.from(new Set([plain, cleaned, normalized, normalizedL, despaced, despacedL]));
  return { plain, cleaned, normalized, despaced, collapsed, variants };
}

/** "nine one seven" -> "9 1 7"; used only for digit checks. */
function spellDigits(text: string): string {
  return text.replace(/\b(zero|one|two|three|four|five|six|seven|eight|nine)\b/g, (w) => NUMBER_WORDS[w] ?? w);
}

/** Number-like tokens written with letters ("O9I7") read back as digits. */
function unleetDigits(text: string): string {
  return text.replace(/[0-9oil|]{4,}/g, (tok) => ((tok.match(/\d/g) || []).length >= 3 ? tok.replace(/o/g, '0').replace(/[il|]/g, '1') : tok));
}

// ---------------------------------------------------------------------------
// Contact sharing
// ---------------------------------------------------------------------------

const EMAIL_RE = /\b[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}\b/;
const EMAIL_OBFUSCATED_RE =
  /\b[a-z0-9._%+-]{2,}\s*(?:\(at\)|\[at\]|\{at\}|\sat\s)\s*(?:gmail|yahoo|hotmail|outlook|icloud|proton\w*|live|ymail)\s*(?:\.|\(dot\)|\[dot\]|\sdot\s)\s*(?:com|net|me|co)\b/;
const CALL_ME_AT_RE =
  /\b(call|text|ring|reach|message|msg|sms|viber|whatsapp)\s+me\s+(at|on|@)\s*(\+?\d[\d\s().-]{5,}\d|@[a-z0-9_.]{3,})/;
const NUMBER_IS_RE = /\b(my|here('?s|\s+is)\s+my)\s+(number|digits|cell|mobile|phone)\s*(is|:|=)?\s*\+?\d[\d\s().-]{5,}\d/;
const DIGIT_RUN_RE = /\+?\d[\d\s().-]{5,}\d/g;

/** 8-15 digit runs that look like phone numbers (two plain 4-digit years / round numbers do not). */
function hasPhoneNumber(text: string): boolean {
  for (const m of text.match(DIGIT_RUN_RE) || []) {
    const digits = m.replace(/\D/g, '');
    if (digits.length < 8 || digits.length > 15) continue;
    const groups = m.trim().split(/[\s().+-]+/).filter(Boolean);
    // Lists of years (2019 2020) and round amounts (500 000, 1000 - 2000) are not phone numbers.
    const allYears = groups.length > 1 && groups.every((g) => g.length === 4 && Number(g) >= 1900 && Number(g) <= 2099);
    const roundAmounts = groups.length > 1 && groups.slice(1).every((g) => /^0+$/.test(g) || g.endsWith('00')) && groups[0].length <= 4;
    if (allYears || roundAmounts) continue;
    return true;
  }
  return false;
}

export interface ContactCheck {
  detected: boolean;
  /** Only found after normalization (leetspeak, split letters, invisible characters, spelled digits). */
  evasion: boolean;
  matches: string[];
}

function contactMatchesIn(letterForms: string[], digitForms: string[], collapsed: string | null, direct: boolean): string[] {
  const found: string[] = [];
  for (const form of letterForms) {
    for (const re of CONTACT_PLATFORM_PATTERNS) {
      const m = form.match(re);
      if (m) found.push(m[0]);
    }
  }
  if (collapsed) {
    for (const term of CONTACT_COLLAPSED_TERMS) if (collapsed.includes(term)) found.push(term);
  }
  for (const form of digitForms) {
    // Spelled-out " dot " / "(at)" are evasion, so they only count on the normalized pass.
    const dotted = direct ? form : form.replace(/\s*(?:\(dot\)|\[dot\]|\sdot\s)\s*/g, '.');
    for (const re of CONTACT_LINK_PATTERNS) {
      const m = dotted.match(re);
      if (m) found.push(m[0]);
    }
    for (const re of direct ? [EMAIL_RE, CALL_ME_AT_RE, NUMBER_IS_RE] : [EMAIL_RE, EMAIL_OBFUSCATED_RE, CALL_ME_AT_RE, NUMBER_IS_RE]) {
      const m = form.match(re);
      if (m) found.push(m[0]);
    }
    if (hasPhoneNumber(form)) found.push('phone number');
  }
  return Array.from(new Set(found));
}

export function detectContactSharing(text: string): ContactCheck {
  if (!text || typeof text !== 'string') return { detected: false, evasion: false, matches: [] };
  const n = normalizeForModeration(text);

  const direct = contactMatchesIn([n.plain], [n.plain], null, true);
  if (direct.length > 0) return { detected: true, evasion: false, matches: direct };

  const evasive = contactMatchesIn(
    n.variants,
    Array.from(new Set([n.cleaned, spellDigits(n.cleaned), unleetDigits(spellDigits(n.cleaned)), despace(spellDigits(n.cleaned))])),
    n.collapsed,
    false
  );
  return { detected: evasive.length > 0, evasion: evasive.length > 0, matches: evasive };
}

/** Patterns kept for callers that test raw text directly; detectContactSharing is the full check. */
export const CONTACT_DETECTION_PATTERNS: RegExp[] = [...CONTACT_PLATFORM_PATTERNS, ...CONTACT_LINK_PATTERNS, EMAIL_RE];

export function hasContactSharingIntent(text: string): boolean {
  return detectContactSharing(text).detected;
}

// ---------------------------------------------------------------------------
// Substantive-conversation gate (contact sharing unlocks after 3 messages each)
// ---------------------------------------------------------------------------

/**
 * Validates whether a message has meaningful substance.
 * Rejects single-word filler ("hi", "hey", "yo", "blah"), keysmashes, and repetitive loops.
 */
export function isSubstantiveMessage(text: string, minChars = 15): boolean {
  if (!text || typeof text !== 'string') return false;
  const trimmed = text.trim();
  if (trimmed.length < minChars) return false;

  const words = trimmed.toLowerCase().split(/\s+/).filter(Boolean);
  if (words.length < 3) return false;

  // Single repetitive word loops like "hi hi hi hi" or "blah blah blah blah"
  const uniqueWords = new Set(words);
  if (uniqueWords.size < 2) return false;

  const fillerRegex = /^(hi|hey|yo|hello|sup|blah|ok|k|cool|yes|no|good|haha|lol|nice|morning|night|test|asdf)[.!\s]*$/i;
  if (fillerRegex.test(trimmed)) return false;

  return true;
}

export interface SubstantiveTurnCheck {
  isUnlocked: boolean;
  senderSubstantiveCount: number;
  receiverSubstantiveCount: number;
  requiredTurns: number;
  minChars: number;
}

export function evaluateSubstantiveConversation(
  messages: Array<{ sender_id: string; content?: string }>,
  currentUserId: string,
  recipientId: string,
  minChars = 15,
  requiredTurns = 3
): SubstantiveTurnCheck {
  const validFromSender = new Set<string>();
  const validFromReceiver = new Set<string>();

  for (const m of messages) {
    const raw = (m.content || '').trim();
    if (!isSubstantiveMessage(raw, minChars)) continue;

    const normalized = raw.toLowerCase().replace(/\s+/g, ' ');

    if (m.sender_id === currentUserId) {
      validFromSender.add(normalized);
    } else if (m.sender_id === recipientId) {
      validFromReceiver.add(normalized);
    }
  }

  const senderSubstantiveCount = validFromSender.size;
  const receiverSubstantiveCount = validFromReceiver.size;
  const isUnlocked = senderSubstantiveCount >= requiredTurns && receiverSubstantiveCount >= requiredTurns;

  return {
    isUnlocked,
    senderSubstantiveCount,
    receiverSubstantiveCount,
    requiredTurns,
    minChars,
  };
}

// ---------------------------------------------------------------------------
// Scam / solicitation / harassment screening
// ---------------------------------------------------------------------------

export interface ModerationViolation {
  category: WordlistCategory;
  severity: Severity;
  matchedKeywords: string[];
}

export interface ModerationResult {
  isClean: boolean;
  violations: ModerationViolation[];
  /** 'high' -> quarantine, 'medium' -> deliver with a caution banner, null -> clean. */
  highestSeverity: Severity | null;
  flaggedPhrases: string[];
}

/** "not looking for a sugar daddy" is a boundary, not solicitation. */
function isNegated(text: string, matchIndex: number): boolean {
  const before = text.slice(Math.max(0, matchIndex - 35), matchIndex).trim();
  return /\b(not|never|no|don'?t|dont|won'?t|hate|against)\s*(looking\s*for\s*|into\s*|want\s*|a\s*)*(an?\s*)?$/.test(before);
}

const NEGATABLE = /^(sugar|nsa|escort)/;

export function evaluateMessageModeration(text: string): ModerationResult {
  const clean: ModerationResult = { isClean: true, violations: [], highestSeverity: null, flaggedPhrases: [] };
  if (!text || typeof text !== 'string') return clean;

  const n = normalizeForModeration(text);
  const byCategory = new Map<WordlistCategory, ModerationViolation>();
  const add = (category: WordlistCategory, severity: Severity, phrase: string) => {
    const v = byCategory.get(category) ?? { category, severity, matchedKeywords: [] };
    if (!v.matchedKeywords.includes(phrase)) v.matchedKeywords.push(phrase);
    byCategory.set(category, v);
  };

  for (const rule of MODERATION_WORDLISTS) {
    for (const re of rule.patterns) {
      for (const form of n.variants) {
        const g = new RegExp(re.source, 'g');
        let m: RegExpExecArray | null;
        while ((m = g.exec(form)) !== null) {
          if (m[0].length === 0) {
            g.lastIndex++;
            continue;
          }
          if (NEGATABLE.test(m[0]) && isNegated(form, m.index)) continue;
          add(rule.category, rule.severity, m[0].trim());
        }
      }
    }
  }
  for (const { term, category, severity } of COLLAPSED_ABUSE_TERMS) {
    if (n.collapsed.includes(term)) add(category, severity, term);
  }

  // A payment-rail mention inside an explicit scam request is already covered by financial_scam.
  if (byCategory.has('financial_scam')) byCategory.delete('wallet_mention');

  const violations = Array.from(byCategory.values());
  if (violations.length === 0) return clean;

  return {
    isClean: false,
    violations,
    highestSeverity: violations.some((v) => v.severity === 'high') ? 'high' : 'medium',
    flaggedPhrases: violations.flatMap((v) => v.matchedKeywords),
  };
}

// ---------------------------------------------------------------------------
// Public profile fields (bio, username, display name): contact details blocked
// ---------------------------------------------------------------------------

export interface ProfileContentResult {
  isValid: boolean;
  reason?: 'URL_DETECTED' | 'SOCIAL_HANDLE_DETECTED' | 'PHONE_DETECTED';
  errorMessage?: string;
}

const PROFILE_DOMAIN_RE = /\b[a-z0-9][a-z0-9-]*\.(?:com|net|org|asia|io|app|xyz|site|online|info|biz|link|live|ly|me|co|ph|gg|ru|cn)\b/i;
const USERNAME_HANDLE_RE = /^(?:tg|ig|fb|wa|sc|snap|line|kik)(?:_|$)|_(?:tg|ig|fb|wa|sc)$/;

export const PROFILE_CONTENT_MESSAGES = {
  URL_DETECTED: 'External links, emails and web domains are not permitted. Keep conversations on Meet in Asia for your safety.',
  SOCIAL_HANDLE_DETECTED: 'Social media handles and chat IDs are not allowed on public profiles.',
  PHONE_DETECTED: 'Phone numbers and direct contact details cannot be displayed on profiles.',
} as const;

/**
 * Live (client) and server check for public profile text, built on detectContactSharing (leetspeak,
 * split letters, spelled digits, "[dot]" obfuscation; years and round numbers are not phones).
 * `kind: 'username'` reads underscores as spaces, so "tg_john123" is checked like "tg john123".
 */
export function validateProfileContent(
  text: string | null | undefined,
  kind: 'text' | 'username' = 'text'
): ProfileContentResult {
  const raw = String(text ?? '');
  if (!raw.trim()) return { isValid: true };
  // Bare domains ("janelove.com"): a real dot with no spaces, so sentences like "family. My ..." pass.
  if (PROFILE_DOMAIN_RE.test(raw)) {
    return { isValid: false, reason: 'URL_DETECTED', errorMessage: PROFILE_CONTENT_MESSAGES.URL_DETECTED };
  }
  // Handle-style usernames ("tg_jane", "jane_ig").
  if (kind === 'username' && USERNAME_HANDLE_RE.test(raw.toLowerCase())) {
    return { isValid: false, reason: 'SOCIAL_HANDLE_DETECTED', errorMessage: PROFILE_CONTENT_MESSAGES.SOCIAL_HANDLE_DETECTED };
  }
  const input = kind === 'username' ? raw.replace(/_/g, ' ') : raw;
  const check = detectContactSharing(input);
  if (!check.detected) return { isValid: true };

  const found = check.matches.join(' ').toLowerCase();
  const reason: NonNullable<ProfileContentResult['reason']> = /phone number|\d{5,}|\b(call|text|ring|number|digits|cell|mobile)\b/.test(found)
    ? 'PHONE_DETECTED'
    : /https?:|www|@\S|\.[a-z]{2,}|\bdot\b/.test(found)
      ? 'URL_DETECTED'
      : 'SOCIAL_HANDLE_DETECTED';
  return { isValid: false, reason, errorMessage: PROFILE_CONTENT_MESSAGES[reason] };
}

/** Bios are public: any high-severity hit or contact detail is rejected outright. */
export function evaluateBioModeration(bio: string): { ok: boolean; reason?: string } {
  const text = String(bio || '');
  if (detectContactSharing(text).detected) {
    return {
      ok: false,
      reason: 'Please keep contact details (phone numbers, socials, messaging apps) out of your bio. You can share them in chat once you both have exchanged a few messages.',
    };
  }
  const mod = evaluateMessageModeration(text);
  if (mod.highestSeverity === 'high') {
    return { ok: false, reason: 'Your bio contains wording that is not allowed on Meet in Asia. Please revise it.' };
  }
  if (mod.violations.some((v) => v.category === 'harassment_insult')) {
    return { ok: false, reason: 'Please keep your bio friendly and respectful.' };
  }
  return { ok: true };
}
