export interface MaskResult {
  text: string;
  hasBlockedContent: boolean;
  blockedCount: number;
}

const REPLACEMENT = "[Hidden until 5 messages]";

const SAFETY_PATTERNS = [
  // Phone numbers: requires 8+ digits total in typical phone groupings
  /\+?\d{1,3}[-. (]*\d{2,4}[-. )]*\d{3,4}[-. ]*\d{3,5}/g,

  // Off-platform app handles — require an explicit separator (, :, @, -, id, is, at)
  /\b(?:whats\s?app|wa\.me|telegram|t\.me|we\s?chat|viber|snap\s?chat|instagram|insta)\b(?:\s*(?:id|is|at)?\s*[:@-]|\s+id\s+)\s*([a-zA-Z0-9_.-]{3,30})/gi,

  // LINE app — always needs a separator since "line" is a common word
  /(?:^|\s)line\s*(?:id\s*)?(?:[:@-]|is\s|at\s)\s*([a-zA-Z0-9_.-]{3,30})/gi,

  // Standalone social handles (@username)
  /(?<![a-zA-Z0-9_])@([a-zA-Z0-9_.]{3,30})/g,

  // Email addresses
  /[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+/g,

  // URLs
  /(?:https?:\/\/|www\.)\S+/gi,
];

/**
 * Masks off-platform contact details until the mutual message threshold is met.
 * IMPORTANT: call this server-side in the chat API with a DB-computed message
 * count — client-side use is cosmetic and trivially bypassed.
 */
export function applyContactRevealMask(
  content: string,
  mutualMessageCount: number,
  unlockThreshold: number = 5
): MaskResult {
  if (mutualMessageCount >= unlockThreshold || !content) {
    return { text: content, hasBlockedContent: false, blockedCount: 0 };
  }

  let maskedText = content;
  let matchesFound = 0;

  for (const pattern of SAFETY_PATTERNS) {
    maskedText = maskedText.replace(pattern, (match) => {
      if (/^\d{1,4}$/.test(match.trim())) return match;
      matchesFound++;
      return REPLACEMENT;
    });
  }

  return { text: maskedText, hasBlockedContent: matchesFound > 0, blockedCount: matchesFound };
}