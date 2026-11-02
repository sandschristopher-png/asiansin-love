import type { RhythmValues } from '@/components/profile/RhythmBadges';

/**
 * Saves the bio (screened server-side) and rhythm badges through /api/profile. Bios can no longer
 * be written from the browser directly once 20261106_reputation_rhythm.sql runs.
 */
export async function saveBioAndRhythm(
  fields: { bio?: string } & Partial<RhythmValues>
): Promise<{ ok: true } | { ok: false; error: string }> {
  try {
    const res = await fetch('/api/profile', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(fields),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) return { ok: false, error: data.error || 'Could not save your profile.' };
    return { ok: true };
  } catch {
    return { ok: false, error: 'Network error. Please check your connection.' };
  }
}
