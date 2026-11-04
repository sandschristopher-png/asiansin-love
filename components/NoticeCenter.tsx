'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { useRouter } from 'next/navigation';
import { BadgeCheck, Bell, Eye, Heart, Megaphone, ShieldAlert, ShieldCheck, Sparkles, X } from 'lucide-react';
import { supabase } from '@/lib/supabase/client';

type Notice = {
  id: string;
  type: string;
  title?: string | null;
  description?: string | null;
  link_url?: string | null;
  payload?: Record<string, unknown> | null;
  is_read: boolean;
  created_at: string;
  actor?: { id?: string; username?: string; avatar_url?: string } | null;
};

type Tab = 'activity' | 'announcements';

/** Member-to-member interactions; everything else (system, verification, warnings, Plus) is an announcement. */
const ACTIVITY_TYPES = new Set(['match', 'mutual_match', 'spark', 'spark_received', 'favorite', 'visit', 'profile_visit']);

function describe(n: Notice): { Icon: React.ComponentType<{ className?: string }>; line: string; href: string } {
  const who = n.actor?.username?.replace(/^@/, '') || 'Someone';
  switch (n.type) {
    case 'match':
    case 'mutual_match':
      return { Icon: Heart, line: `You and ${who} matched`, href: n.actor?.id ? `/chat/${n.actor.id}` : '/favorites?tab=mutual' };
    case 'spark':
    case 'spark_received':
    case 'favorite':
      return { Icon: Sparkles, line: `${who} sparked your profile`, href: '/favorites?tab=sparked_you' };
    case 'visit':
    case 'profile_visit': {
      const count = Number(n.payload?.count ?? 1);
      return {
        Icon: Eye,
        line: count > 1 ? `${who} and ${count - 1} other${count > 2 ? 's' : ''} viewed your profile` : `${who} viewed your profile`,
        href: '/favorites?tab=visited',
      };
    }
    case 'verification':
    case 'photo_verified':
    case 'location_verified':
      return { Icon: BadgeCheck, line: n.title || 'Verification update', href: n.link_url || '/profile' };
    case 'plus_activated':
      return { Icon: ShieldCheck, line: n.title || 'AIL+ activated', href: n.link_url || '/plus' };
    case 'moderation_warning':
      return { Icon: ShieldAlert, line: n.title || String(n.payload?.reason ?? 'Community guidelines notice'), href: n.link_url || '/standards' };
    default:
      return { Icon: Megaphone, line: n.title || 'Notice from asiansin.love', href: n.link_url || '' };
  }
}

function timeAgo(iso: string): string {
  const s = Math.max(0, Math.floor((Date.now() - new Date(iso).getTime()) / 1000));
  if (s < 60) return 'now';
  if (s < 3600) return `${Math.floor(s / 60)}m`;
  if (s < 86400) return `${Math.floor(s / 3600)}h`;
  return `${Math.floor(s / 86400)}d`;
}

function NoticeRow({ notice, onOpen }: { notice: Notice; onOpen: (href: string) => void }) {
  const { Icon, line, href } = describe(notice);
  const avatar = ACTIVITY_TYPES.has(notice.type) ? notice.actor?.avatar_url : null;
  return (
    <li>
      <button
        type="button"
        onClick={() => href && onOpen(href)}
        disabled={!href}
        className="w-full flex items-start gap-3 px-4 py-3 text-left active:bg-[#FAF8FD] hover:bg-[#FAF8FD] transition-colors disabled:cursor-default"
      >
        {avatar ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={avatar} alt="" className="w-10 h-10 rounded-full object-cover shrink-0 bg-[#ECE8F4]" />
        ) : (
          <span className="w-10 h-10 rounded-full shrink-0 bg-gradient-to-br from-[#8C71F5]/10 to-[#EC4899]/10 flex items-center justify-center">
            <Icon className="w-[18px] h-[18px] text-[#8C71F5]" />
          </span>
        )}
        <span className="min-w-0 flex-1">
          <span className={`block text-sm leading-snug ${notice.is_read ? 'text-[#3A3350]' : 'font-semibold text-[#2D264B]'}`}>{line}</span>
          {notice.description && !ACTIVITY_TYPES.has(notice.type) && (
            <span className="mt-0.5 block text-xs text-neutral-500 leading-relaxed line-clamp-2">{notice.description}</span>
          )}
          <span className="mt-0.5 block text-[11px] text-neutral-400">{timeAgo(notice.created_at)}</span>
        </span>
        {!notice.is_read && <span aria-label="Unread" className="mt-1.5 w-2 h-2 rounded-full bg-[#EC4899] shrink-0" />}
      </button>
    </li>
  );
}

/**
 * with.is-style notice center: a header Bell with a pink unread dot, opening a bottom sheet with
 * Activity (matches, sparks, visits) and Announcements (system, verification, safety). Chat
 * messages never appear here: they live on the Messages tab (badge) and the /messages list.
 */
