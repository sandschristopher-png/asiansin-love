/**
 * Hardened Moderation & Reputation Engine for asiansin.love
 * Tuned with contextual lookback, zero-cost edge verification, and mutual substantive exchange gates.
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
  off_platform_early: {
    penalty: 15,
    action: 'warn' as ModerationAction,
    regex: /\b((add|message|chat|dm|pm|text|contact)\s*me\s*(on|via|at)?\s*(whatsapp|telegram|viber|line|tg|wa|wechat)|here('?s|\s+is)\s+(my\s+)?(whatsapp|telegram|viber|line|tg|wa|wechat)|(my|your)\s*(tg|viber|whatsapp|line|wechat)\s*(is|:)?|\b(whatsapp|telegram|viber|line|wechat|\btg\b)\s*[:#@]\s*[\w\+\.\-_]{4,}|\b(whatsapp|telegram|viber)\b[^.\n]{0,20}\b(\+|0)[\d\s-]{7,14}\b)\b/i,
  },
};

// Patterns for detecting external contact info sharing
export const CONTACT_DETECTION_PATTERNS = [
  /\b(whatsapp|telegram|viber|line|wechat|snapchat|signal|kakaotalk)\b/i,
  /\b(wa\.me|t\.me|telegram\.me|ig:|instagram\.com)\b/i,
  /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b/,
  /(?:(?:\+|00)[1-9]\d{0,2}[\s.-]?)?(?:\(?\d{2,4}\)?[\s.-]?)?\d{3,4}[\s.-]?\d{3,4}\b/,
  /\b(?:\d[\s.-]*){8,14}\d\b/,
  /\b((add|message|chat|text|contact)\s*me\s*(on|via|at)?\s*(ig|tg|wa)|my\s*(ig|tg|wa)\s*(is|:)?)\b/i,
];

export function hasContactSharingIntent(text: string): boolean {
  if (!text || typeof text !== 'string') return false;
  return CONTACT_DETECTION_PATTERNS.some((pattern) => pattern.test(text));
}

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

const MAX_PER_MESSAGE_PENALTY = 45;

function isSugarMatchNegated(text: string, matchIndex: number): boolean {
  const windowStart = Math.max(0, matchIndex - 35);
  const precedingSnippet = text.slice(windowStart, matchIndex).toLowerCase().trim();
  return /\b(not|never|no|don't|dont|not\s*looking\s*for|hate)\s*(looking\s*for\s*)?(a\s*)?$/i.test(precedingSnippet);
}

export function evaluateMessageModeration(
  text: string,
  isUnlocked = false
): ModerationResult {
  if (!text || typeof text !== 'string') {
    return { isClean: true, violations: [], totalDeduction: 0, recommendedAction: 'allow', flaggedPhrases: [] };
  }

  const violations: ModerationViolation[] = [];
  const allMatchedPhrases: string[] = [];

  for (const [key, rule] of Object.entries(MODERATION_RULES)) {
    // If the conversation is mature/unlocked, suppress off_platform_early warnings
    if (key === 'off_platform_early' && isUnlocked) {
      continue;
    }

    const globalRegex = new RegExp(rule.regex.source, 'gi');
    let match: RegExpExecArray | null;
    const matchedPhrases: string[] = [];

    while ((match = globalRegex.exec(text)) !== null) {
      const phrase = match[0];
      const matchIndex = match.index;

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
        action: rule.action,
      });
    }
  }

  if (violations.length === 0) {
    return { isClean: true, violations: [], totalDeduction: 0, recommendedAction: 'allow', flaggedPhrases: [] };
  }

  const hasSuspend = violations.some((v) => v.action === 'suspend');
  const hasShadowban = violations.some((v) => v.action === 'shadowban');

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
    flaggedPhrases: allMatchedPhrases,
  };
}

export function applyPenaltyToScore(currentScore: number, deduction: number): number {
  return Math.max(0, Math.min(100, currentScore - deduction));
}

export function detectFinancialSolicitation(text: string): {
  hasViolation: boolean;
  matchedKeywords: string[];
  category: string | null;
  action: ModerationAction;
  penalty: number;
} {
  const result = evaluateMessageModeration(text);
  const violation = result.violations.find((v) =>
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
