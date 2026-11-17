import type { SafetyBanner } from './masterSafetyRules';

/**
 * "Report this message" rules, shared by the sheet (components/ReportModal.tsx) and
 * POST /api/reports. Reasons are the six the member sees; each maps to one banner category, and
 * each costs the reported member reputation at once (the same RPC as the automatic filters).
 */
export const REPORT_REASONS = [
  'financial_scam',
  'sex_solicitation',
  'adult_content',
  'inappropriate_content',
  'underage',
  'off_platform_steering',
] as const;
export type ReportReason = (typeof REPORT_REASONS)[number];

/** Immediate reputation cost of a report. Underage is zero tolerance and also freezes the account for review. */
export const REPORT_PENALTY = 10;
export const REPORT_PENALTY_UNDERAGE = 100;

export function reportPenalty(reason: string): number {
  return reason === 'underage' ? REPORT_PENALTY_UNDERAGE : REPORT_PENALTY;
}

const REASON_BANNER: Partial<Record<string, SafetyBanner>> = {
  financial_scam: 'financial',
  sex_solicitation: 'solicitation',
  adult_content: 'adult_content',
  inappropriate_content: 'harassment',
  off_platform_steering: 'off_platform',
};

/** The warning-banner category a report reason corresponds to (null for underage). */
export function reasonForCategory(reason: string): SafetyBanner | null {
  return REASON_BANNER[reason] ?? null;
}

/** One-line, 300-character copy of the reported message kept with the report. */
export function reportExcerpt(content: string | null | undefined): string {
  return String(content ?? '').replace(/\s+/g, ' ').trim().slice(0, 300);
}
