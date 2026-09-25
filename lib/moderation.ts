// lib/moderation.ts

export const FINANCIAL_SOLICITATION_PATTERNS: RegExp[] = [
  // Payment Apps & Wallets (Philippines, Thailand, Regional, Crypto)
  /\bg[\s._-]?cash\b/i,
  /\bpaymaya\b/i,
  /\bmaya\s*app\b/i,
  /\bprompt[\s._-]?pay\b/i,
  /\bremitly\b/i,
  /\bworldremit\b/i,
  /\bwestern\s*union\b/i,
  /\bmoneygram\b/i,
  /\bwise[\s._-]?transfer\b/i,
  /\busdt\b/i,
  /\bcrypto\b/i,
  /\bbinance\b/i,
  /\bpalawan\s*(pawnshop|express)?\b/i,
  /\bcebuana\b/i,

  // Direct Financial Requests & Allowance Jargon
  /\b(send|give|need|lend|borrow)\s+(me\s+)?(some\s+)?(money|cash|funds|pesos?|dollars?|php|usd)\b/i,
  /\bmonthly\s*allowance\b/i,
  /\bfinancial\s*(help|support|assistance)\b/i,
  /\bhelp\s+me\s+financially\b/i,
  /\bbuy\s+me\s+(food|groceries|load)\b/i,
  /\bsend\s+(load|regular\s*load)\b/i,

  // Common Emergency / Distress Scripts
  /\b(pay|help\s+with)\s+(my\s+)?(rent|tuition|electric(ity)?|water)\s*bill\b/i,
  /\bhospital\s*(bill|expenses?)\b/i,
  /\bmedicine\s*(for\s+my|money)\b/i,
  /\bsick\s*(mom|mother|dad|father|child|baby|kid)\b/i,
  /\bemergency\s*(money|funds?|cash)\b/i,

  // Bank & Account Solicitation
  /\b(send|transfer)\s+to\s+my\s+(bank|account|number)\b/i,
  /\baccount\s*number\s*:\s*\d+/i,
  /\bgcash\s*no\b/i,
];

export function detectFinancialSolicitation(text: string): { hasViolation: boolean; matchedTerm?: string } {
  const normalized = text.trim();
  for (const pattern of FINANCIAL_SOLICITATION_PATTERNS) {
    if (pattern.test(normalized)) {
      return { hasViolation: true, matchedTerm: pattern.source };
    }
  }
  return { hasViolation: false };
}
