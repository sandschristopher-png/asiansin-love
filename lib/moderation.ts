/**
 * Hardened Moderation & Reputation Engine for asiansin.love
 * Tuned with contextual lookback and strict SEA phone pattern matching.
 */

export type ModerationAction = 'allow' | 'warn' | 'shadowban' | 'suspend';

export interface ModerationViolation {
  category:
    | 'explicit_media_request'
    | 'wallet_remittance'
    | 'financial_begging'
    | 'solicitation_sexpat'
    | 'crypto_pig_butchering'
    | 'off_platform_early';
  penalty: number;
  matchedKeywords: string[];
  action: ModerationAction;
}

export interface ModerationResult {
  isClean: boolean;
  violations: ModerationViolation[];
  totalDeduction: number;
  recommendedAction: ModerationAction;
  flaggedPhrases: string[];
}

export const MODERATION_RULES = {
  // 1. Explicit Photo Demands & Nude Solicitation (-40 pts, quarantine/shadowban)
  explicit_media_request: {
    penalty: 40,
    action: 'shadowban' as ModerationAction,
    regex: /\b(send\s*nudes?|naked\s*(pics?|photos?)|nude\s*(pics?|photos?)|bold\s*(pics?|photos?)|spicy\s*(pics?|photos?)|pics?\s*without\s*clothes|take\s*off\s*(your\s*)?clothes|show\s*(me\s*)?(your\s*)?body|boob\s*pics?|send\s*(tits|pussy|dick)|dick\s*pic|show\s*(your\s*)?(pussy|chest|private\s*parts)|strip\s*on\s*cam|video\s*call\s*naked|pic\s*trade|nude\s*trade)\b/i,
  },

  // 2. Regional Mobile Wallets & Begging Rails (-35 pts, warn)
  wallet_remittance: {
    penalty: 35,
    action: 'warn' as ModerationAction,
    regex: /\b(gcash|g-cash|paymaya|maya\.ph|promptpay|prompt\s*pay|truemoney|true\s*wallet|aba\s*(pay|bank)|wing\s*bank|bakong|momo\s*wallet|zalopay|viettelpay|duitnow|palawan\s*express|cebuana|mlhuillier|western\s*union|moneygram|remitly|worldremit|pasaload|send\s*load)\b/i,
  },

  // 3. Direct Financial Begging & Hardship Traps (-30 pts, warn)
  financial_begging: {
    penalty: 30,
    action: 'warn' as ModerationAction,
    regex: /\b(send\s*pamasahe|fare\s*money|money\s*for\s*(my\s*)?rent|help\s*with\s*(my\s*)?rent|hospital\s*bills?|urgent\s*money|need\s*financial\s*(help|support)|monthly\s*allowance|looking\s*for\s*(a\s*)?sponsor|need\s*(a\s*)?sponsor|spoil\s*me\s*financially|generous\s*(man|guy))\b/i,
  },

  // 4. Sexpat & Escort Solicitation (-45 pts, quarantine/shadowban)
  solicitation_sexpat: {
    penalty: 45,
    action: 'shadowban' as ModerationAction,
    regex: /\b(bar\s*fine|barfine|what('?s|\s+is)\s+your\s+rate\b|(my|your)\s*rates?\s*(for\s*(the\s*)?(night|hour|date))|hourly\s*rate|overnight\s*rate|short\s*time|long\s*time|pay\s*per\s*meet|\bppm\b|sugar\s*baby|sugar\s*daddy|nsa\s*arrangement|freelance\s*(girl|escort|worker)|happy\s*ending\s*massage|outcall\s*service|incall\s*service)\b/i,
  },

  // 5. Crypto Pig Butchering (Token + guaranteed return/yield within proximity)
  crypto_pig_butchering: {
    penalty: 80,
    action: 'suspend' as ModerationAction,
    regex: /\b(crypto|forex|usdt|binance|metamask|trading)\b.{1,45}\b(invest(ment)?|guaranteed?\s*(profit|returns?)|daily\s*yield|passive\s*income|deposit)\b|\b(invest(ment)?|guaranteed?\s*(profit|returns?)|daily\s*yield|passive\s*income|deposit)\b.{1,45}\b(crypto|forex|usdt|binance|metamask|trading)\b/i,
  },

  // 6. Premature Off-Platform Funneling
  // Anchored to (+ or 0) for phone numbers within 20 chars of app name
  off_platform_early: {
    penalty: 15,
    action: 'warn' as ModerationAction,
    regex: /\b((add|message|chat|dm|pm|text|contact)\s*me\s*(on|via|at)?\s*(whatsapp|telegram|viber|line|tg|wa)|here('?s|\s+is)\s+(my\s+)?(whatsapp|telegram|viber|line|tg|wa)|(my|your)\s*(tg|viber|whatsapp|line)\s*(is|:)?|\b(whatsapp|telegram|viber|line|\btg\b)\s*[:#@]\s*[\w\+\.\-_]{4,}|\b(whatsapp|telegram|viber)\b[^.\n]{0,20}\b(\+|0)[\d\s-]{7,14}\b)\b/i,
  }
};

const MAX_PER_MESSAGE_PENALTY = 45;

/**
 * Checks if a specific "sugar baby/daddy" match is preceded by a direct negation within 35 characters
 */
function isSugarMatchNegated(text: string, matchIndex: number): boolean {
  const windowStart = Math.max(0, matchIndex - 35);
  const precedingSnippet = text.slice(windowStart, matchIndex).toLowerCase().trim();
  return /\b(not|never|no|don't|dont|not\s*looking\s*for|hate)\s*(looking\s*for\s*)?(a\s*)?$/i.test(precedingSnippet);
}

/**
 * Server-side evaluation of inbound text
 */
export function evaluateMessageModeration(text: string): ModerationResult {
  if (!text || typeof text !== 'string') {
    return { isClean: true, violations: [], totalDeduction: 0, recommendedAction: 'allow', flaggedPhrases: [] };
  }

  const violations: ModerationViolation[] = [];
  const allMatchedPhrases: string[] = [];

  for (const [key, rule] of Object.entries(MODERATION_RULES)) {
    const globalRegex = new RegExp(rule.regex.source, 'gi');
    let match: RegExpExecArray | null;
    const matchedPhrases: string[] = [];

    while ((match = globalRegex.exec(text)) !== null) {
      const phrase = match[0];
      const matchIndex = match.index;

      // Apply contextual proximity negation check for sugar daddy/baby
      if (key === 'solicitation_sexpat' && /sugar\s*(baby|daddy)/i.test(phrase)) {
        if (isSugarMatchNegated(text, matchIndex)) {
          continue;
        }
      }

      matchedPhrases.push(phrase);
    }

    if (matchedPhrases.length > 0) {
      const uniqueMatches = Array.from(new Set(matchedPhrases));
      allMatchedPhrases.push(...uniqueMatches);

      violations.push({
        category: key as ModerationViolation['category'],
        penalty: rule.penalty,
        matchedKeywords: uniqueMatches,
        action: rule.action
      });
    }
  }

  if (violations.length === 0) {
    return { isClean: true, violations: [], totalDeduction: 0, recommendedAction: 'allow', flaggedPhrases: [] };
  }

  const hasSuspend = violations.some(v => v.action === 'suspend');
  const hasShadowban = violations.some(v => v.action === 'shadowban');

  const rawDeduction = violations.reduce((acc, v) => acc + v.penalty, 0);
  const totalDeduction = hasSuspend ? 100 : Math.min(MAX_PER_MESSAGE_PENALTY, rawDeduction);

  const recommendedAction: ModerationAction = hasSuspend
    ? 'suspend'
    : hasShadowban
      ? 'shadowban'
      : 'warn';

  return {
    isClean: false,
    violations,
    totalDeduction,
    recommendedAction,
    flaggedPhrases: allMatchedPhrases
  };
}

export function applyPenaltyToScore(currentScore: number, deduction: number): number {
  return Math.max(0, Math.min(100, currentScore - deduction));
}

/**
 * Backward compatibility export for legacy route imports
 */
export function detectFinancialSolicitation(text: string): {
  hasViolation: boolean;
  matchedKeywords: string[];
  category: string | null;
  action: ModerationAction;
  penalty: number;
} {
  const result = evaluateMessageModeration(text);
  const violation = result.violations.find(v =>
    v.category === 'wallet_remittance' ||
    v.category === 'financial_begging' ||
    v.category === 'crypto_pig_butchering'
  );
  return {
    hasViolation: !result.isClean,
    matchedKeywords: result.flaggedPhrases,
    category: violation ? violation.category : null,
    action: result.recommendedAction,
    penalty: result.totalDeduction,
  };
}