import type { ComponentType } from 'react';
import { BadgeCheck, Megaphone, ShieldAlert, ShieldCheck } from 'lucide-react';

/**
 * Notification routing:
 *   - chat messages        -> Messages tab badge + /messages list
 *   - sparks / matches / views -> Sparks tab badge + /favorites
 *   - everything else (verification results, safety warnings, Plus, platform updates)
 *                          -> Announcements (side menu, /announcements)
 */
export const NON_ANNOUNCEMENT_TYPES = [
  'message',
  'match',
  'mutual_match',
  'spark',
  'spark_received',
  'favorite',
  'visit',
  'profile_visit',
] as const;

/** Fired by /announcements after marking notices read, so the side menu clears its dot. */
export const ANNOUNCEMENTS_READ_EVENT = 'ail:announcements-read';

/** PostgREST `not.in` list for the types above. */
export const NON_ANNOUNCEMENT_FILTER = `(${NON_ANNOUNCEMENT_TYPES.join(',')})`;

export type Announcement = {
  id: string;
  type: string;
  title?: string | null;
  description?: string | null;
  link_url?: string | null;
  payload?: Record<string, unknown> | null;
  is_read: boolean;
  created_at: string;
};

export function describeAnnouncement(n: Announcement): { Icon: ComponentType<{ className?: string }>; title: string; href: string | null } {
  switch (n.type) {
    case 'verification':
    case 'photo_verified':
    case 'location_verified':
      return { Icon: BadgeCheck, title: n.title || 'Verification update', href: n.link_url || '/profile' };
    case 'plus_activated':
      return { Icon: ShieldCheck, title: n.title || 'Plus activated', href: n.link_url || '/plus' };
    case 'moderation_warning':
      return { Icon: ShieldAlert, title: n.title || String(n.payload?.reason ?? 'Community guidelines notice'), href: n.link_url || '/standards' };
    default:
      return { Icon: Megaphone, title: n.title || 'Notice from asiansin.love', href: n.link_url || null };
  }
}
