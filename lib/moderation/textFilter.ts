/**
 * Synchronous rule screen for public bios: links / domains, messenger handles, phone numbers,
 * emails and money terms. Runs on the client (instant feedback) and in PATCH /api/profile
 * (enforcement, HTTP 400). Wordlist-based conduct screening stays in lib/moderation.ts.
 *
 * Self-contained on purpose (no imports) so scripts/test-moderation.mjs can load it directly.
 */

export type BioRuleCategory = 'link' | 'messenger' | 'phone' | 'email' | 'financial';

export interface BioValidation {
  ok: boolean;
  category?: BioRuleCategory;
  /** The text that triggered the rule (for logs / tests; never shown verbatim to others). */
  match?: string;
  reason?: string;
}

export const BIO_REJECTION_MESSAGE = 'External links, social handles, and contact info are not permitted';

const TLDS = 'love|com|net|org|ph|th|io|me|co|app|ly|xyz|info|asia|vn|id|my|sg|kh|la|mm';

const RULES: { category: BioRuleCategory; re: RegExp }[] = [
  // Email addresses (also "name at gmail dot com")
  { category: 'email', re: /\b[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}\b/i },
  { category: 'email', re: /\b[a-z0-9._%+-]+\s*(?:\(at\)|\[at\]|\sat\s)\s*(?:gmail|yahoo|hotmail|outlook|icloud|proton(?:mail)?)\b/i },

  // URLs and domains: http(s)://, www., name.tld, name [dot] tld, name dot tld
  { category: 'link', re: /\bhttps?:\/\/\S+/i },
  { category: 'link', re: /\bwww\s*\.\s*\S+/i },
  { category: 'link', re: new RegExp(`\\b[a-z0-9-]{2,}\\s*(?:\\.|\\[\\s*dot\\s*\\]|\\(\\s*dot\\s*\\))\\s*(?:${TLDS})\\b`, 'i') },
  { category: 'link', re: new RegExp(`\\b[a-z0-9-]{2,}\\s+dot\\s+(?:${TLDS})\\b`, 'i') },
  { category: 'link', re: /\[\s*dot\s*\]|\(\s*dot\s*\)/i },

  // Messengers and social handles
  { category: 'messenger', re: /\b(?:whats\s*app|wh?atsapp|watsapp|telegram|wechat|we\s*chat|viber|kakao\s*talk|snap\s*chat|instagram|insta|facebook|messenger|tiktok)\b/i },
  { category: 'messenger', re: /\b(?:tg|ig|fb|wa)\b/i },
  { category: 'messenger', re: /\bline\s*(?:id|app)\b|\bline\s*[:@]|\b(?:add\s+me\s+on|me\s+on)\s+line\b/i },
  { category: 'messenger', re: /(?:^|\s)@[a-z0-9_.]{3,}/i },

  // Phone numbers: country codes or 7+ digits with common separators
  { category: 'phone', re: /\+\s?(?:63|66|1|84|62|60|65|855|856|95)[\s.-]?\d/ },
  { category: 'phone', re: /(?:\d[\s.()-]{0,2}){7,}/ },

  // Money / sponsorship
  { category: 'financial', re: /\b(?:g\s*cash|gcash|paypal|pay\s*pal|paymaya|maya\s*wallet|western\s*union|remitly|wise\s*transfer|crypto|bitcoin|btc|usdt|tether|binance|allowance|sponsor(?:ship|s|ing|ed)?|sugar\s*(?:daddy|baby))\b/i },
];

/** Returns the first rule a bio breaks, or { ok: true }. Empty bios are fine. */
export function validateBio(text: string): BioValidation {
  const value = String(text || '').normalize('NFKC').replace(/[​-‍﻿]/g, '');
  if (!value.trim()) return { ok: true };
  for (const rule of RULES) {
    const m = value.match(rule.re);
    if (m) {
      return { ok: false, category: rule.category, match: m[0].trim(), reason: BIO_REJECTION_MESSAGE };
    }
  }
  return { ok: true };
}
