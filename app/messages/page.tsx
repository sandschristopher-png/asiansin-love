'use client';

import React, { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import Image from 'next/image';
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

const DEFAULT_DEMO_CONVERSATIONS: ConversationPreview[] = [
  {
    partnerId: 'jennalyn',
    partnerName: 'jennalyn',
    partnerAvatar: '/jennalyn.png',
    partnerCity: 'Cebu City, Philippines',
    partnerReputation: 99,
    lastMessage: 'Hello po! Thank you for the message. Im just drinking coffee before my shift starts.',
    lastMessageAt: 'Just now',
    unreadCount: 1,
  },
  {
    partnerId: 'anong',
    partnerName: 'Anong',
    partnerAvatar: '/anong.png',
    partnerCity: 'Chiang Mai, Thailand',
    partnerReputation: 99,
    lastMessage: 'Sawasdee kha! Thank you for say hi to me.',
    lastMessageAt: 'Yesterday',
    unreadCount: 0,
  },
  {
    partnerId: 'mai',
    partnerName: 'Mai',
    partnerId: 'mai',
    partnerAvatar: '/nguyen%20thi%20mai.png',
    partnerCity: 'Da Nang, Vietnam',
    partnerReputation: 98,
    lastMessage: 'Xin chao! Very happy to receive your message.',
    lastMessageAt: 'Tuesday',
    unreadCount: 0,
  },
];

export default function MessagesInboxPage() {
  const [conversations, setConversations] = useState<ConversationPreview[]>(DEFAULT_DEMO_CONVERSATIONS);
  const [filter, setFilter] = useState<'all' | 'unread'>('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let channel: any = null;

    async function loadConversations() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setLoading(false);
        return;
      }

      // Fetch user messages
      const { data: dbMessages } = await supabase
        .from('messages')
        .select('id, sender_id, receiver_id, content, created_at, is_read')
        .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`)
        .order('created_at', { ascending: false });

      if (dbMessages && dbMessages.length > 0) {
        // Group by conversation partner
        const partnersMap = new Map<string, { lastMsg: any; unread: number }>();
        const partnerIds: string[] = [];

        for (const msg of dbMessages) {
          const partnerId = msg.sender_id === user.id ? msg.receiver_id : msg.sender_id;
          if (!partnerId) continue;

          if (!partnersMap.has(partnerId)) {
            partnersMap.set(partnerId, {
              lastMsg: msg,
              unread: (msg.receiver_id === user.id && !msg.is_read) ? 1 : 0,
            });
            partnerIds.push(partnerId);
          } else if (msg.receiver_id === user.id && !msg.is_read) {
            partnersMap.get(partnerId)!.unread += 1;
          }
        }

        // Fetch profiles for all partner IDs
        const { data: profiles } = await supabase
          .from('profiles')
          .select('id, display_name, full_name, username, avatar_url, city, reputation_score')
          .in('id', partnerIds);

        const profileMap = new Map<string, any>();
        profiles?.forEach((p) => profileMap.set(p.id, p));

        const realConversations: ConversationPreview[] = partnerIds.map((pid) => {
          const prof = profileMap.get(pid);
          const meta = partnersMap.get(pid)!;
          const msgDate = new Date(meta.lastMsg.created_at);
          const timeStr = msgDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

          return {
            partnerId: pid,
            partnerName: prof?.display_name || prof?.full_name || prof?.username || 'Member',
            partnerAvatar: prof?.avatar_url || '/jennalyn.png',
            partnerCity: prof?.city || undefined,
            partnerReputation: prof?.reputation_score || 98,
            lastMessage: (meta.lastMsg.sender_id === user.id ? 'You: ' : '') + meta.lastMsg.content,
            lastMessageAt: timeStr,
            unreadCount: meta.unread,
          };
        });

        // Prepend real conversations before demo contacts
        setConversations([...realConversations, ...DEFAULT_DEMO_CONVERSATIONS]);
      }
      setLoading(false);

      // Listen for incoming messages in real-time
      channel = supabase
        .channel(`inbox_realtime_${user.id}`)
        .on(
          'postgres_changes',
          { event: 'INSERT', schema: 'public', table: 'messages' },
          (payload) => {
            const newRow = payload.new as any;
            if (newRow.receiver_id === user.id || newRow.sender_id === user.id) {
              loadConversations();
            }
          }
        )
        .subscribe();
    }

    loadConversations();

    return () => {
      if (channel) supabase.removeChannel(channel);
    };
  }, []);

  const displayedConversations = useMemo(() => {
    if (filter === 'unread') {
      return conversations.filter((c) => c.unreadCount > 0);
    }
    return conversations;
  }, [conversations, filter]);

  const getInitials = (name: string) => {
    return name.slice(0, 2).toUpperCase();
  };

  return (
    <div className="w-full max-w-4xl mx-auto px-4 py-6 sm:py-8 space-y-6">
      {/* Title & Filter Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#9A79BA]/30 pb-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white">Direct Messages</h1>
          <p className="text-sm text-[#E6D7FA] mt-0.5">
            Private, authentic courtship conversations with verified members.
          </p>
        </div>

        <div className="flex gap-2">
          <button
            onClick={() => setFilter('all')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
              filter === 'all'
                ? 'bg-[#653C87] text-white shadow-md shadow-[#653C87]/40'
                : 'bg-[#261F33] border border-[#9A79BA]/35 text-[#E6D7FA] hover:bg-[#653C87]/20 hover:text-white'
            }`}
          >
            All Messages
          </button>
          <button
            onClick={() => setFilter('unread')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
              filter === 'unread'
                ? 'bg-[#653C87] text-white shadow-md shadow-[#653C87]/40'
                : 'bg-[#261F33] border border-[#9A79BA]/35 text-[#E6D7FA] hover:bg-[#653C87]/20 hover:text-white'
            }`}
          >
            Unread
          </button>
        </div>
      </div>

      {/* Conversation Thread List */}
      <div className="space-y-2.5">
        {displayedConversations.length === 0 ? (
          <div className="text-center py-12 rounded-2xl bg-[#261F33]/50 border border-[#9A79BA]/20 text-[#C9A4E8] text-sm">
            No unread messages.
          </div>
        ) : (
          displayedConversations.map((c) => (
            <Link
              key={c.partnerId}
              href={`/chat/${c.partnerId}`}
              className="flex items-center justify-between p-3.5 sm:p-4 rounded-2xl bg-[#261F33] border border-[#9A79BA]/35 hover:border-[#9A79BA]/70 hover:bg-[#2D243D] transition-all group shadow-xl"
            >
              <div className="flex items-center gap-3.5 sm:gap-4 min-w-0">
                {/* Unified Squircle Avatar (48x48) */}
                <div className="relative h-12 w-12 rounded-2xl overflow-hidden bg-[#181222] border border-[#9A79BA]/50 shrink-0 flex items-center justify-center shadow-inner group-hover:scale-[1.02] transition-transform">
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
                    <span className="absolute top-1 right-1 h-2.5 w-2.5 rounded-full bg-emerald-400 ring-2 ring-[#261F33]" />
                  )}
                </div>

                {/* Text Context */}
                <div className="min-w-0 space-y-0.5">
                  <div className="flex items-center gap-2">
                    <h2 className="font-bold text-sm sm:text-base text-white truncate">
                      {c.partnerName}
                    </h2>
                    {c.partnerReputation !== undefined && (
                      <span className="text-[10px] px-2 py-0.5 rounded-lg bg-[#181222] text-[#E6D7FA] border border-[#9A79BA]/40 font-semibold shrink-0">
                        {c.partnerReputation}% Rep
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-[#E6D7FA] truncate max-w-xs sm:max-w-md">
                    {c.lastMessage}
                  </p>
                  {c.partnerCity && (
                    <p className="text-[11px] text-[#C9A4E8] font-medium">
                      {c.partnerCity}
                    </p>
                  )}
                </div>
              </div>

              {/* Right Side: Timestamp & Unread Badge */}
              <div className="flex flex-col items-end gap-1.5 shrink-0 pl-2">
                <span className="text-[11px] font-medium text-[#C9A4E8]">
                  {c.lastMessageAt}
                </span>
                {c.unreadCount > 0 ? (
                  <span className="px-2 py-0.5 rounded-full bg-[#653C87] text-white text-[10px] font-bold shadow-md shadow-[#653C87]/40">
                    New
                  </span>
                ) : (
                  <span className="text-base text-[#9A79BA]">&rsaquo;</span>
                )}
              </div>
            </Link>
          ))
        )}
      </div>
    </div>
  );
}