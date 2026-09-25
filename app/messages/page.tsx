'use client';

import React, { useState } from 'react';
import Link from 'next/link';

type TabType = 'all' | 'unread' | 'outbox';

interface MessageThread {
  id: string;
  fullName: string;
  age: number;
  city: string;
  country: string;
  avatarUrl: string;
  isVerified: boolean;
  isOnline: boolean;
  lastMessage: string;
  timestamp: string;
  unreadCount: number;
  direction: 'inbound' | 'outbound';
}

const CONVERSATIONS: MessageThread[] = [
  {
    id: 'demo-1',
    fullName: 'Camille',
    age: 26,
    city: 'Makati',
    country: 'Philippines',
    avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=800&auto=format&fit=crop',
    isVerified: true,
    isOnline: true,
    lastMessage: 'Good morning! Thank you for the warm message. How was your weekend in the States?',
    timestamp: '9:30 AM',
    unreadCount: 1,
    direction: 'inbound',
  },
  {
    id: 'demo-2',
    fullName: 'Siriporn',
    age: 28,
    city: 'Bangkok',
    country: 'Thailand',
    avatarUrl: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?q=80&w=800&auto=format&fit=crop',
    isVerified: true,
    isOnline: true,
    lastMessage: 'I enjoyed learning about your travels in Asia.',
    timestamp: 'Yesterday',
    unreadCount: 0,
    direction: 'inbound',
  },
  {
    id: 'demo-5',
    fullName: 'Maricel',
    age: 29,
    city: 'Davao City',
    country: 'Philippines',
    avatarUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=800&auto=format&fit=crop',
    isVerified: true,
    isOnline: false,
    lastMessage: 'Looking forward to our chat this weekend!',
    timestamp: 'Tuesday',
    unreadCount: 0,
    direction: 'outbound',
  },
  {
    id: 'demo-3',
    fullName: 'Lian',
    age: 25,
    city: 'Cebu City',
    country: 'Philippines',
    avatarUrl: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?q=80&w=800&auto=format&fit=crop',
    isVerified: true,
    isOnline: false,
    lastMessage: 'Take care always! See you soon on chat.',
    timestamp: 'Sep 18',
    unreadCount: 0,
    direction: 'outbound',
  },
];

