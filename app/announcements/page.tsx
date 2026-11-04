'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { Loader2, Megaphone, Pin } from 'lucide-react';
import { ANNOUNCEMENTS_READ_EVENT, describeAnnouncement, type Announcement } from '@/lib/announcements';
import { hasUnreadBroadcast, type Broadcast } from '@/lib/broadcasts';
import { BroadcastBody } from '@/components/BroadcastBody';

function timeAgo(iso: string): string {
  const s = Math.max(0, Math.floor((Date.now() - new Date(iso).getTime()) / 1000));
  if (s < 60) return 'Just now';
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  return `${Math.floor(s / 86400)}d ago`;
}

const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });

type BroadcastRow = Pick<Broadcast, 'id' | 'title' | 'body' | 'tag' | 'is_pinned' | 'published_at'>;

/**
 * Announcements: admin broadcasts to every member (pinned first, then newest; /api/announcements)
 * followed by the member's own notices (verification results, safety advisories, Plus;
 * /api/notifications). Opening the page marks both read and clears the side-menu dot.
 * (Header title + back arrow come from Navbar.)
 */
export default function AnnouncementsPage() {
  const [broadcasts, setBroadcasts] = useState<BroadcastRow[] | null>(null);
  const [items, setItems] = useState<Announcement[] | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const markRead: Promise<unknown>[] = [];

    const broadcastsReq = fetch('/api/announcements', { cache: 'no-store' })
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error(String(r.status)))))
      .then((d) => {
        if (cancelled) return;
        const list: BroadcastRow[] = Array.isArray(d.announcements) ? d.announcements : [];
        setBroadcasts(list);
        const newest = list.reduce<string | null>((m, a) => (!m || a.published_at > m ? a.published_at : m), null);
        if (hasUnreadBroadcast(newest, d.lastReadAt)) markRead.push(fetch('/api/announcements', { method: 'POST' }).catch(() => {}));
      })
      .catch(() => {
        if (!cancelled) setBroadcasts([]);
      });

    const noticesReq = fetch('/api/notifications', { cache: 'no-store' })
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error(String(r.status)))))
      .then((d) => {
        if (cancelled) return;
        const list: Announcement[] = Array.isArray(d.notifications) ? d.notifications : [];
        setItems(list);
        if (list.some((n) => !n.is_read)) markRead.push(fetch('/api/notifications', { method: 'POST' }).catch(() => {}));
      })
      .catch(() => {
        if (!cancelled) {
          setError(true);
          setItems([]);
        }
      });

    Promise.all([broadcastsReq, noticesReq])
      .then(() => Promise.all(markRead))
      .then(() => window.dispatchEvent(new Event(ANNOUNCEMENTS_READ_EVENT)));

    return () => {
      cancelled = true;
    };
  }, []);

  const loading = !broadcasts || !items;
  const empty = !loading && broadcasts.length === 0 && items.length === 0;

  return (
    <main className="flex-1 w-full px-4 pt-4 pb-[calc(8rem+env(safe-area-inset-bottom,0px))] bg-[#FAF8FD]">
      {loading ? (
        <div className="py-16 flex justify-center text-[#8C71F5]">
          <Loader2 className="w-6 h-6 animate-spin" aria-label="Loading" />
        </div>
      ) : empty ? (
        <div className="mt-6 rounded-3xl bg-white border border-[#ECE8F4] py-14 px-6 text-center">
          <span className="mx-auto w-14 h-14 rounded-full bg-gradient-to-br from-[#8C71F5]/10 to-[#EC4899]/10 flex items-center justify-center">
            <Megaphone className="w-6 h-6 text-[#8C71F5]" aria-hidden />
          </span>
          <p className="mt-3 text-sm font-semibold text-[#2D264B]">{error ? 'Could not load announcements' : 'All caught up'}</p>
          <p className="mt-1 text-xs text-neutral-500">{error ? 'Please try again in a moment.' : 'No announcements right now.'}</p>
        </div>
      ) : (
        <div className="space-y-4">
          {broadcasts.length > 0 && (
            <ul className="flex flex-col gap-3">
              {broadcasts.map((a) => (
                <li
                  key={a.id}
                  className="bg-white/95 border border-[#ECE8F4] rounded-2xl p-5 shadow-[0_2px_8px_rgba(45,38,75,0.03)] flex flex-col gap-2.5"
                >
                  <div className="flex items-center gap-2">
                    <span className="bg-[#8C71F5]/10 text-[#8C71F5] text-[11px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider">{a.tag}</span>
                    <span className="text-xs text-[#2D264B]/50">{formatDate(a.published_at)}</span>
                    {a.is_pinned && <Pin className="ml-auto w-3.5 h-3.5 text-[#2D264B]/40" aria-label="Pinned" />}
                  </div>
                  <h2 className="text-base font-bold text-[#2D264B]">{a.title}</h2>
                  <BroadcastBody text={a.body} className="text-sm text-[#2D264B]/80 leading-relaxed" />
                </li>
              ))}
            </ul>
          )}

          {items.length > 0 && (
            <ul className="rounded-2xl bg-white border border-[#ECE8F4] divide-y divide-[#ECE8F4] overflow-hidden">
              {items.map((n) => {
                const { Icon, title, href } = describeAnnouncement(n);
                const body = (
                  <>
                    <span className="w-10 h-10 rounded-full shrink-0 bg-gradient-to-br from-[#8C71F5]/10 to-[#EC4899]/10 flex items-center justify-center">
                      <Icon className="w-[18px] h-[18px] text-[#8C71F5]" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className={`block text-sm leading-snug ${n.is_read ? 'font-medium text-[#3A3350]' : 'font-semibold text-[#2D264B]'}`}>{title}</span>
                      {n.description && <span className="mt-0.5 block text-xs text-neutral-500 leading-relaxed">{n.description}</span>}
                      <span className="mt-1 block text-[11px] text-neutral-400">{timeAgo(n.created_at)}</span>
                    </span>
                    {!n.is_read && <span aria-label="New" className="mt-1.5 w-2 h-2 rounded-full bg-[#EC4899] shrink-0" />}
                  </>
                );
                return (
                  <li key={n.id}>
                    {href ? (
                      <Link href={href} className="flex items-start gap-3 px-4 py-3.5 hover:bg-[#FAF8FD] active:bg-[#FAF8FD] transition-colors">
                        {body}
                      </Link>
                    ) : (
                      <div className="flex items-start gap-3 px-4 py-3.5">{body}</div>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      )}
    </main>
  );
}
