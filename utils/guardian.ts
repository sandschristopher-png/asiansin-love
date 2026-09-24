export interface TriggerMatch {
  matchedTerm: string
  category: 'wallet' | 'micro_request' | 'emergency' | 'off_platform' | 'crypto'
  severity: 'critical' | 'high' | 'medium'
  warningTitle: string
  warningAdvice: string
}

const TRIGGER_RULES: { pattern: RegExp; category: TriggerMatch['category']; severity: TriggerMatch['severity']; advice: string }[] = [
  // Wallets & Transfers
  {
    pattern: /\b(gcash|g-cash|paymaya|maya|palawan express|cebuana|mlhuillier|western union|moneygram|promptpay|aba pay|momo wallet)\b/i,
    category: 'wallet',
    severity: 'critical',
    advice: 'Never send money, cash remittances, or mobile wallet transfers to someone you have not met in person.',
  },
  // Mobile Load & Micro-Requests
  {
    pattern: /\b(send load|buy load|regular load|prepaid load|pasaload|fare to visit|taxi fare)\b/i,
    category: 'micro_request',
    severity: 'high',
    advice: 'Asking for mobile phone load or travel fares is a common small-scale solicitation pattern.',
  },
  // Emergency & Family Hard-Luck
  {
    pattern: /\b(hospital bill|confinement|medicine money|sick mother|sick mama|sick baby|pawn ticket|sangla)\b/i,
    category: 'emergency',
    severity: 'high',
    advice: 'Sudden emergencies involving hospitalizations or sick family members are classic romance manipulation scripts.',
  },
  // Crypto & Investment
  {
    pattern: /\b(crypto|usdt|binance|metatrader|mt5|trading platform|uncle teaches me|invest)\b/i,
    category: 'crypto',
    severity: 'critical',
    advice: 'Never deposit funds into third-party trading sites or accept cryptocurrency investment suggestions.',
  },
  // Off-Platform Diversion
  {
    pattern: /\b(whatsapp|telegram|viber|add my wa|line id|chat on wa)\b/i,
    category: 'off_platform',
    severity: 'medium',
    advice: 'Scammers frequently push to external apps to evade platform protections and security oversight.',
  },
]

export function scanMessageForTriggers(content: string): TriggerMatch | null {
  for (const rule of TRIGGER_RULES) {
    const match = content.match(rule.pattern)
    if (match) {
      return {
        matchedTerm: match[0],
        category: rule.category,
        severity: rule.severity,
        warningTitle: rule.severity === 'critical' ? 'Urgent Financial Safety Alert' : 'Caution: High-Risk Message Content',
        warningAdvice: rule.advice,
      }
    }
  }
  return null
}

export function containsEarlyOffPlatformInfo(rawText: string): boolean {
  // Normalize leetspeak and strip punctuation/spacing
  const cleaned = rawText
    .toLowerCase()
    .replace(/[@]/g, 'a')
    .replace(/[0]/g, 'o')
    .replace(/[1!]/g, 'i')
    .replace(/[\s\-_.,/|\\]+/g, '')

  // Detect 10-13 digit clusters (mobile numbers, PH formats starting with 09 / +639)
  const phonePattern = /(\+?63|0)9\d{9}/
  const digitCluster = rawText.replace(/\D/g, '')
  if (digitCluster.length >= 10 && digitCluster.length <= 13) return true
  if (phonePattern.test(cleaned)) return true

  // Detect off-platform app names and link formats even with punctuation tricks
  const offPlatformPattern = /(whatsapp|whats|whatapp|telegram|viber|lineid|wechat|snapchat|fb\.me|wa\.me|t\.me)/
  if (offPlatformPattern.test(cleaned)) return true

  return false
}
