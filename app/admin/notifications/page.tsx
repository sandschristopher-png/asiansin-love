'use client';

import React, { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { Bell, ChevronRight } from 'lucide-react';
import { AdminAvatar, AdminButton, EmptyState, Loading, Notice, PageTitle, adminFetch, timeAgo } from '@/components/admin/ui';
import { CountChip } from '@/components/admin/AdminPendingChip';

type AdminNotif = {
  id: string;
  type: string;
  title: string | null;
  description: string | null;
  link_url: string | null;
  is_read: boolean;
  created_at: string;
  actor: { username: string | null; avatar_url: string | null } | null;
};
type Counts = { verifications: number; photos: number; reports: number; total: number };

const QUEUES: { key: keyof Omit<Counts, 'total'>; label: string; href: string }[] = [
  { key: 'verifications', label: 'Verifications', href: '/admin/verifications' },
  { key: 'photos', label: 'Photo approvals', href: '/admin/photos' },
  { key: 'reports', label: 'Open reports', href: '/admin/reports' },
];

/**
 * Admin Notifications: pending queue sizes (links into each queue) and the staff alert feed
 * (lib/adminNotify.ts). "Mark handled" clears the alert for every admin.
 */
export default function AdminNotificationsPage() {
  const [items, setItems] = useState<AdminNotif[] | null>(null);
  const [counts, setCounts] = useState<Counts | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const j = await adminFetch<{ notifications: AdminNotif[]; counts: Counts }>('/api/admin/notifications');
      setItems(j.notifications);
      setCounts(j.counts);
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not load notifications');
      setItems([]);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const markHandled = async (id: string) => {
    setBusyId(id);
    try {
      await adminFetch('/api/admin/notifications', { id });
      setItems((prev) => (prev ? prev.map((n) => (n.id === id ? { ...n, is_read: true } : n)) : prev));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not update');
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div>
      <PageTitle title="Notifications" subtitle="New submissions and reports waiting for staff" />
      {error && <Notice kind="error">{error}</Notice>}

      <div className="rounded-2xl border border-[#D0CDE1] bg-white divide-y divide-[#D0CDE1] mb-5">
        {QUEUES.map((q) => (
          <Link key={q.key} href={q.href} className="flex items-center justify-between px-4 h-12 text-sm text-[#413B5E] hover:bg-[#E8E6F1]/40 transition-colors">
            <span>{q.label}</span>
            <span className="flex items-center gap-2">
              {counts ? (
                counts[q.key] > 0 ? <CountChip count={counts[q.key]} /> : <span className="text-xs text-[#413B5E]/60">0</span>
              ) : null}
              <ChevronRight className="w-4 h-4 text-slate-600" aria-hidden />
            </span>
          </Link>
        ))}
      </div>

      {items === null ? (
        <Loading />
      ) : items.length === 0 ? (
        <EmptyState icon={Bell} title="All caught up" body="New verifications, photos and reports appear here." />
      ) : (
        <ul className="space-y-2">
          {items.map((n) => (
            <li
              key={n.id}
              className={`rounded-2xl border border-[#D0CDE1] p-3 flex items-center gap-3 ${n.is_read ? 'bg-white opacity-70' : 'bg-[#8574B7]/10'}`}
            >
              <AdminAvatar url={n.actor?.avatar_url ?? null} name={n.actor?.username || 'Member'} size={36} />
              <Link href={n.link_url || '/admin'} className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-[#413B5E] truncate">{n.title || 'Pending review'}</p>
                <p className="text-[11px] text-[#413B5E]/70 truncate">
                  {n.actor?.username ? `${n.actor.username} · ` : ''}
                  {timeAgo(n.created_at)}
                </p>
              </Link>
              {n.is_read ? (
                <span className="text-[11px] text-[#413B5E]/60 shrink-0">Handled</span>
              ) : (
                <AdminButton busy={busyId === n.id} onClick={() => markHandled(n.id)} className="shrink-0">
                  Mark handled
                </AdminButton>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
