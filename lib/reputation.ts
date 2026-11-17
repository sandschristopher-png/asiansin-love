/**
 * Reputation rules for Meet in Asia. Pure functions only: the routes apply the results through
 * the service-role RPCs (apply_moderation_penalty, admin_confirm_quarantine,
 * apply_reputation_recovery) so members can never write their own score.
 * Regression cases: scripts/test-reputation.mjs.
 */
import { detectContactSharing, evaluateMessageModeration } from './moderation';
import { evaluateMasterSafety, type SafetyCategory } from './safety/masterSafetyRules';

export const REPUTATION_RULES = {
  max: 100,
  default: 100,
  /** Scam, solicitation, explicit request, slur or threat: message quarantined. */
  highSeverity: 25,
  /** Payment-rail mention or insult: delivered with a caution banner. */
  mediumSeverity: 5,
  /** Obfuscated contact details (leetspeak, split letters...) before the contact gate unlocks. */
  contactEvasion: 5,
  /** Admin confirms a member report. */
  confirmedReport: 20,
  /** Admin confirms a quarantined message (on top of the automatic deduction). */
  quarantineConfirmed: 15,
  /** Per day of unflagged mutual chatting, capped at max. */
  dailyRecovery: 1,
  /** Below this, outgoing messages are rate limited and voice notes are off. */
  restrictedBelow: 70,
  restrictedMessagesPerHour: 5,
} as const;

export function clampScore(score: number): number {
  if (!Number.isFinite(score)) return REPUTATION_RULES.default;
  return Math.max(0, Math.min(REPUTATION_RULES.max, Math.round(score)));
}

export function scoreOf(raw: unknown): number {
  return typeof raw === 'number' ? clampScore(raw) : REPUTATION_RULES.default;
}

export function applyDeduction(score: number, deduction: number): number {
  return clampScore(score - Math.max(0, deduction));
}

/**
 * One recovery point per calendar day (UTC, 'YYYY-MM-DD'), only for a day with mutual chatting and
 * no moderation flags. Idempotent: a second call on the same day changes nothing.
 */
export function applyDailyRecovery(
  score: number,
  opts: { lastRecoveredOn: string | null; today: string; mutualChat: boolean; flaggedToday: boolean }
): { score: number; recovered: boolean } {
  const current = clampScore(score);
  const eligible =
    opts.mutualChat && !opts.flaggedToday && opts.lastRecoveredOn !== opts.today && current < REPUTATION_RULES.max;
  return eligible
    ? { score: clampScore(current + REPUTATION_RULES.dailyRecovery), recovered: true }
    : { score: current, recovered: false };
}

export function isRestricted(score: number): boolean {
  return clampScore(score) < REPUTATION_RULES.restrictedBelow;
}

/** Restricted senders get at most N outgoing messages per rolling hour. */
export function canSendMessage(score: number, sentInLastHour: number): boolean {
  return !isRestricted(score) || sentInLastHour < REPUTATION_RULES.restrictedMessagesPerHour;
}

export function canSendVoiceNote(score: number): boolean {
  return !isRestricted(score);
}

export type MessageOutcome = 'deliver' | 'deliver_with_warning' | 'quarantine' | 'soft_block' | 'hard_block';

export interface MessageDecision {
  outcome: MessageOutcome;
  deduction: number;
  /** moderation_log category, e.g. "financial_scam,commercial_solicitation" or "contact_evasion". */
  category: string | null;
  flagged: string[];
  /**
   * Warning-banner category for the recipient of a delivered message (solicitation, adult_content,
   * financial, harassment, off_platform), stored in message_safety_flags. Never sent to the sender.
   */
  safetyCategory?: string | null;
}

const MASTER_LOG_NAME: Record<SafetyCategory, string> = {
  0: 'zero_tolerance',
  1: 'sex_solicitation',
  2: 'adult_content_selling',
  3: 'financial_scam_dictionary',
  4: 'harassment_dictionary',
  5: 'off_platform_funnel',
};

const join = (...parts: Array<string | null | undefined>) => parts.filter(Boolean).join(',') || null;
const uniq = (xs: string[]) => Array.from(new Set(xs));