export default function MessagesInboxPage() {
  const [activeTab, setActiveTab] = useState<TabType>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const unreadCount = CONVERSATIONS.filter((item) => item.unreadCount > 0).length;
  const outboxCount = CONVERSATIONS.filter((item) => item.direction === 'outbound').length;

  const filteredConversations = CONVERSATIONS.filter((item) => {
    let matchesTab = true;
    if (activeTab === 'unread') {
      matchesTab = item.unreadCount > 0;
    } else if (activeTab === 'outbox') {
      matchesTab = item.direction === 'outbound';
    }

    const matchesSearch =
      item.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.city.toLowerCase().includes(searchQuery.toLowerCase());

    return matchesTab && matchesSearch;
  });

  return (
    <main className="max-w-3xl mx-auto w-full px-3 sm:px-6 py-5 flex-1 flex flex-col">
      
      {/* Streamlined Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#725A7A]/25 pb-4 mb-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight font-[family-name:var(--font-nunito)]">
            Messages
          </h1>
          <p className="text-xs sm:text-sm text-[#DDD8D4] mt-0.5 font-normal">
            Your private conversations with sincere courtship matches.
          </p>
        </div>

        {/* 3-State Filter Tabs */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          <button
            type="button"
            onClick={() => setActiveTab('all')}
            className={`px-3.5 py-1.5 rounded-xl text-xs sm:text-sm font-bold transition-all ${
              activeTab === 'all'
                ? 'bg-[#653C87] text-white shadow-sm'
                : 'bg-[#241E2F] border border-[#725A7A]/35 text-[#DDD8D4] hover:text-white'
            }`}
          >
            All ({CONVERSATIONS.length})
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('unread')}
            className={`px-3.5 py-1.5 rounded-xl text-xs sm:text-sm font-bold border transition-all ${
              activeTab === 'unread'
                ? 'bg-[#653C87] border-[#653C87] text-white shadow-sm'
                : 'bg-[#241E2F] border-[#725A7A]/35 text-[#DDD8D4] hover:text-white'
            }`}
          >
            Unread ({unreadCount})
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('outbox')}
            className={`px-3.5 py-1.5 rounded-xl text-xs sm:text-sm font-bold border transition-all ${
              activeTab === 'outbox'
                ? 'bg-[#653C87] border-[#653C87] text-white shadow-sm'
                : 'bg-[#241E2F] border-[#725A7A]/35 text-[#DDD8D4] hover:text-white'
            }`}
          >
            Outbox ({outboxCount})
          </button>
        </div>
      </div>

      {/* Instant Search Bar */}
      <div className="mb-4">
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search by name or city..."
          className="w-full px-4 py-2.5 rounded-xl bg-[#241E2F] border border-[#725A7A]/35 text-white placeholder-[#978FA8] text-xs sm:text-sm focus:outline-none focus:border-[#978FA8] transition-colors"
        />
      </div>

      {/* Thread Container */}
      <div className="rounded-2xl bg-[#241E2F] border border-[#725A7A]/35 overflow-hidden shadow-xl divide-y divide-[#725A7A]/20">
        {filteredConversations.length === 0 ? (
          <div className="p-8 text-center text-sm text-[#DDD8D4]">
            {activeTab === 'outbox'
              ? 'No sent messages found.'
              : activeTab === 'unread'
              ? 'No unread messages.'
              : 'No conversations match your search.'}
          </div>
        ) : (
          filteredConversations.map((conv) => (
            <Link
              key={conv.id}
              href={`/chat/${conv.id}`}
              className={`flex items-center gap-3.5 p-3.5 sm:p-4 hover:bg-[#2E263B] transition-colors active:bg-[#17131F] ${
                conv.unreadCount > 0 ? 'bg-[#2E263B]/60' : ''
              }`}
            >
              {/* Avatar + Live Dot */}
              <div className="relative shrink-0">
                <div className="h-12 w-12 sm:h-14 sm:w-14 rounded-full overflow-hidden bg-[#17131F] border border-[#725A7A]/40">
                  <img
                    src={conv.avatarUrl}
                    alt={conv.fullName}
                    className="w-full h-full object-cover"
                  />
                </div>
                {conv.isOnline && (
                  <span className="absolute bottom-0 right-0 h-3.5 w-3.5 rounded-full bg-emerald-400 border-2 border-[#241E2F] ring-1 ring-emerald-400/50" />
                )}
              </div>

              {/* Message Details */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5 truncate">
                    <h3 className="text-base font-bold text-white truncate">
                      {conv.fullName}, <span className="text-[#DDD8D4] font-normal">{conv.age}</span>
                    </h3>
                    {conv.isVerified && (
                      <span className="px-1.5 py-0.5 rounded-md bg-[#653C87] text-white text-[10px] font-bold shrink-0">
                        ✓
                      </span>
                    )}
                  </div>
                  <span className={`text-[11px] shrink-0 ${conv.unreadCount > 0 ? 'text-[#E6D7FA] font-bold' : 'text-[#978FA8]'}`}>
                    {conv.timestamp}
                  </span>
                </div>

                {/* Subtitle with Location & Preview */}
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span className="text-[11px] text-[#B8AAC3] font-medium shrink-0">
                    📍 {conv.city}
                  </span>
                  <span className="text-[#725A7A] text-[10px]">•</span>
                  <p
                    className={`text-xs sm:text-sm truncate ${
                      conv.unreadCount > 0
                        ? 'text-white font-bold'
                        : 'text-[#DDD8D4] font-normal'
                    }`}
                  >
                    {conv.direction === 'outbound' ? 'You: ' : ''}
                    {conv.lastMessage}
                  </p>
                </div>
              </div>

              {/* High-Contrast Unread Badge */}
              {conv.unreadCount > 0 && (
                <div className="shrink-0 flex items-center justify-center px-2 py-0.5 rounded-full bg-[#E6D7FA] text-[#17131F] text-xs font-black shadow-md">
                  NEW
                </div>
              )}
            </Link>
          ))
        )}
      </div>

      {/* Respect Charter Footer Link */}
      <div className="mt-4 text-center">
        <Link
          href="/standards"
          className="text-xs text-[#B8AAC3] hover:text-white transition-colors inline-flex items-center gap-1.5"
        >
          <span>📜</span> View our Courtship & Mutual Respect Guidelines
        </Link>
      </div>

    </main>
  );
}
