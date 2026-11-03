import type { RhythmValues } from '@/components/profile/RhythmBadges';

type SaveResult =
  /** sanitized: fields whose saved text differs (contact details masked); notice: what to tell the member. */
  | { ok: true; sanitized?: Record<string, string>; notice?: string | null }
  | { ok: false; error: string; field?: string };

/**
 * Saves the member's own profile through PATCH /api/profile, which screens public text (bio,
 * "looking for", occupation) and writes only whitelisted columns with the service role.
 */
export async function saveProfileFields(fields: Record<string, unknown>): Promise<SaveResult> {
  try {
    const res = await fetch('/api/profile', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(fields),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) return { ok: false, error: data.error || 'Could not save your profile.', field: data.field };
    return { ok: true, sanitized: data.sanitized, notice: data.notice ?? null };
  } catch {
    return { ok: false, error: 'Network error. Please check your connection.' };
  }
}

/** Bio (screened server-side) + rhythm badges; members cannot write `bio` from the browser. */
export function saveBioAndRhythm(fields: { bio?: string } & Partial<RhythmValues>): Promise<SaveResult> {
  return saveProfileFields(fields);
}
