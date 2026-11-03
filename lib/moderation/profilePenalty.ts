// Server-only: reputation charges for profile text (bios, "looking for", highlight stories).
import { createHash } from 'crypto';
import type { SupabaseClient } from '@supabase/supabase-js';
import {
  isBlockingViolation,
  moderateProfileText,
  penaltyFor,
  type ModerationResult,
  type ProfileViolation,
} from '@/lib/moderation/profileModerator';

export interface ScreenedText {
  /** Column / slot name, e.g. "bio" or "highlight:<tag_id>". */
  field: string;
  raw: string;
  /** What is stored today (for "newly introduced" comparison). */
  previous: string | null;
  result: ModerationResult;
}

export function screenText(field: string, raw: string, previous: string | null): ScreenedText {
  return { field, raw, previous, result: moderateProfileText(raw) };
}

export const isBlocked = (s: ScreenedText) => s.result.violations.some(isBlockingViolation);

/** Violation types in the new text that the stored text did not already have. */
function newlyIntroduced(s: ScreenedText): ProfileViolation[] {
  const before = new Set(s.previous ? moderateProfileText(s.previous).violations : []);
  return s.result.violations.filter((v) => !before.has(v));
}

/** Stable id of one submitted text, stored in moderation_log.flagged_text for de-duplication. */
const fingerprint = (s: ScreenedText) =>
  'profile:' + createHash('sha256').update(`${s.field}\n${s.raw.trim()}`).digest('hex').slice(0, 16);

/**
 * Deducts reputation for violations newly introduced in this save (PHONE 10, URL 10, HANDLE 5,
 * PAYMENT 15, COMMERCIAL_SOLICITATION 25; max 25 per save) and records one moderation_log row.
 * A text that was already charged (same field + same text, by fingerprint) is never charged again,
 * so re-saving costs nothing. Returns the points deducted. Never throws.
 *
 * Writes the live moderation_log columns (user_id, actor_id, category, action, flagged_text,
 * points_deducted - see supabase/migrations/20261107_launch_patch.sql) with the service role.
 */
export async function chargeProfileViolations(
  admin: SupabaseClient,
  userId: string,
  items: ScreenedText[],
  action: 'profile_sanitized' | 'profile_blocked'
): Promise<number> {
  const candidates = items
    .map((s) => ({ s, fp: fingerprint(s), types: newlyIntroduced(s) }))
    .filter((c) => c.types.length > 0);
  if (candidates.length === 0) return 0;

  try {
    const { data: prior, error: logErr } = await admin
      .from('moderation_log')
      .select('flagged_text')
      .eq('user_id', userId)
      .like('flagged_text', '%profile:%')
      .order('created_at', { ascending: false })
      .limit(200);
    if (logErr) {
      // Without the history we cannot tell a re-save from a new violation: charge nothing.
      console.warn('[profilePenalty] moderation_log lookup failed, skipping charge:', logErr.message);
      return 0;
    }
    const seen = (prior || []).map((r) => String(r.flagged_text || ''));
    const fresh = candidates.filter((c) => !seen.some((t) => t.includes(c.fp)));
    if (fresh.length === 0) return 0;

    const types = [...new Set(fresh.flatMap((c) => c.types))];
    const points = penaltyFor(types);
    if (points <= 0) return 0;

    const { data: profile } = await admin.from('profiles').select('reputation_score').eq('id', userId).maybeSingle();
    const current = typeof profile?.reputation_score === 'number' ? profile.reputation_score : 100;
    const next = Math.max(0, current - points);

    const { error: repErr } = await admin.from('profiles').update({ reputation_score: next }).eq('id', userId);
    if (repErr) {
      console.error('[profilePenalty] reputation update failed:', repErr.message);
      return 0;
    }

    const flagged = fresh
      .map((c) => `${c.fp} ${c.s.field}: ${c.s.raw.replace(/\s+/g, ' ').slice(0, 80)}`)
      .join(' | ')
      .slice(0, 500);
    const { error: insErr } = await admin.from('moderation_log').insert({
      user_id: userId,
      actor_id: null,
      category: `profile_${types.map((t) => t.toLowerCase()).join(',')}`,
      action,
      flagged_text: flagged,
      points_deducted: points,
    });
    if (insErr) console.error('[profilePenalty] moderation_log insert failed:', insErr.message);

    return points;
  } catch (err) {
    console.error('[profilePenalty] charge failed:', err);
    return 0;
  }
}

/** Member-facing note after contact details were masked. */
export function sanitizedNotice(items: ScreenedText[]): string | null {
  const masked = new Set(items.flatMap((s) => s.result.violations.filter((v) => !isBlockingViolation(v))));
  if (masked.size === 0) return null;
  return 'We removed contact details (phone numbers, links or handles) from your profile. Share those in chat once you both unlock contact sharing.';
}
