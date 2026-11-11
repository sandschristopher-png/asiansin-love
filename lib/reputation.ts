/**
 * Reputation rules for Meet in Asia. Pure functions only: the routes apply the results through
 * the service-role RPCs (apply_moderation_penalty, admin_confirm_quarantine,
 * apply_reputation_recovery) so members can never write their own score.
 * Regression cases: scripts/test-reputation.mjs.
 */
import { detectContactSharing, evaluateMessageModeration } from './moderation';

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

export type MessageOutcome = 'deliver' | 'deliver_with_warning' | 'quarantine' | 'soft_block';

export interface MessageDecision {
  outcome: MessageOutcome;
  deduction: number;
  /** moderation_log category, e.g. "financial_scam,commercial_solicitation" or "contact_evasion". */
  category: string | null;
  flagged: string[];
}

/** What /api/messages does with a text message, and how much reputation it costs. */
export function decideMessageOutcome(text: string, contactUnlocked: boolean): MessageDecision {
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
    return {
      outcome: 'deliver_with_warning',
      deduction: REPUTATION_RULES.mediumSeverity,
      category: mod.violations.map((v) => v.category).join(','),
      flagged: mod.flaggedPhrases,
    };
  }

  return { outcome: 'deliver', deduction: 0, category: null, flagged: [] };
}

export type ReputationTier = 'good' | 'fair' | 'low';

export function reputationTier(score: number): { tier: ReputationTier; label: string } {
  const s = clampScore(score);
  if (s >= 90) return { tier: 'good', label: `${s}% Rep` };
  if (s >= REPUTATION_RULES.restrictedBelow) return { tier: 'fair', label: 'Fair Rep' };
  return { tier: 'low', label: 'Low Rep / Under Review' };
}
