'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { MessageCircle, Search, ChevronRight, Clock, ShieldCheck, Loader2 } from 'lucide-react';
import { supabase } from '@/lib/supabase/client';

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

        const { data: msgs, error } = await supabase
          .from('messages')
          .select('id, sender_id, receiver_id, content, created_at, is_read, is_quarantined')
          .or('sender_id.eq.' + user.id + ',receiver_id.eq.' + user.id)
          .order('created_at', { ascending: false });

        if (error || !msgs || msgs.length === 0) {
          if (isMounted) {
            setConversations([]);
            setLoading(false);
          }
          return;
        }

        const partnerMap = new Map<string, { lastMessage: string; lastMessageAt: string; messageId: string; unreadCount: number }>();
        for (const m of (msgs as any[])) {
          if (m.is_quarantined && m.sender_id !== user.id) continue;
          const partnerId = m.sender_id === user.id ? m.receiver_id : m.sender_id;
          if (!partnerId) continue;

          const isUnreadIncoming = m.receiver_id === user.id && !m.is_read;

          if (!partnerMap.has(partnerId)) {
            partnerMap.set(partnerId, {
              lastMessage: m.content || 'Sent a message',
              lastMessageAt: m.created_at,
              messageId: m.id,
              unreadCount: isUnreadIncoming ? 1 : 0,
            });
          } else if (isUnreadIncoming) {
            const current = partnerMap.get(partnerId)!;
            current.unreadCount += 1;
          }
        }

        const partnerIds = Array.from(partnerMap.keys());
        if (partnerIds.length === 0) {
          if (isMounted) {
            setConversations([]);
            setLoading(false);
          }
          return;
        }

        const { data: profilesData } = await supabase
          .from('profiles')
          .select('id, display_name, full_name, username, avatar_url, reputation_score')
          .in('id', partnerIds);

        const profileMap = new Map((profilesData || []).map((p: any) => [p.id, p]));

        const formatted: ConversationItem[] = partnerIds.map((partnerId) => {
          const info = partnerMap.get(partnerId)!;
          const partner = profileMap.get(partnerId) as any;
          const cleanName =
            (partner?.username && !partner.username.startsWith('user_') ? partner.username.replace(/^@/, '') : '') ||
            partner?.display_name ||
            partner?.full_name ||
            'Member';

          return {
            id: info.messageId,
            recipientId: partnerId,
            name: cleanName,
            avatarUrl: partner?.avatar_url || '/placeholder-avatar.svg',
            repScore: partner?.reputation_score ?? 100,
            lastMessage: info.lastMessage,
            lastMessageAt: info.lastMessageAt,
            unreadCount: info.unreadCount,
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

      const channelName = 'user_inbox_' + user.id;
      const existingChannel = supabase.getChannels().find((ch: any) => ch.topic === 'realtime:' + channelName);
      if (existingChannel) {
        supabase.removeChannel(existingChannel);
      }

      channel = supabase
        .channel(channelName)
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'messages' },
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
    <div className="w-full min-h-full bg-[#F8F7FA] text-[#1C1924] flex flex-col font-sans">
      <main className="flex-1 w-full px-4 pt-4 pb-24 space-y-4">
        {/* Subtitle + All/Unread Tabs */}
        <div className="flex items-center justify-between gap-2">
          <p className="text-xs text-[#6C637B]">
            Direct messages with your connections
          </p>

          <div className="flex items-center gap-1.5 bg-white border border-[#DDD7E5] p-1 rounded-full shadow-2xs shrink-0">
            <button
              type="button"
              onClick={() => setActiveTab('all')}
              className={
                'px-3 py-1.5 rounded-full text-xs font-semibold transition cursor-pointer ' +
                (activeTab === 'all'
                  ? 'bg-[#6555B8] text-white shadow-xs'
                  : 'text-[#524B5E] hover:text-[#1C1924]')
              }
            >
              All
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('unread')}
              className={
                'px-3 py-1.5 rounded-full text-xs font-semibold transition cursor-pointer ' +
                (activeTab === 'unread'
                  ? 'bg-[#6555B8] text-white shadow-xs'
                  : 'text-[#524B5E] hover:text-[#1C1924]')
              }
            >
              Unread
            </button>
          </div>
        </div>

        {/* Search Input aligned to px-4 */}
        <div className="w-full px-4 py-2.5 bg-white border border-[#DDD7E5] hover:border-[#CFC8DC] focus-within:border-[#6555B8] focus-within:ring-2 focus-within:ring-[#6555B8]/15 rounded-full shadow-2xs transition-all flex items-center gap-2.5">
          <Search className="w-4 h-4 text-[#8C849B] shrink-0 pointer-events-none" />
          <input
            type="text"
            placeholder="Search conversations by username..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-transparent text-xs sm:text-sm text-[#1C1924] placeholder-[#8C849B] focus:outline-none min-w-0"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="text-xs text-[#8C849B] hover:text-[#1C1924] shrink-0"
            >
              Clear
            </button>
          )}
        </div>

        {/* List of Conversations */}
        <div className="space-y-2.5">
          {loading ? (
            <div className="py-20 text-center space-y-2">
              <Loader2 className="w-6 h-6 text-[#6555B8] animate-spin mx-auto" />
              <p className="text-xs text-[#6C637B]">Loading conversations...</p>
            </div>
          ) : filteredConversations.length === 0 ? (
            <div className="bg-white border border-[#DDD7E5] rounded-3xl px-4 py-8 text-center space-y-3 shadow-xs">
              <div className="w-12 h-12 bg-[#F3EFFC] text-[#6555B8] rounded-2xl flex items-center justify-center mx-auto">
                <MessageCircle className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <h2
                  className="text-base font-bold text-[#1C1924]"
                  style={{ fontFamily: 'var(--font-brand)' }}
                >
                  No conversations yet
                </h2>
                <p className="text-xs text-[#6C637B] max-w-xs mx-auto leading-relaxed">
                  Explore the Discover feed and send a thoughtful hello to start a conversation.
                </p>
              </div>
              <Link
                href="/discover"
                className="inline-block px-5 py-2.5 rounded-full bg-[#6555B8] text-white text-xs font-semibold hover:bg-[#52449e] transition shadow-sm"
              >
                Explore Discover Feed
              </Link>
            </div>
          ) : (
            filteredConversations.map((conv) => (
              <Link
                key={conv.id}
                href={'/chat/' + conv.recipientId}
                className="flex items-center gap-3.5 px-4 py-3.5 bg-white border border-[#DDD7E5] rounded-3xl hover:border-[#6555B8]/40 hover:bg-[#FAF8FD] transition shadow-xs"
              >
                <div className="relative w-11 h-11 shrink-0">
                  <img
                    src={conv.avatarUrl}
                    alt={conv.name}
                    className="rounded-full object-cover w-11 h-11 border border-[#DDD7E5]"
                  />
                  {conv.repScore !== undefined && (
                    <span className="absolute -bottom-1 -right-1 bg-[#F3EFFC] px-1.5 py-0.5 rounded-full text-[9px] font-bold text-[#6555B8] border border-[#DDD7E5] shadow-2xs flex items-center gap-0.5">
                      <ShieldCheck className="w-2.5 h-2.5 text-[#6555B8]" />
                      {conv.repScore}%
                    </span>
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-1 mb-0.5">
                    <h2
                      className="text-sm font-bold text-[#1C1924] truncate"
                      style={{ fontFamily: 'var(--font-brand)' }}
                    >
                      @{conv.name}
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
                  <div className="flex items-center justify-between gap-2">
                    <p
                      className={
                        'text-xs truncate ' +
                        (conv.unreadCount > 0 ? 'font-semibold text-[#1C1924]' : 'text-[#6C637B]')
                      }
                    >
                      {conv.lastMessage}
                    </p>
                    {conv.unreadCount > 0 && (
                      <span className="px-2 py-0.5 rounded-full bg-[#6555B8] text-white text-[10px] font-bold shrink-0">
                        {conv.unreadCount}
                      </span>
                    )}
                  </div>
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