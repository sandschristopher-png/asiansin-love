'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabaseClient';

interface ConversationPreview {
  partnerId: string;
  partnerName: string;
  partnerAvatar?: string;
  partnerCity?: string;
  partnerReputation?: number;
  lastMessage: string;
  lastMessageAt: string;
  unreadCount: number;
}

export default function MessagesInboxPage() {
  const [conversations, setConversations] = useState<ConversationPreview[]>([
    {
      partnerId: 'ph-camille',
      partnerName: 'Camille',
      partnerAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80',
      partnerCity: 'Makati, Metro Manila',
      partnerReputation: 98,
      lastMessage: 'Good morning! Thank you for the warm message. How was your weekend?',
      lastMessageAt: '9:30 AM',
      unreadCount: 1,
    },
    {
      partnerId: 'th-siriporn',
      partnerName: 'Siriporn',
      partnerAvatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=400&q=80',
      partnerCity: 'Bangkok, Thailand',
      partnerReputation: 95,
      lastMessage: 'I enjoyed learning about your work. Are you visiting soon?',
      lastMessageAt: 'Yesterday',
      unreadCount: 0,
    },
    {
      partnerId: 'ph-maricel',
      partnerName: 'Maricel',
      partnerAvatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=400&q=80',
      partnerCity: 'Cebu City, Philippines',
      partnerReputation: 92,
      lastMessage: 'You: Looking forward to our call this weekend.',
      lastMessageAt: 'Tuesday',
      unreadCount: 0,
    },
  ]);

  const getInitials = (name: string) => {
    return name.slice(0, 2).toUpperCase();
  };

  return (
    <div className="w-full max-w-4xl mx-auto px-4 py-6 sm:py-8 space-y-6">
      
      {/* Title & Filter Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#7D7E92]/25 pb-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white">Direct Messages</h1>
          <p className="text-xs text-[#B6AEC7] mt-0.5">
            Private, authentic courtship conversations with verified members.
          </p>
        </div>

        <div className="flex gap-2">
          <button className="px-3.5 py-1.5 rounded-xl bg-[#653C87] text-white text-xs font-bold shadow-md">
            All Messages
          </button>
          <button className="px-3.5 py-1.5 rounded-xl bg-[#241E2F] border border-[#7D7E92]/30 text-[#ECE8F4] text-xs font-semibold hover:bg-[#3B1E42] transition-colors">
            Unread
          </button>
        </div>
      </div>

      {/* Conversation Thread List */}
      <div className="space-y-2.5">
        {conversations.map((c) => (
          <Link
            key={c.partnerId}
            href={`/chat/${c.partnerId}`}
            className="flex items-center justify-between p-3.5 sm:p-4 rounded-2xl bg-[#241E2F] border border-[#7D7E92]/30 hover:border-[#9A79BA] hover:bg-[#2B2338] transition-all group shadow-lg"
          >
            <div className="flex items-center gap-3.5 sm:gap-4 min-w-0">
              
              {/* Unified Squircle Avatar (48x48) */}
              <div className="relative h-12 w-12 rounded-2xl overflow-hidden bg-[#17131F] border border-[#9A79BA]/40 shrink-0 flex items-center justify-center shadow-inner group-hover:scale-[1.02] transition-transform">
                {c.partnerAvatar ? (
                  <img
                    src={c.partnerAvatar}
                    alt={c.partnerName}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <span className="text-xs font-bold text-[#ECE8F4]">
                    {getInitials(c.partnerName)}
                  </span>
                )}
                {c.unreadCount > 0 && (
                  <span className="absolute top-1 right-1 h-2.5 w-2.5 rounded-full bg-emerald-400 ring-2 ring-[#241E2F]" />
                )}
              </div>

              {/* Text Context */}
              <div className="min-w-0 space-y-0.5">
                <div className="flex items-center gap-2">
                  <h2 className="font-bold text-sm sm:text-base text-white truncate">
                    {c.partnerName}
                  </h2>
                  <span className="text-[10px] px-2 py-0.5 rounded-lg bg-[#17131F] text-[#ECE8F4] border border-[#7D7E92]/30 font-semibold shrink-0">
                    {c.partnerReputation}% Rep
                  </span>
                </div>
                <p className="text-xs text-[#ECE8F4]/80 truncate max-w-xs sm:max-w-md">
                  {c.lastMessage}
                </p>
                {c.partnerCity && (
                  <p className="text-[10px] text-[#7D7E92] font-mono">
                    {c.partnerCity}
                  </p>
                )}
              </div>

            </div>

            {/* Right Side: Timestamp & Unread Badge */}
            <div className="flex flex-col items-end gap-1.5 shrink-0 pl-2">
              <span className="text-[11px] font-mono text-[#B6AEC7]">
                {c.lastMessageAt}
              </span>
              {c.unreadCount > 0 ? (
                <span className="px-2 py-0.5 rounded-full bg-[#653C87] text-white text-[10px] font-bold shadow-md">
                  New
                </span>
              ) : (
                <span className="text-xs text-[#7D7E92]">&rsaquo;</span>
              )}
            </div>
          </Link>
        ))}
      </div>

    </div>
  );
}
