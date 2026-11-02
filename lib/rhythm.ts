/**
 * "Rhythm" profile badges: reply pace, relocation readiness and timeline intent.
 * Values must match the CHECK constraints in supabase/migrations/20261106_reputation_rhythm.sql.
 *
 * These are new enum columns rather than the older free-text `relocation`, `relocation_intent`
 * and `marriage_timeline` columns, which hold mixed labels and auto-filled defaults that a CHECK
 * constraint would reject. The old columns are left untouched.
 */

export interface RhythmOption<V extends string = string> {
  value: V;
  emoji: string;
  label: string;
}

export const REPLY_PACE_OPTIONS = [
  { value: 'fast_replier', emoji: '⚡', label: 'Fast Replier' },
  { value: 'evenings_only', emoji: '🌙', label: 'Evenings & Weekends' },
  { value: 'slow_thoughtful', emoji: '🐢', label: 'Slow & Thoughtful' },
  { value: 'prefers_calls', emoji: '📞', label: 'Prefers Voice Calls' },
] as const satisfies readonly RhythmOption[];

export const RELOCATION_READINESS_OPTIONS = [
  { value: 'open_to_relocate', emoji: '✈️', label: 'Open to Relocate' },
  { value: 'prefer_partner_relocate', emoji: '🏡', label: 'Partner Relocates' },
  { value: 'rooted_in_city', emoji: '📍', label: 'Rooted in My City' },
] as const satisfies readonly RhythmOption[];

export const TIMELINE_INTENT_OPTIONS = [
  { value: 'marriage_1_2_years', emoji: '💍', label: 'Marriage in 1-2 Years' },
  { value: 'long_term_dating', emoji: '💞', label: 'Long-term Dating' },
  { value: 'exploring', emoji: '🌱', label: 'Exploring' },
] as const satisfies readonly RhythmOption[];

export type ReplyPace = (typeof REPLY_PACE_OPTIONS)[number]['value'];
export type RelocationReadiness = (typeof RELOCATION_READINESS_OPTIONS)[number]['value'];
export type TimelineIntent = (typeof TIMELINE_INTENT_OPTIONS)[number]['value'];

export const RHYTHM_FIELDS = {
  reply_pace: REPLY_PACE_OPTIONS,
  relocation_readiness: RELOCATION_READINESS_OPTIONS,
  timeline_intent: TIMELINE_INTENT_OPTIONS,
} as const;

export type RhythmField = keyof typeof RHYTHM_FIELDS;

export function rhythmOption(field: RhythmField, value: unknown): RhythmOption | null {
  return (RHYTHM_FIELDS[field] as readonly RhythmOption[]).find((o) => o.value === value) ?? null;
}

export function isRhythmValue(field: RhythmField, value: unknown): boolean {
  return rhythmOption(field, value) !== null;
}

/** profiles.languages / interests may be an array or a comma-separated string. */
export function toList(v: unknown): string[] {
  const raw = Array.isArray(v) ? v : typeof v === 'string' ? v.split(',') : [];
  return raw.map((x) => String(x || '').trim()).filter(Boolean);
}

/** Interests + languages both members share (case-insensitive, their spelling kept). */
export function sharedTraits(
  viewer: { interests?: unknown; languages?: unknown },
  target: { interests?: unknown; languages?: unknown }
): string[] {
  const mine = new Set([...toList(viewer.interests), ...toList(viewer.languages)].map((s) => s.toLowerCase()));
  const seen = new Set<string>();
  const out: string[] = [];
  for (const item of [...toList(target.interests), ...toList(target.languages)]) {
    const key = item.toLowerCase();
    if (mine.has(key) && !seen.has(key)) {
      seen.add(key);
      out.push(item);
    }
  }
  return out;
}
