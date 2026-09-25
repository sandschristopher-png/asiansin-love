'use client';

import React, { useState } from 'react';
import Link from 'next/link';

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState([
    {
      id: '1',
      title: 'Welcome to asiansin.love!',
      body: 'Complete your selfie gesture verification to earn the verified badge.',
      time: 'Just now',
      link: '/verify',
      read: false,
    },
    {
      id: '2',
      title: 'Profile Tip',
      body: 'Members with completed courtship goals receive 3x more meaningful replies.',
      time: '2 hours ago',
      link: '/profile',
      read: true,
    },
  ]);

  const markAllRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  return (
    <main className="max-w-2xl mx-auto px-4 sm:px-6 py-6 pb-28 space-y-5">
      
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            Notifications
          </h1>
          <p className="text-xs sm:text-sm text-[#DDD8D4] mt-0.5">
            Activity updates, messages, and security notices.
          </p>
        </div>

        {notifications.some((n) => !n.read) && (
          <button
            onClick={markAllRead}
            className="text-xs font-bold text-[#B8AAC3] hover:text-white active:scale-95 transition-all"
          >
            Mark all read
          </button>
        )}
      </div>

      {/* Notifications List */}
      <div className="space-y-3">
        {notifications.map((item) => (
          <Link
            key={item.id}
            href={item.link}
            className={`block p-4 rounded-2xl border transition-all active:scale-[0.99] ${
              !item.read
                ? 'bg-[#241E2F] border-[#653C87]/60 shadow-lg'
                : 'bg-[#17131F] border-[#725A7A]/25 text-[#DDD8D4]'
            }`}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-extrabold text-white">
                    {item.title}
                  </h3>
                  {!item.read && (
                    <span className="h-2 w-2 rounded-full bg-[#653C87]" />
                  )}
                </div>
                <p className="text-xs text-[#DDD8D4] leading-relaxed">
                  {item.body}
                </p>
              </div>
              <span className="text-[10px] font-semibold text-[#725A7A] whitespace-nowrap">
                {item.time}
              </span>
            </div>
          </Link>
        ))}

        {notifications.length === 0 && (
          <div className="rounded-3xl bg-[#241E2F] border border-[#725A7A]/30 p-10 text-center space-y-2">
            <span className="text-3xl">🔔</span>
            <h3 className="text-sm font-extrabold text-white">All caught up!</h3>
            <p className="text-xs text-[#DDD8D4]">You have no unread notifications right now.</p>
          </div>
        )}
      </div>

    </main>
  );
}