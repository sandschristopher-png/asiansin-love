'use client';

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Bell } from 'lucide-react';
import { CountChip } from '@/components/admin/AdminPendingChip';
import { cachedUnread, setCachedUnread } from '@/lib/headerProfileStore';
import { NOTIFICATIONS_CHANGED_EVENT } from '@/lib/notificationStore';
import { useLocale } from '@/components/i18n/LocaleProvider';
import { NOTIF_GROUP_LABEL, NotificationRow, markNotificationsRead, type MemberNotification } from '@/components/notifications/NotificationRow';

const FRESH_URL = '/api/notifications?scope=all&fresh=1&limit=40';

/**
 * Header bell (left of the account avatar) + its Notifications panel.
 *   - Chip = unread count only (hidden at zero).
 *   - Panel lists unread rows first, then read rows from the last 7 days; "See all" -> /notifications.
 *   - Opening marks the shown rows read (they keep their tint until the panel closes); new rows
 *     arriving while it is open (RealtimeNotifier fires NOTIFICATIONS_CHANGED_EVENT) appear on top.
 * The panel is positioned against the nearest relative ancestor (the header's right-hand group),
 * so on a 360px phone it still fits inside the screen.
 */
export function NotificationBell() {
  const { t } = useLocale();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [unread, setUnread] = useState(0);
  // Last known count before first paint, so a remounted header does not pop the chip in from zero.
  useLayoutEffect(() => {
    setUnread(cachedUnread());
  }, []);
  useEffect(() => {
    setCachedUnread(unread);
  }, [unread]);
  const [items, setItems] = useState<MemberNotification[] | null>(null);
  // Rows that were unread when shown in this open session: they keep the tint + dot until close.
  const [tinted, setTinted] = useState<Set<string>>(new Set());
  const buttonRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const openRef = useRef(false);
  openRef.current = open;

  const loadPanel = useCallback(async () => {
    const res = await fetch(FRESH_URL, { cache: 'no-store' }).catch(() => null);
    if (!res?.ok) return;
    const j = await res.json();
    const rows = (j.notifications ?? []) as MemberNotification[];
    setItems(rows);
    const unreadIds = rows.filter((n) => !n.is_read).map((n) => n.id);
    if (unreadIds.length) {
      setTinted((prev) => new Set([...prev, ...unreadIds]));
      void markNotificationsRead({ ids: unreadIds });
    }
    setUnread(Math.max(0, (Number(j.unread_count) || 0) - unreadIds.length));
  }, []);

  const loadCount = useCallback(async () => {
    const res = await fetch(FRESH_URL.replace('limit=40', 'limit=1'), { cache: 'no-store' }).catch(() => null);
    if (!res?.ok) return;
    const j = await res.json();
    setUnread(Number(j.unread_count) || 0);
  }, []);

  // Chip: on mount, on route change, and whenever a new notifications row may have arrived.
  useEffect(() => {
    void loadCount();
  }, [loadCount, pathname]);
  useEffect(() => {
    const onChange = () => void (openRef.current ? loadPanel() : loadCount());
    window.addEventListener(NOTIFICATIONS_CHANGED_EVENT, onChange);
    return () => window.removeEventListener(NOTIFICATIONS_CHANGED_EVENT, onChange);
  }, [loadCount, loadPanel]);

  // Close on route change, outside tap and Escape.
  useEffect(() => {
    setOpen(false);
  }, [pathname]);
  useEffect(() => {
    if (!open) return;
    const onDown = (e: PointerEvent) => {
      const target = e.target as Node;
      if (panelRef.current?.contains(target) || buttonRef.current?.contains(target)) return;
      setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false);
    document.addEventListener('pointerdown', onDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('pointerdown', onDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  useEffect(() => {
    if (open) void loadPanel();
    else setTinted(new Set());
  }, [open, loadPanel]);

  const markAll = () => {
    setTinted(new Set());
    setUnread(0);
    setItems((prev) => prev?.map((n) => ({ ...n, is_read: true })) ?? prev);
    void markNotificationsRead({ all: true });
  };

  return (
    <>
      <button
        ref={buttonRef}
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-label={unread > 0 ? `${t('nav.notifications')}, ${unread} unread` : t('nav.notifications')}
        aria-haspopup="dialog"
        aria-expanded={open}
        className="w-9 h-9 flex items-center justify-center rounded-full bg-[#E8E6F1]/70 text-[#8574B7] transition-opacity hover:opacity-90 relative"
      >
        <Bell className="w-5 h-5" aria-hidden />
        <CountChip count={unread} label={`${unread} unread`} className="absolute -top-1 -right-1" />
      </button>
      {open && (
        <div
          ref={panelRef}
          role="dialog"
          aria-label={t('nav.notifications')}
          className="absolute right-0 top-full mt-2 w-80 max-w-[calc(100vw-2rem)] rounded-2xl bg-white/80 backdrop-blur-md shadow-xl overflow-hidden z-[200] animate-[notifDropdownIn_0.22s_cubic-bezier(0.16,1,0.3,1)_both]"
        >
          <div className="flex items-center justify-between px-3.5 pt-2">
            <span className={NOTIF_GROUP_LABEL.replace('px-1 ', '')}>{t('nav.notifications')}</span>
            <button
              type="button"
              onClick={markAll}
              disabled={!items?.some((n) => tinted.has(n.id) || !n.is_read)}
              className="text-xs font-medium text-[#8574B7] hover:text-[#534377] disabled:opacity-40 transition-colors"
            >
              {t('nav.markAllRead')}
            </button>
          </div>
          <div className="max-h-[360px] overflow-y-auto overscroll-contain flex flex-col gap-2 px-2 pb-2">
            {items === null ? (
              <div aria-hidden className="px-1.5 flex flex-col gap-2">
                <div className="h-9 rounded-xl bg-[#E8E6F1]/60 animate-pulse" />
                <div className="h-9 rounded-xl bg-[#E8E6F1]/60 animate-pulse" />
              </div>
            ) : items.length === 0 ? (
              <p className="px-1.5 py-2 text-xs text-[#413B5E]/70">{t('nav.noNotifications')}</p>
            ) : (
              items.map((n) => (
                <NotificationRow
                  key={n.id}
                  n={n}
                  variant="panel"
                  highlighted={tinted.has(n.id) || !n.is_read}
                  onOpen={(row) => {
                    if (!row.is_read) void markNotificationsRead({ ids: [row.id] });
                    setOpen(false);
                  }}
                />
              ))
            )}
          </div>
          <Link
            href="/notifications"
            onClick={() => setOpen(false)}
            className="block text-center text-xs font-medium text-[#8574B7] hover:text-[#534377] py-2 border-t border-[#D0CDE1]/50 transition-colors"
          >
            {t('nav.seeAll')}
          </Link>
        </div>
      )}
    </>
  );
}

export default NotificationBell;
