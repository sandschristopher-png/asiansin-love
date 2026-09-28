'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabaseClient';

interface NotificationItem {
  id: string;
  user_id: string;
  type: 'message' | 'verification' | 'favorite' | 'system';
  title: string;
  description: string;
  link_url: string;
  is_read: boolean;
  created_at: string;
}

function formatTimeAgo(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diffInSeconds < 60) return 'Just now';
  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) return `${diffInHours}h ago`;
  const diffInDays = Math.floor(diffInHours / 24);
  return `${diffInDays}d ago`;
}

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    async function fetchNotifications() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setLoading(false);
        return;
      }
      setUserId(user.id);

      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(50);

      if (!error && data) {
        setNotifications(data as NotificationItem[]);
      }
      setLoading(false);
    }

    fetchNotifications();
  }, []);

  const markAllRead = async () => {
    if (!userId) return;
    setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
    await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('user_id', userId)
      .eq('is_read', false);
  };

  const handleNotificationClick = async (item: NotificationItem) => {
    if (!item.is_read) {
      setNotifications((prev) =>
        prev.map((n) => (n.id === item.id ? { ...n, is_read: true } : n))
      );
      await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('id', item.id);
    }
  };

  return (
    <main className="max-w-2xl mx-auto px-4 sm:px-6 py-6 pb-28 space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            Notifications
          </h1>
          <p className="text-sm text-[#E6D7FA] mt-0.5">
            Activity updates, messages, and security notices.
          </p>
        </div>

        {notifications.some((n) => !n.is_read) && (
          <button
            onClick={markAllRead}
            className="text-xs font-bold text-[#C9A4E8] hover:text-white active:scale-95 transition-all"
          >
            Mark all read
          </button>
        )}
      </div>

      {/* Notifications List */}
      <div className="space-y-3">
        {loading ? (
          <div className="p-8 text-center text-sm text-[#E6D7FA]/60">
            Loading notifications...
          </div>
        ) : (
          notifications.map((item) => (
            <Link
              key={item.id}
              href={item.link_url || '/notifications'}
              onClick={() => handleNotificationClick(item)}
              className={`block p-4 rounded-2xl border transition-all active:scale-[0.99] ${
                !item.is_read
                  ? 'bg-[#261F33] border-[#9A79BA]/45 shadow-xl hover:border-[#9A79BA]/70'
                  : 'bg-[#181222] border-[#9A79BA]/20 hover:border-[#9A79BA]/40'
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-extrabold text-white">
                      {item.title}
                    </h3>
                    {!item.is_read && (
                      <span className="h-2 w-2 rounded-full bg-[#9A79BA] ring-2 ring-[#653C87]/40 shadow-sm shadow-[#9A79BA]/60" />
                    )}
                  </div>
                  <p className="text-xs text-[#E6D7FA] leading-relaxed">
                    {item.description}
                  </p>
                </div>
                <span className="text-[11px] font-semibold text-[#C9A4E8] whitespace-nowrap">
                  {formatTimeAgo(item.created_at)}
                </span>
              </div>
            </Link>
          ))
        )}

        {!loading && notifications.length === 0 && (
          <div className="rounded-3xl bg-[#261F33] border border-[#9A79BA]/35 p-10 shadow-2xl text-center space-y-2">
            <span className="text-3xl">🔔</span>
            <h3 className="text-sm font-extrabold text-white">All caught up!</h3>
            <p className="text-sm text-[#E6D7FA]">You have no unread notifications right now.</p>
          </div>
        )}
      </div>
    </main>
  );
}
