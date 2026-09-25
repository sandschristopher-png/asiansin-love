'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';

export default function MessagesInboxPage() {
  const [activeTab, setActiveTab] = useState<'all' | 'unread' | 'outbox'>('all');

  const conversations = [
    {
      id: 'ph-camille',
      name: 'Camille',
      age: 26,
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80',
      lastMessage: 'Good morning! Thank you for the warm message...',
      time: '9:30 AM',
      unread: true,
      city: 'Makati',
    },
    {
      id: 'th-siriporn',
      name: 'Siriporn',
      age: 28,
      avatar: 'https://images.unsplash.com/photo-1508214751196-bcfd4ca60f91?auto=format&fit=crop&w=300&q=80',
      lastMessage: 'I enjoyed learning about your travels in Asia.',
      time: 'Yesterday',
      unread: false,
      city: 'Bangkok',
    },
    {
      id: 'ph-maricel',
      name: 'Maricel',
      age: 33,
      avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=300&q=80',
      lastMessage: 'You: Looking forward to our chat this weekend!',
      time: 'Tuesday',
      unread: false,
      city: 'Cebu City',
    },
    {
      id: 'kh-socheata',
      name: 'Socheata',
      age: 27,
      avatar: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&w=300&q=80',
      lastMessage: 'You: Take care always! See you soon on chat.',
      time: 'Sep 18',
      unread: false,
      city: 'Phnom Penh',
    },
  ];

  return (
    <main className="max-w-3xl mx-auto w-full px-4 sm:px-6 py-6 pb-20 min-h-[calc(100vh-140px)] space-y-5">
      
      <div>
        <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
          Messages
        </h1>
        <p className="text-xs sm:text-sm text-[#DDD8D4] mt-1">
          Your private conversations with sincere courtship matches.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2">
        <button
          onClick={() => setActiveTab('all')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all border ${
            activeTab === 'all'
              ? 'bg-[#653C87] border-[#978FA8]/40 text-white shadow-md'
              : 'bg-[#241E2F] border-[#725A7A]/30 text-[#DDD8D4]'
          }`}
        >
          All (4)
        </button>
        <button
          onClick={() => setActiveTab('unread')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all border ${
            activeTab === 'unread'
              ? 'bg-[#653C87] border-[#978FA8]/40 text-white shadow-md'
              : 'bg-[#241E2F] border-[#725A7A]/30 text-[#DDD8D4]'
          }`}
        >
          Unread (1)
        </button>
      </div>

      {/* List */}
      <div className="rounded-3xl bg-[#241E2F] border border-[#725A7A]/35 divide-y divide-[#725A7A]/25 overflow-hidden shadow-xl">
        {conversations.map((c) => (
          <Link
            key={c.id}
            href={`/chat/${c.id}`}
            className="flex items-center justify-between p-4 hover:bg-[#17131F]/50 active:scale-[0.99] transition-all"
          >
            <div className="flex items-center gap-3.5 min-w-0">
              <div className="relative h-12 w-12 rounded-full overflow-hidden flex-shrink-0 border border-[#725A7A]/40">
                <Image
                  src={c.avatar}
                  alt={c.name}
                  fill
                  className="object-cover"
                  unoptimized
                />
              </div>

              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <h3 className="text-sm font-extrabold text-white truncate">
                    {c.name}, {c.age}
                  </h3>
                  <span className="text-[10px] text-white bg-[#653C87] px-1 rounded">✓</span>
                </div>
                <p className="text-xs text-[#DDD8D4] truncate font-medium mt-0.5">
                  <span className="text-[#B8AAC3]">📍 {c.city} • </span>
                  {c.lastMessage}
                </p>
              </div>
            </div>

            <div className="flex flex-col items-end gap-1.5 flex-shrink-0 ml-3">
              <span className="text-[11px] font-semibold text-[#725A7A]">
                {c.time}
              </span>
              {c.unread && (
                <span className="px-2 py-0.5 rounded-full bg-[#653C87] text-white text-[10px] font-black tracking-wide shadow-md">
                  NEW
                </span>
              )}
            </div>
          </Link>
        ))}
      </div>

    </main>
  );
}