export function NoticeBell() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState<Tab>('activity');
  const [notices, setNotices] = useState<Notice[] | null>(null);
  const [mounted, setMounted] = useState(false);

  const load = useCallback(async () => {
    try {
      const r = await fetch('/api/notifications', { cache: 'no-store' });
      if (!r.ok) return;
      const d = await r.json();
      setNotices(Array.isArray(d.notifications) ? d.notifications : []);
    } catch {
      // offline: keep what we have
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- portal target exists only after mount
    setMounted(true);
    load();
    let channel: ReturnType<typeof supabase.channel> | null = null;
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) return;
      channel = supabase
        .channel(`notice-bell-${user.id}`)
        .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'notifications', filter: `user_id=eq.${user.id}` }, () => load())
        .subscribe();
    });
    return () => {
      if (channel) supabase.removeChannel(channel);
    };
  }, [load]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false);
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open]);

  const unread = (notices || []).filter((n) => !n.is_read);
  const hasUnread = unread.length > 0;
  const list = (notices || []).filter((n) => (tab === 'activity') === ACTIVITY_TYPES.has(n.type));
  const unreadIn = (t: Tab) => unread.some((n) => (t === 'activity') === ACTIVITY_TYPES.has(n.type));

  const openSheet = () => {
    // Land on the tab that has something new.
    setTab(!unreadIn('activity') && unreadIn('announcements') ? 'announcements' : 'activity');
    setOpen(true);
    if (hasUnread) fetch('/api/notifications', { method: 'POST' }).catch(() => {});
  };

  const closeSheet = () => {
    setOpen(false);
    // Opening marked everything read on the server; drop the dots locally once the sheet closes.
    setNotices((prev) => (prev ? prev.map((n) => ({ ...n, is_read: true })) : prev));
  };

  const go = (href: string) => {
    closeSheet();
    router.push(href);
  };

  const sheet = (
    <div className="fixed inset-0 z-[300] flex items-end justify-center" role="dialog" aria-modal="true" aria-label="Activity and notices">
      <button type="button" className="absolute inset-0 bg-[#1C1924]/35" aria-label="Close" onClick={closeSheet} />
      <div className="relative w-full max-w-[430px] mx-auto max-h-[80dvh] rounded-t-3xl bg-white shadow-xl flex flex-col">
        <div className="pt-2.5 pb-1 flex justify-center" aria-hidden>
          <span className="w-10 h-1 rounded-full bg-[#ECE8F4]" />
        </div>
        <header className="flex items-center justify-between px-4 pb-3">
          <h2 className="text-base font-bold text-[#2D264B]">Activity & Notices</h2>
          <button type="button" onClick={closeSheet} className="p-1.5 -mr-1.5 rounded-full hover:bg-[#FAF8FD]" aria-label="Close">
            <X className="w-5 h-5 text-neutral-500" />
          </button>
        </header>
        <div className="px-4 pb-3 border-b border-[#ECE8F4]">
          <div className="grid grid-cols-2 gap-1 rounded-full bg-[#FAF8FD] border border-[#ECE8F4] p-1" role="tablist">
            {(['activity', 'announcements'] as const).map((t) => (
              <button
                key={t}
                type="button"
                role="tab"
                aria-selected={tab === t}
                onClick={() => setTab(t)}
                className={`relative h-8 rounded-full text-xs font-semibold transition-colors ${
                  tab === t ? 'bg-[#2D264B] text-white shadow-2xs' : 'text-neutral-500 hover:text-[#2D264B]'
                }`}
              >
                {t === 'activity' ? 'Activity' : 'Announcements'}
                {tab !== t && unreadIn(t) && <span aria-hidden className="absolute top-1.5 right-4 w-1.5 h-1.5 rounded-full bg-[#EC4899]" />}
              </button>
            ))}
          </div>
        </div>
        <div className="flex-1 overflow-y-auto overscroll-contain pb-[env(safe-area-inset-bottom)]">
          {notices && list.length > 0 ? (
            <ul className="divide-y divide-[#ECE8F4]">
              {list.map((n) => (
                <NoticeRow key={n.id} notice={n} onOpen={go} />
              ))}
            </ul>
          ) : (
            <div className="py-16 px-6 text-center">
              <span className="mx-auto w-14 h-14 rounded-full bg-gradient-to-br from-[#8C71F5]/10 to-[#EC4899]/10 flex items-center justify-center">
                <Bell className="w-6 h-6 text-[#8C71F5]" aria-hidden />
              </span>
              <p className="mt-3 text-sm font-semibold text-[#2D264B]">All caught up</p>
              <p className="mt-1 text-xs text-neutral-500">No new notifications</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <>
      <button
        type="button"
        onClick={openSheet}
        aria-label={hasUnread ? 'Notifications (new)' : 'Notifications'}
        aria-haspopup="dialog"
        className="relative w-9 h-9 flex items-center justify-center rounded-full hover:bg-[#F3EFFC] text-[#2D264B] transition-colors"
      >
        <Bell className="w-5 h-5" />
        {hasUnread && <span aria-hidden className="absolute top-[7px] right-[8px] w-[7px] h-[7px] rounded-full bg-[#EC4899] ring-2 ring-white" />}
      </button>
      {/* Portal: the sticky header's backdrop-blur would otherwise trap position: fixed. */}
      {open && mounted && createPortal(sheet, document.body)}
    </>
  );
}

export default NoticeBell;
