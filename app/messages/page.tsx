'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { MessageCircle, Search, ChevronRight, Clock } from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';

interface ConversationItem {
  id: string;
  recipientId: string;
  name: string;
  avatarUrl?: string;
  repScore?: number;
  lastMessage: string;
  lastMessageAt: string;
  unreadCount: number;
}

export default function MessagesPage() {
  const [conversations, setConversations] = useState<ConversationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'all' | 'unread'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    let channel: any = null;
    let isMounted = true;

    async function loadConversations() {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user || !isMounted) {
          if (isMounted) setLoading(false);
          return;
        }

        const { data, error } = await supabase
          .from('conversations')
          .select(`
            id,
            last_message,
            updated_at,
            participant_1,
            participant_2
          `)
          .or(`participant_1.eq.${user.id},participant_2.eq.${user.id}`)
          .order('updated_at', { ascending: false });

        if (error || !data || data.length === 0) {
          if (isMounted) {
            setConversations([]);
            setLoading(false);
          }
          return;
        }

        const partnerIds = Array.from(
          new Set(
            data.map((c: any) =>
              c.participant_1 === user.id ? c.participant_2 : c.participant_1
            )
          )
        );

        const { data: profilesData } = await supabase
          .from('profiles')
          .select('id, display_name, full_name, username, avatar_url, reputation_score')
          .in('id', partnerIds);

        const profileMap = new Map((profilesData || []).map((p: any) => [p.id, p]));

        const formatted: ConversationItem[] = data.map((conv: any) => {
          const partnerId = conv.participant_1 === user.id ? conv.participant_2 : conv.participant_1;
          const partner = profileMap.get(partnerId) as any;
          return {
            id: conv.id,
            recipientId: partnerId,
            name: partner?.display_name || partner?.full_name || partner?.username || 'Member',
            avatarUrl: partner?.avatar_url || '/placeholder-avatar.svg',
            repScore: partner?.reputation_score || 95,
            lastMessage: conv.last_message || 'Started a conversation',
            lastMessageAt: conv.updated_at,
            unreadCount: 0,
          };
        });

        if (isMounted) {
          setConversations(formatted);
        }
      } catch (err) {
        console.error('Error loading conversations:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    loadConversations();

    const channelSetup = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user || !isMounted) return;

      const channelName = `user_inbox_${user.id}`;
      const existingChannel = supabase.getChannels().find((ch: any) => ch.topic === `realtime:${channelName}`);
      if (existingChannel) {
        supabase.removeChannel(existingChannel);
      }

      channel = supabase
        .channel(channelName)
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'conversations' },
          () => {
            if (isMounted) loadConversations();
          }
        )
        .subscribe();
    };
    channelSetup();

    return () => {
      isMounted = false;
      if (channel) {
        supabase.removeChannel(channel);
      }
    };
  }, []);

  const filteredConversations = conversations.filter((c) => {
    if (activeTab === 'unread' && c.unreadCount === 0) return false;
    if (searchQuery.trim() && !c.name.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  });

  return (
    <div className="flex-1 flex flex-col min-h-0 bg-[#F8F7FA] text-[#1C1924]">
      <main className="flex-1 w-full px-4 pt-4 pb-6 space-y-4">
        {/* Page Title */}
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-bold text-[#1C1924]">Messages</h1>
          <div className="flex gap-1.5 bg-white border border-[#DDD7E5] p-1 rounded-2xl">
            <button
              onClick={() => setActiveTab('all')}
              className={`px-3 py-1 rounded-xl text-xs font-semibold transition ${
                activeTab === 'all'
                  ? 'bg-[#6555b8] text-white shadow-xs'
                  : 'text-[#524B5E] hover:text-[#1C1924]'
              }`}
            >
              All
            </button>
            <button
              onClick={() => setActiveTab('unread')}
              className={`px-3 py-1 rounded-xl text-xs font-semibold transition ${
                activeTab === 'unread'
                  ? 'bg-[#6555b8] text-white shadow-xs'
                  : 'text-[#524B5E] hover:text-[#1C1924]'
              }`}
            >
              Unread
            </button>
          </div>
        </div>

        {/* Search Input */}
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#8C849B]" />
          <input
            type="text"
            placeholder="Search conversations..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-white border border-[#DDD7E5] rounded-2xl text-xs text-[#1C1924] placeholder-[#8C849B] focus:outline-none focus:border-[#6555b8] focus:ring-1 focus:ring-[#6555b8]/20 transition shadow-xs"
          />
        </div>

        {/* List of Conversations */}
        <div className="space-y-2">
          {loading ? (
            <div className="py-16 text-center text-xs text-[#8C849B]">
              Loading conversations...
            </div>
          ) : filteredConversations.length === 0 ? (
            <div className="bg-white border border-[#DDD7E5] rounded-2xl p-8 text-center space-y-3 shadow-xs">
              <div className="w-12 h-12 bg-[#F3EFFC] text-[#6555b8] rounded-2xl flex items-center justify-center mx-auto">
                <MessageCircle className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <h3 className="text-sm font-semibold text-[#1C1924]">No conversations yet</h3>
                <p className="text-xs text-[#524B5E]">
                  Discover new members and start an introduction.
                </p>
              </div>
              <Link
                href="/discover"
                className="inline-block px-4 py-2 rounded-xl bg-[#6555b8] text-white text-xs font-semibold hover:bg-[#52449e] transition shadow-xs"
              >
                Find Connections
              </Link>
            </div>
          ) : (
            filteredConversations.map((conv) => (
              <Link
                key={conv.id}
                href={`/chat/${conv.recipientId}`}
                className="flex items-center gap-3.5 p-3.5 bg-white border border-[#DDD7E5] rounded-2xl hover:border-[#6555b8]/30 hover:bg-[#FAF8FD] transition shadow-xs"
              >
                <div className="relative shrink-0">
                  <img
                    src={conv.avatarUrl}
                    alt={conv.name}
                    className="w-12 h-12 rounded-full object-cover border border-[#DDD7E5]"
                  />
                  {conv.repScore !== undefined && (
                    <span className="absolute -bottom-1 -right-1 bg-white px-1.5 py-0.5 rounded-full text-[10px] font-bold text-[#6555b8] border border-[#DDD7E5] shadow-xs">
                      {conv.repScore}%
                    </span>
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-1 mb-1">
                    <h2 className="text-xs sm:text-sm font-semibold text-[#1C1924] truncate">
                      {conv.name}
                    </h2>
                    {conv.lastMessageAt && (
                      <span className="text-[10px] text-[#8C849B] flex items-center gap-1 shrink-0">
                        <Clock className="w-2.5 h-2.5" />
                        {new Date(conv.lastMessageAt).toLocaleDateString([], {
                          month: 'short',
                          day: 'numeric',
                        })}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-[#524B5E] truncate">
                    {conv.lastMessage}
                  </p>
                </div>

                <ChevronRight className="w-4 h-4 text-[#8C849B] shrink-0" />
              </Link>
            ))
          )}
        </div>
      </main>
    </div>
  );
}
