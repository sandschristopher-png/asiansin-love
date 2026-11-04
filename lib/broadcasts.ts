/**
 * Admin broadcast announcements (public.announcements, 20261113_announcements.sql). Composed at
 * /admin/announcements, shown to every member at /announcements. A member has unread broadcasts
 * while the newest published_at is later than profiles.last_read_announcements_at.
 * (Per-member notices such as verification results stay in public.notifications: lib/announcements.ts.)
 */

export const BROADCAST_TAGS = ['Update', 'Feature', 'Safety', 'Notice'] as const;
export type BroadcastTag = (typeof BROADCAST_TAGS)[number];

export const BROADCAST_TITLE_MAX = 120;
export const BROADCAST_BODY_MAX = 4000;

export type Broadcast = {
  id: string;
  title: string;
  body: string;
  tag: BroadcastTag;
  is_pinned: boolean;
  author_id: string | null;
  published_at: string;
  created_at: string;
};

export const isBroadcastTag = (v: unknown): v is BroadcastTag => BROADCAST_TAGS.includes(v as BroadcastTag);

/** True while the newest broadcast is newer than the member's read marker (no marker = unread). */
export function hasUnreadBroadcast(latestPublishedAt: string | null | undefined, lastReadAt: string | null | undefined): boolean {
  if (!latestPublishedAt) return false;
  if (!lastReadAt) return true;
  return new Date(latestPublishedAt).getTime() > new Date(lastReadAt).getTime();
}

/** Supabase error for a table / column the migration has not created yet. */
export const MISSING_BROADCASTS_RE = /announcements|last_read_announcements_at/;
export const RUN_BROADCASTS_MIGRATION = 'Run supabase/migrations/20261113_announcements.sql to enable announcements.';
