'use client';

import Link from 'next/link';
import { Megaphone } from 'lucide-react';
import { AVATAR_IMAGE, supabaseImage } from '@/lib/images/supabaseImage';
import { NOTIFICATIONS_READ_EVENT } from '@/lib/notificationStore';

export type MemberNotification = {
  id: string;
  type: string;
  title: string | null;
  description: string | null;
  link_url: string | null;
  is_read: boolean;
  created_at: string;
  actor: { id: string; username: string | null; avatar_url: string | null } | null;
};

export function timeAgo(iso: string): string {
  const s = Math.max(0, (Date.now() - new Date(iso).getTime()) / 1000);
  if (s < 60) return 'now';
  if (s < 3600) return `${Math.floor(s / 60)}m`;
  if (s < 86400) return `${Math.floor(s / 3600)}h`;
  return `${Math.floor(s / 86400)}d`;
}

/** Where a row opens: link_url, except chats go to the thread and sparks / visits to the actor. */
export function notificationHref(n: MemberNotification): string {
  if (n.type === 'message' && n.actor) return `/chat/${n.actor.id}`;
  if ((n.type === 'visit' || n.type === 'favorite' || n.type === 'spark') && n.actor) return `/profile/${n.actor.id}`;
  return n.link_url || '/announcements';
}

/** Marks rows read on the server (fire and forget). */
export function markNotificationsRead(body: { ids: string[] } | { all: true }) {
  return fetch('/api/notifications', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
    .then(() => window.dispatchEvent(new Event(NOTIFICATIONS_READ_EVENT)))
    .catch(() => {});
}

/** Group label (Today / This week / Earlier): Discover pill typography (text-xs font-medium) with
 * Discover's uppercase label tracking (tracking-wider), on the pill row's py-2 rhythm. */
export const NOTIF_GROUP_LABEL = 'px-1 py-2 text-xs font-medium uppercase tracking-wider text-[#413B5E]/75';

/**
 * One notification row (bell panel and /notifications): circular actor avatar, single-line title,
 * time ago, unread dot; `highlighted` rows get the #8574B7/10 tint.
 */
export function NotificationRow({
  n,
  highlighted,
  onOpen,
  variant = 'card',
}: {
  n: MemberNotification;
  highlighted: boolean;
  /** card: bordered tile like a Discover pill (page); panel: borderless tile inside the bell panel. */
  variant?: 'card' | 'panel';
  onOpen: (n: MemberNotification) => void;
}) {
  return (
    <Link
      href={notificationHref(n)}
      onClick={() => onOpen(n)}
      className={`flex items-center gap-2.5 px-3.5 py-2 transition-colors ${
        variant === 'card' ? 'rounded-2xl border border-[#D0CDE1]' : 'rounded-xl'
      } ${highlighted ? 'bg-[#8574B7]/10' : variant === 'card' ? 'bg-white hover:bg-[#8574B7]/5' : 'hover:bg-[#8574B7]/5'}`}
    >
      {n.actor?.avatar_url ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={supabaseImage(n.actor.avatar_url, AVATAR_IMAGE)}
          alt=""
          width={36}
          height={36}
          className="w-9 h-9 rounded-full object-cover shrink-0 bg-[#E8E6F1]/60"
        />
      ) : (
        <span className="w-9 h-9 rounded-full shrink-0 bg-[#E8E6F1]/70 text-[#8574B7] flex items-center justify-center">
          <Megaphone className="w-4 h-4" aria-hidden />
        </span>
      )}
      <span className="min-w-0 flex-1">
        <span className="block text-[13px] font-medium text-[#413B5E] truncate">{n.title || n.description || 'Notification'}</span>
        <span className="block text-[11px] text-[#413B5E]/60">{timeAgo(n.created_at)}</span>
      </span>
      {highlighted && <span aria-label="Unread" className="w-2 h-2 rounded-full bg-[#8574B7] shrink-0" />}
    </Link>
  );
}
