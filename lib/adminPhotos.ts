import type { DbRow } from '@/lib/dbRows';

/**
 * Every photo a member has on file: the gallery plus the main photo (counted even when it is not in the gallery).
 * Blank entries do not count. A member with none is an empty account: it has nothing to review, so the admin
 * Photo Review queue, its "waiting" number and the Admin Console count all leave it out.
 */
export function photosOnFile(p: DbRow): string[] {
  const photos: string[] = Array.isArray(p.photos)
    ? p.photos.filter((u: unknown): u is string => typeof u === 'string' && u.trim() !== '')
    : [];
  if (typeof p.avatar_url === 'string' && p.avatar_url.trim() !== '' && !photos.includes(p.avatar_url)) {
    photos.unshift(p.avatar_url);
  }
  return photos;
}
