import { evaluateMasterSafety, foldForSafety } from '@/lib/safety/masterSafetyRules';

/**
 * Anti-solicitation for public text (profile bio and details, Moments): transactional-dating phrases, bill-paying
 * requests and payment rails. It sits on top of the master safety dictionary (lib/safety/masterSafetyRules.ts), which
 * already folds obfuscation ("g-c-a-s-h") and guards ordinary words ("maya"), and adds the phrases that dictionary does
 * not carry. Words that are also everyday language (provider, wise, sugar, tuition, crypto, sd, sb) only count with a
 * cue next to them, so "internet provider", "that is wise" and "no sugar in my coffee" never cost anyone a strike.
 *
 * Pure: no imports beyond the dictionary, so the strike rules below can be unit-tested (scripts/test-solicitation.mjs).
 */

export interface SolicitationVerdict {
  hit: boolean;
  /** Dictionary or phrase terms that matched (never the member's own text), for the moderation log. */
  terms: string[];
}

type Rule = {
  /** Space-separated tokens that must appear in a row. */
  phrase: string;
  /** If set, one of these tokens must also be in the same sentence. */
  cues?: readonly string[];
};

const SEEKING = ['looking', 'seeking', 'searching', 'wanted', 'want', 'need', 'needed', 'find'] as const;
const ASK = ['help', 'need', 'needed', 'pay', 'paying', 'send', 'support', 'sponsor', 'assist', 'cover', 'borrow', 'loan', 'fees'] as const;

const RULES: Rule[] = [
  // Transactional dating
  { phrase: 'provider mindset' },
  { phrase: 'provider type' },
  { phrase: 'provider', cues: SEEKING },
  { phrase: 'generous man', cues: SEEKING },
  { phrase: 'generous partner', cues: SEEKING },
  { phrase: 'generous guy', cues: SEEKING },
  { phrase: 'generous gentleman', cues: SEEKING },
  { phrase: 'spoil me' },
  { phrase: 'spoiling me' },
  { phrase: 'pamper me' },
  { phrase: 'sugar mommy' },
  { phrase: 'sugar mama' },
  { phrase: 'sugar relationship' },
  { phrase: 'sugar dating' },
  { phrase: 'sugar arrangement' },
  { phrase: 'mutually beneficial' },
  { phrase: 'arrangement', cues: ['sugar', 'mutually', 'beneficial', 'allowance', 'financial', 'generous', 'provider'] },
  { phrase: 'paypig' },
  { phrase: 'pay pig' },
  { phrase: 'findom' },
  { phrase: 'financial domination' },
  // Bill-paying and money requests
  { phrase: 'help with bills' },
  { phrase: 'help with my bills' },
  { phrase: 'help with rent' },
  { phrase: 'help with my rent' },
  { phrase: 'help paying bills' },
  { phrase: 'pay my bills' },
  { phrase: 'pay my rent' },
  { phrase: 'school fees', cues: ASK },
  { phrase: 'tuition', cues: ASK },
  { phrase: 'hospital bill', cues: ASK },
  { phrase: 'hospital bills', cues: ASK },
  { phrase: 'emergency money' },
  { phrase: 'borrow money' },
  { phrase: 'lend me money' },
  // Payment rails the dictionary does not carry (or only guards)
  { phrase: 'crypto', cues: ['send', 'sending', 'wallet', 'invest', 'investing', 'trading', 'trade', 'transfer', 'deposit', 'pay', 'payment', 'btc', 'usdt', 'bitcoin'] },
  { phrase: 'wise transfer' },
  { phrase: 'wise account' },
  { phrase: 'wise app' },
  { phrase: 'via wise' },
  { phrase: 'through wise' },
];

/** "p.r.o.v.i.d.e.r" and "g-c-a-s-h" fold to one token: a run of three or more single letters is joined. */
function tokensOf(sentence: string): string[] {
  const raw = sentence.split(/[^a-z0-9]+/).filter(Boolean);
  const out: string[] = [];
  for (let i = 0; i < raw.length; ) {
    let j = i;
    while (j < raw.length && raw[j].length === 1 && /[a-z]/.test(raw[j])) j++;
    if (j - i >= 3) {
      out.push(raw.slice(i, j).join(''));
      i = j;
    } else {
      out.push(raw[i]);
      i++;
    }
  }
  return out;
}

function hasRun(tokens: string[], phrase: string): boolean {
  const want = phrase.split(' ');
  for (let i = 0; i + want.length <= tokens.length; i++) {
    if (want.every((w, k) => tokens[i + k] === w)) return true;
  }
  return false;
}

/** Detects transactional, bill-paying and payment-rail language in one piece of public text. */
export function detectSolicitation(text: string): SolicitationVerdict {
  const terms: string[] = [];
  const raw = String(text ?? '');
  if (!raw.trim()) return { hit: false, terms };

  // 1. The master dictionary: transactional (1) and financial (3) categories. Others have their own paths.
  const verdict = evaluateMasterSafety(raw);
  for (const h of verdict.hits) if (h.category === 1 || h.category === 3) terms.push(h.term);

  // 2. The extra phrases, sentence by sentence so a cue in the next sentence never counts.
  const folded = foldForSafety(raw);
  for (const sentence of folded.split(/[.!?\n]+(?=\s|$)/)) {
    const tokens = tokensOf(sentence);
    if (tokens.length === 0) continue;
    for (const rule of RULES) {
      if (!hasRun(tokens, rule.phrase)) continue;
      if (rule.cues && !rule.cues.some((c) => tokens.includes(c))) continue;
      terms.push(rule.phrase);
    }
    // "sd" and "sb" are initials only when they come as a pair ("SD or SB", "sd/sb").
    if (tokens.includes('sd') && tokens.includes('sb')) terms.push('sd sb');
  }
  return { hit: terms.length > 0, terms: Array.from(new Set(terms)) };
}

// Strike numbers, messages and the "who is hidden" rule live in strikeRules.ts, which has no imports so client pages can
// use it without bundling the safety dictionary.
export * from '@/lib/moderation/strikeRules';
