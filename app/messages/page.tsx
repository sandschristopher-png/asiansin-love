'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { MessageCircle, Search, ChevronRight, ShieldCheck, Loader2 } from 'lucide-react';
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

function formatConversationTimestamp(iso?: string): string {
  if (!iso) return '';
  try {
    const date = new Date(iso);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return diffMins + 'm';
    if (date.toDateString() === now.toDateString()) {
      return date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
    }
    const yesterday = new Date(now);
    yesterday.setDate(now.getDate() - 1);
    if (date.toDateString() === yesterday.toDateString()) return 'Yesterday';

    return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
  } catch {
    return '';
  }
}

export default function MessagesPage() {
  const router = useRouter();
  const [conversations, setConversations] = useState<ConversationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'all' | 'unread'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const loadConversations = useCallback(
    async (userId: string, isMountedRef: { current: boolean }) => {
      try {
        const { data: msgs, error } = await supabase
          .from('messages')
          .select('id, sender_id, receiver_id, content, created_at, is_read, is_quarantined')
          .or('sender_id.eq.' + userId + ',receiver_id.eq.' + userId)
          .order('created_at', { ascending: false });

        if (error || !msgs || msgs.length === 0) {
          if (isMountedRef.current) {
            setConversations([]);
            setLoading(false);
          }
          return;
        }

        const partnerMap = new Map<
          string,
          { lastMessage: string; lastMessageAt: string; messageId: string; unreadCount: number }
        >();

        for (const m of msgs as any[]) {
          if (m.is_quarantined && m.sender_id !== userId) continue;
          const partnerId = m.sender_id === userId ? m.receiver_id : m.sender_id;
          if (!partnerId || String(partnerId).startsWith('00000000')) continue;

          const isUnreadIncoming = m.receiver_id === userId && !m.is_read;

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
          if (isMountedRef.current) {
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

        const formatted: ConversationItem[] = partnerIds
          .filter((partnerId) => profileMap.has(partnerId))
          .map((partnerId) => {
            const info = partnerMap.get(partnerId)!;
            const partner = profileMap.get(partnerId) as any;
            const cleanName =
              (partner?.username && !partner.username.startsWith('user_')
                ? partner.username.replace(/^@/, '')
                : '') ||
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

        if (isMountedRef.current) {
          setConversations(formatted);
        }
      } catch (err) {
        console.error('Error loading conversations:', err);
      } finally {
        if (isMountedRef.current) setLoading(false);
      }
    },
    []
  );

  useEffect(() => {
    const isMountedRef = { current: true };
    let channel: any = null;

    async function init() {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        if (isMountedRef.current) router.replace('/');
        return;
      }

      await loadConversations(user.id, isMountedRef);
      if (!isMountedRef.current) return;

      const channelName = 'user_inbox_' + user.id;
      channel = supabase
        .channel(channelName)
        .on('postgres_changes', { event: '*', schema: 'public', table: 'messages' }, (payload: any) => {
          if (!isMountedRef.current) return;
          const row = (payload.new || payload.old) as any;
          if (row && (row.sender_id === user.id || row.receiver_id === user.id)) {
            loadConversations(user.id, isMountedRef);
          }
        })
        .subscribe();
    }

    init();

    return () => {
      isMountedRef.current = false;
      if (channel) supabase.removeChannel(channel);
    };
  }, [router, loadConversations]);

  const filteredConversations = conversations.filter((c) => {
    if (activeTab === 'unread' && c.unreadCount === 0) return false;
    if (searchQuery.trim() && !c.name.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  });

  return (
    <div className="w-full min-h-full bg-[#F9F8FC] text-[#1C1924] flex flex-col font-sans">
      <main className="flex-1 w-full px-4 pt-3.5 pb-32 space-y-3.5">
        <div className="flex items-center justify-between gap-2">
          <p className="text-xs text-[#6C637B] font-medium">Direct messages with your connections</p>

          <div className="flex items-center gap-1 bg-white border border-[#E5DFEE] p-1 rounded-full shrink-0">
            <button
              type="button"
              onClick={() => setActiveTab('all')}
              className={
                'px-3 py-1 rounded-full text-xs font-semibold transition cursor-pointer ' +
                (activeTab === 'all' ? 'bg-[#6555B8] text-white shadow-2xs' : 'text-[#524B5E] hover:text-[#1C1924]')
              }
            >
              All
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('unread')}
              className={
                'px-3 py-1 rounded-full text-xs font-semibold transition cursor-pointer ' +
                (activeTab === 'unread' ? 'bg-[#6555B8] text-white shadow-2xs' : 'text-[#524B5E] hover:text-[#1C1924]')
              }
            >
              Unread
            </button>
          </div>
        </div>

        <div className="w-full px-3.5 py-2 bg-white border border-[#E5DFEE] focus-within:border-[#6555B8] focus-within:ring-2 focus-within:ring-[#6555B8]/15 rounded-full transition-all flex items-center gap-2.5">
          <Search className="w-4 h-4 text-[#8C849B] shrink-0 pointer-events-none" />
          <input
            type="text"
            placeholder="Search conversations..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-transparent text-xs sm:text-sm text-[#1C1924] placeholder-[#8C849B] focus:outline-none min-w-0"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="text-xs text-[#8C849B] hover:text-[#1C1924] shrink-0 cursor-pointer"
            >
              Clear
            </button>
          )}
        </div>

        <div className="space-y-2">
          {loading ? (
            <div className="py-16 text-center space-y-2">
              <Loader2 className="w-5 h-5 text-[#6555B8] animate-spin mx-auto" />
              <p className="text-xs text-[#6C637B]">Loading conversations...</p>
            </div>
          ) : filteredConversations.length === 0 ? (
            <div className="bg-white border border-[#E5DFEE] rounded-3xl px-4 py-8 text-center space-y-3">
              <div className="w-11 h-11 bg-[#F3EFFC] text-[#6555B8] rounded-2xl flex items-center justify-center mx-auto">
                <MessageCircle className="w-5 h-5" />
              </div>
              <div className="space-y-1">
                <h2 className="text-sm font-bold text-[#1C1924]" style={{ fontFamily: 'var(--font-brand)' }}>
                  No conversations yet
                </h2>
                <p className="text-xs text-[#6C637B] max-w-xs mx-auto leading-relaxed">
                  Explore the Discover feed and send a friendly hello to start a conversation.
                </p>
              </div>
              <Link
                href="/discover"
                className="inline-block px-5 py-2.5 rounded-full bg-[#6555B8] text-white text-xs font-semibold hover:bg-[#52449e] transition"
              >
                Explore Discover Feed
              </Link>
            </div>
          ) : (
            filteredConversations.map((conv) => (
              <Link
                key={conv.id}
                href={'/chat/' + conv.recipientId}
                className={
                  'flex items-center gap-3.5 px-3.5 py-3 bg-white border rounded-2xl transition ' +
                  (conv.unreadCount > 0
                    ? 'border-[#6555B8]/40 bg-[#FAF8FF]'
                    : 'border-[#EAE5F3] hover:border-[#6555B8]/30 hover:bg-[#FAF9FC]')
                }
              >
                <div className="relative w-12 h-12 shrink-0">
                  <img
                    src={conv.avatarUrl}
                    alt={conv.name}
                    className="rounded-full object-cover w-12 h-12 border border-[#E5DFEE]"
                  />
                  {conv.repScore !== undefined && (
                    <span className="absolute -bottom-0.5 -right-0.5 bg-[#F5F2FC] px-1.5 py-0.2 rounded-full text-[9px] font-bold text-[#6555B8] border border-[#E2DBF0] flex items-center gap-0.5">
                      <ShieldCheck className="w-2.5 h-2.5 text-[#6555B8]" />
                      {conv.repScore}%
                    </span>
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2 mb-0.5">
                    <h2
                      className="text-[13.5px] font-bold text-[#1C1924] truncate"
                      style={{ fontFamily: 'var(--font-brand)' }}
                    >
                      {conv.name}
                    </h2>
                    {conv.lastMessageAt && (
                      <span
                        className={
                          'text-[10.5px] shrink-0 ' +
                          (conv.unreadCount > 0 ? 'text-[#6555B8] font-semibold' : 'text-[#8C849B]')
                        }
                      >
                        {formatConversationTimestamp(conv.lastMessageAt)}
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
                      <span className="min-w-[18px] h-[18px] px-1.5 rounded-full bg-[#6555B8] text-white text-[10px] font-bold flex items-center justify-center shrink-0">
                        {conv.unreadCount}
                      </span>
                    )}
                  </div>
                </div>

                <ChevronRight className="w-4 h-4 text-[#A098B0] shrink-0" />
              </Link>
            ))
          )}
        </div>
      </main>
    </div>
  );
}