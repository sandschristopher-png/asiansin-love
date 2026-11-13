'use client';

import { useCallback, useEffect, useState } from 'react';
import { useLocale } from '@/components/i18n/LocaleProvider';
import { NotificationRow, markNotificationsRead, type MemberNotification } from '@/components/notifications/NotificationRow';

const PAGE = 30;

type Group = 'today' | 'thisWeek' | 'earlier';

function groupOf(iso: string): Group {
  const d = new Date(iso);
  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);
  if (d >= startOfToday) return 'today';
  if (Date.now() - d.getTime() < 7 * 24 * 60 * 60 * 1000) return 'thisWeek';
  return 'earlier';
}

/**
 * Full notification history ("See all" from the header bell panel): newest first, grouped
 * Today / This week / Earlier, "Load more" pages back through GET /api/notifications?before=.
 * Staff alerts (admin_*) are never listed here; the API excludes them.
 */
export default function NotificationsPage() {
  const { t } = useLocale();
  const [items, setItems] = useState<MemberNotification[] | null>(null);
  const [hasMore, setHasMore] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);

  const load = useCallback(async (before?: string) => {
    const qs = new URLSearchParams({ scope: 'all', limit: String(PAGE) });
    if (before) qs.set('before', before);
    const res = await fetch(`/api/notifications?${qs}`, { cache: 'no-store' }).catch(() => null);
    if (!res?.ok) {
      setItems((prev) => prev ?? []);
      return;
    }
    const j = await res.json();
    const rows = (j.notifications ?? []) as MemberNotification[];
    setItems((prev) => (before && prev ? [...prev, ...rows] : rows));
    setHasMore(Boolean(j.has_more));
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const open = (n: MemberNotification) => {
    if (n.is_read) return;
    setItems((prev) => prev?.map((x) => (x.id === n.id ? { ...x, is_read: true } : x)) ?? prev);
    void markNotificationsRead({ ids: [n.id] });
  };

  const groups: { key: Group; rows: MemberNotification[] }[] = (['today', 'thisWeek', 'earlier'] as Group[])
    .map((key) => ({ key, rows: (items ?? []).filter((n) => groupOf(n.created_at) === key) }))
    .filter((g) => g.rows.length > 0);

  return (
    <div className="w-full max-w-md mx-auto px-4 py-4 pb-24">
      {items === null ? (
        <div aria-hidden className="space-y-2">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="h-14 rounded-2xl bg-[#E8E6F1]/60 animate-pulse" />
          ))}
        </div>
      ) : items.length === 0 ? (
        <p className="py-16 text-center text-sm text-[#413B5E]/70">{t('nav.noNotifications')}</p>
      ) : (
        <div className="space-y-5">
          {groups.map((g) => (
            <section key={g.key}>
              <h2 className="px-1 pb-2 text-[10px] font-semibold uppercase tracking-wider text-[#8574B7]">{t(`nav.${g.key}`)}</h2>
              <div className="rounded-2xl bg-white border border-[#D0CDE1] overflow-hidden divide-y divide-[#D0CDE1]/60">
                {g.rows.map((n) => (
                  <NotificationRow key={n.id} n={n} highlighted={!n.is_read} onOpen={open} />
                ))}
              </div>
            </section>
          ))}
          {hasMore && (
            <button
              type="button"
              disabled={loadingMore}
              onClick={async () => {
                setLoadingMore(true);
                await load(items[items.length - 1]?.created_at);
                setLoadingMore(false);
              }}
              className="w-full h-11 rounded-full border border-[#8574B7] text-sm font-medium text-[#8574B7] hover:bg-[#8574B7]/10 disabled:opacity-50 transition-colors"
            >
              {t('nav.loadMore')}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