/** Banner category for the filters in lib/moderationWordlists.ts that deliver with a warning. */
function bannerForLegacy(category: string | null): string | null {
  if (!category) return null;
  if (/wallet|financial|crypto/.test(category)) return 'financial';
  if (/harass/.test(category)) return 'harassment';
  if (/solicit|explicit/.test(category)) return 'solicitation';
  return null;
}

/**
 * What /api/messages does with a text message, and how much reputation it costs. Two engines feed it:
 * the original wordlists (scams and solicitation are quarantined) and the master dictionary
 * (lib/safety/masterSafetyRules.ts). Zero tolerance blocks the send; otherwise the harsher outcome
 * wins and the larger deduction applies once (no double charge for the same message).
 */
export function decideMessageOutcome(text: string, contactUnlocked: boolean): MessageDecision {
  const master = evaluateMasterSafety(text);
  if (master.hardBlock) {
    return { outcome: 'hard_block', deduction: master.deduction, category: MASTER_LOG_NAME[0], flagged: uniq(master.terms), safetyCategory: null };
  }
  const legacy = legacyDecision(text, contactUnlocked);
  const masterCategory = master.categories.length ? master.categories.map((c) => MASTER_LOG_NAME[c]).join(',') : null;
  // Off-platform funneling only costs reputation while contact sharing is still locked.
  const masterDeduction = contactUnlocked ? master.deductionWithoutFunnel : master.deduction;
  const flagged = uniq([...legacy.flagged, ...master.terms]);

  if (legacy.outcome === 'quarantine' || legacy.outcome === 'soft_block') {
    return {
      ...legacy,
      deduction: Math.max(legacy.deduction, masterDeduction),
      category: join(legacy.category, masterCategory),
      flagged,
    };
  }

  const dictionaryHit = master.categories.some((c) => c >= 1 && c <= 4);
  if (dictionaryHit) {
    return {
      outcome: 'deliver_with_warning',
      deduction: Math.max(legacy.deduction, master.deductionWithoutFunnel),
      category: join(legacy.category, masterCategory),
      flagged,
      safetyCategory: master.banner,
    };
  }

  if (master.categories.includes(5)) {
    if (!contactUnlocked) {
      // Funneling before the contact gate opens is blocked like any contact sharing, at 4 per term.
      return { outcome: 'soft_block', deduction: Math.max(legacy.deduction, master.deduction), category: join(legacy.category, masterCategory), flagged };
    }
    return { ...legacy, flagged, category: join(legacy.category, masterCategory), safetyCategory: legacy.safetyCategory ?? 'off_platform' };
  }

  return legacy;
}

function legacyDecision(text: string, contactUnlocked: boolean): MessageDecision {
  const mod = evaluateMessageModeration(text);

  if (mod.highestSeverity === 'high') {
    const high = mod.violations.filter((v) => v.severity === 'high');
    return {
      outcome: 'quarantine',
      deduction: REPUTATION_RULES.highSeverity,
      category: high.map((v) => v.category).join(','),
      flagged: high.flatMap((v) => v.matchedKeywords),
    };
  }

  if (!contactUnlocked) {
    const contact = detectContactSharing(text);
    if (contact.detected) {
      return {
        outcome: 'soft_block',
        deduction: contact.evasion ? REPUTATION_RULES.contactEvasion : 0,
        category: contact.evasion ? 'contact_evasion' : 'contact_before_unlock',
        flagged: contact.matches,
      };
    }
  }

  if (mod.highestSeverity === 'medium') {
    const category = mod.violations.map((v) => v.category).join(',');
    return {
      outcome: 'deliver_with_warning',
      deduction: REPUTATION_RULES.mediumSeverity,
      category,
      flagged: mod.flaggedPhrases,
      safetyCategory: bannerForLegacy(category),
    };
  }

  return { outcome: 'deliver', deduction: 0, category: null, flagged: [], safetyCategory: null };
}

export type ReputationTier = 'good' | 'fair' | 'low';

export function reputationTier(score: number): { tier: ReputationTier; label: string } {
  const s = clampScore(score);
  if (s >= 90) return { tier: 'good', label: `${s}% Rep` };
  if (s >= REPUTATION_RULES.restrictedBelow) return { tier: 'fair', label: 'Fair Rep' };
  return { tier: 'low', label: 'Low Rep / Under Review' };
}
