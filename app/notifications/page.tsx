'use client';

import React, { useState } from 'react';
import Link from 'next/link';

interface AppNotification {
  id: string;
  type: 'message' | 'verification' | 'favorite';
  title: string;
  description: string;
  timestamp: string;
  isRead: boolean;
  linkUrl: string;
  avatarUrl?: string;
  icon: string;
}

const NOTIFICATIONS_DATA: AppNotification[] = [
  {
    id: 'notif-1',
    type: 'message',
    title: 'New message from Camille',
    description: '"Good morning! Thank you for the warm message..."',
    timestamp: '15m ago',
    isRead: false,
    linkUrl: '/chat/demo-1',
    avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=800&auto=format&fit=crop',
    icon: '💬',
  },
  {
    id: 'notif-2',
    type: 'verification',
    title: 'Identity Pose Verified!',
    description: 'Your verification selfie has been approved. Your profile now displays the purple check badge.',
    timestamp: '2h ago',
    isRead: false,
    linkUrl: '/profile',
    icon: '🛡️',
  },
  {
    id: 'notif-3',
    type: 'favorite',
    title: 'New admirer',
    description: 'Maricel from Davao City saved your profile to her favorites list.',
    timestamp: 'Yesterday',
    isRead: true,
    linkUrl: '/profile/demo-5',
    avatarUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=800&auto=format&fit=crop',
    icon: '⭐',
  },
  {
    id: 'notif-4',
    type: 'message',
    title: 'New message from Siriporn',
    description: '"I enjoyed learning about your travels in Asia."',
    timestamp: '2 days ago',
    isRead: true,
    linkUrl: '/chat/demo-2',
    avatarUrl: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?q=80&w=800&auto=format&fit=crop',
    icon: '💬',
  },
];

export default function NotificationsPage() {
  const [filter, setFilter] = useState<'all' | 'unread'>('all');
  const [items, setItems] = useState<AppNotification[]>(NOTIFICATIONS_DATA);

  const markAllRead = () => {
    setItems((prev) => prev.map((n) => ({ ...n, isRead: true })));
  };

  const filteredItems = items.filter((item) => {
    if (filter === 'unread') return !item.isRead;
    return true;
  });

  const unreadCount = items.filter((n) => !n.isRead).length;

  return (
    <main className="max-w-3xl mx-auto w-full px-3 sm:px-6 py-5 flex-1 flex flex-col">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#725A7A]/25 pb-4 mb-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight font-[family-name:var(--font-nunito)]">
            Notifications
          </h1>
          <p className="text-xs sm:text-sm text-[#DDD8D4] mt-0.5 font-normal">
            Stay updated on new messages, verified status, and admirers.
          </p>
        </div>

        {/* Filter and Mark All Read Actions */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setFilter('all')}
            className={`px-3.5 py-1.5 rounded-xl text-xs sm:text-sm font-bold transition-all ${
              filter === 'all'
                ? 'bg-[#653C87] text-white shadow-sm'
                : 'bg-[#241E2F] border border-[#725A7A]/35 text-[#DDD8D4] hover:text-white'
            }`}
          >
            All ({items.length})
          </button>
          <button
            type="button"
            onClick={() => setFilter('unread')}
            className={`px-3.5 py-1.5 rounded-xl text-xs sm:text-sm font-bold border transition-all ${
              filter === 'unread'
                ? 'bg-[#653C87] border-[#653C87] text-white shadow-sm'
                : 'bg-[#241E2F] border-[#725A7A]/35 text-[#DDD8D4] hover:text-white'
            }`}
          >
            Unread ({unreadCount})
          </button>

          {unreadCount > 0 && (
            <button
              type="button"
              onClick={markAllRead}
              className="text-xs font-semibold text-[#B8AAC3] hover:text-white transition-colors ml-1"
            >
              Mark all read
            </button>
          )}
        </div>
      </div>

      {/* Notifications List Container */}
      <div className="rounded-2xl bg-[#241E2F] border border-[#725A7A]/35 overflow-hidden shadow-xl divide-y divide-[#725A7A]/20">
        {filteredItems.length === 0 ? (
          <div className="p-10 text-center space-y-2">
            <span className="text-3xl block">🔔</span>
            <p className="text-sm font-bold text-white">No notifications right now</p>
            <p className="text-xs text-[#DDD8D4]">You're completely caught up.</p>
          </div>
        ) : (
          filteredItems.map((item) => (
            <Link
              key={item.id}
              href={item.linkUrl}
              className={`flex items-start gap-3.5 p-3.5 sm:p-4 hover:bg-[#2E263B] transition-colors active:bg-[#17131F] ${
                !item.isRead ? 'bg-[#2E263B]/60' : ''
              }`}
            >
              {/* Icon / Avatar */}
              <div className="relative shrink-0 mt-0.5">
                {item.avatarUrl ? (
                  <div className="h-11 w-11 sm:h-12 sm:w-12 rounded-full overflow-hidden bg-[#17131F] border border-[#725A7A]/40">
                    <img src={item.avatarUrl} alt="" className="w-full h-full object-cover" />
                  </div>
                ) : (
                  <div className="h-11 w-11 sm:h-12 sm:w-12 rounded-full bg-[#17131F] border border-[#725A7A]/40 flex items-center justify-center text-lg">
                    {item.icon}
                  </div>
                )}
                {!item.isRead && (
                  <span className="absolute -top-0.5 -right-0.5 h-3 w-3 rounded-full bg-emerald-400 border-2 border-[#241E2F]" />
                )}
              </div>

              {/* Text content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-baseline justify-between gap-2">
                  <h2 className="text-sm sm:text-base font-bold text-white truncate">
                    {item.title}
                  </h2>
                  <span className={`text-[11px] shrink-0 ${!item.isRead ? 'text-[#E6D7FA] font-bold' : 'text-[#978FA8]'}`}>
                    {item.timestamp}
                  </span>
                </div>
                <p className="text-xs sm:text-sm text-[#DDD8D4] leading-snug mt-0.5 line-clamp-2">
                  {item.description}
                </p>
              </div>

              {/* Status indicator */}
              {!item.isRead && (
                <div className="shrink-0 flex items-center justify-center px-2 py-0.5 rounded-full bg-[#E6D7FA] text-[#17131F] text-[10px] font-black shadow-sm self-center">
                  NEW
                </div>
              )}
            </Link>
          ))
        )}
      </div>
    </main>
  );
}
