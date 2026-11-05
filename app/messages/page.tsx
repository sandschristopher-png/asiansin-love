'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { MessageCircle, Search, ChevronRight, ShieldCheck } from 'lucide-react';
import { supabase } from '@/lib/supabase/client';
import { ReputationBadge } from '@/components/ReputationBadge';
import { SwipeableConversationItem } from '@/components/chat/SwipeableConversationItem';

interface ConversationItem {
  id: string;
  recipientId: string;
  name: string;
  avatarUrl?: string;
  repScore?: number;
  lastMessage: string;
  lastMessageAt: string;
  unreadCount: number;
  /** Swiped "Mark unread" (conversation_states): shows as unread until opened. */
  markedUnread?: boolean;
}

const isUnread = (c: ConversationItem) => c.unreadCount > 0 || Boolean(c.markedUnread);

type ConvState = { partner_id: string; marked_unread: boolean; hidden_before: string | null };

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


let memoryConversationsCache: ConversationItem[] | null = null;
function getInitialConversations(): ConversationItem[] {
  if (memoryConversationsCache) return memoryConversationsCache.slice();
  if (typeof window !== 'undefined') {
    try {
      const raw = sessionStorage.getItem('ail_messages_fast_cache');
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          memoryConversationsCache = parsed;
          return parsed.slice();
        }
      }
    } catch {}
  }
  return [];
}

export default function MessagesPage() {
  const router = useRouter();
  const initialConversations = getInitialConversations();
  const [conversations, setConversations] = useState<ConversationItem[]>(() => initialConversations);
  const [loading, setLoading] = useState(() => initialConversations.length === 0);
  const [activeTab, setActiveTab] = useState<'all' | 'unread'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const loadConversations = useCallback(
    async (userId: string, isMountedRef: { current: boolean }) => {
      try {
        const [{ data: msgs, error }, statesRes] = await Promise.all([
          supabase
            .from('messages')
            .select('id, sender_id, receiver_id, content, created_at, is_read, is_quarantined')
            .or('sender_id.eq.' + userId + ',receiver_id.eq.' + userId)
            .order('created_at', { ascending: false })
            // Newest 500 are plenty to build the conversation list; never scan the full history.
            .limit(500),
          // Per-member swipe state (20261115_conversation_states.sql); an error just means none.
          supabase.from('conversation_states').select('partner_id, marked_unread, hidden_before').eq('user_id', userId),
        ]);
        const states = new Map<string, ConvState>(((statesRes.data || []) as ConvState[]).map((s) => [s.partner_id, s]));

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
          // Deleted (swiped away): only messages after that point bring the conversation back.
          const hiddenBefore = states.get(partnerId)?.hidden_before;
          if (hiddenBefore && m.created_at <= hiddenBefore) continue;

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
              markedUnread: Boolean(states.get(partnerId)?.marked_unread),
            };
          });

        memoryConversationsCache = formatted;
          if (typeof window !== 'undefined') {
            try {
              sessionStorage.setItem('ail_messages_fast_cache', JSON.stringify(formatted));
            } catch {}
          }
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
      // Local session read (no network round trip); RLS still scopes every query to this member.
      const {
        data: { session },
      } = await supabase.auth.getSession();
      const user = session?.user;
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

  const [actionError, setActionError] = useState<string | null>(null);
  const [pendingDelete, setPendingDelete] = useState<ConversationItem | null>(null);

  const patchConversation = (recipientId: string, patch: Partial<ConversationItem>) =>
    setConversations((prev) => prev.map((c) => (c.recipientId === recipientId ? { ...c, ...patch } : c)));

  /** Swipe right / hover button: Read <-> Unread, applied at once and rolled back on failure. */
  const toggleRead = async (conv: ConversationItem) => {
    setActionError(null);
    const { data: { session } } = await supabase.auth.getSession();
    const uid = session?.user?.id;
    if (!uid) return;
    const now = new Date().toISOString();
    if (isUnread(conv)) {
      patchConversation(conv.recipientId, { unreadCount: 0, markedUnread: false });
      const [msgRes, stateRes] = await Promise.all([
        conv.unreadCount > 0
          ? supabase
              .from('messages')
              .update({ is_read: true })
              .eq('receiver_id', uid)
              .eq('sender_id', conv.recipientId)
              .eq('is_read', false)
          : Promise.resolve({ error: null }),
        supabase
          .from('conversation_states')
          .upsert({ user_id: uid, partner_id: conv.recipientId, marked_unread: false, updated_at: now }, { onConflict: 'user_id,partner_id' }),
      ]);
      if (msgRes.error || (stateRes.error && conv.markedUnread)) {
        patchConversation(conv.recipientId, { unreadCount: conv.unreadCount, markedUnread: conv.markedUnread });
        setActionError('Could not mark as read. Please try again.');
      }
    } else {
      patchConversation(conv.recipientId, { markedUnread: true });
      const { error } = await supabase
        .from('conversation_states')
        .upsert({ user_id: uid, partner_id: conv.recipientId, marked_unread: true, updated_at: now }, { onConflict: 'user_id,partner_id' });
      if (error) {
        patchConversation(conv.recipientId, { markedUnread: false });
        setActionError('Could not mark as unread. Please try again.');
      }
    }
  };

  /** Confirmed delete: hidden for this member only (the other member keeps the thread). */
  const confirmDelete = async () => {
    const conv = pendingDelete;
    setPendingDelete(null);
    if (!conv) return;
    setActionError(null);
    const { data: { session } } = await supabase.auth.getSession();
    const uid = session?.user?.id;
    if (!uid) return;
    const previous = conversations;
    setConversations((prev) => prev.filter((c) => c.recipientId !== conv.recipientId));
    const now = new Date().toISOString();
    const { error } = await supabase
      .from('conversation_states')
      .upsert(
        { user_id: uid, partner_id: conv.recipientId, hidden_before: now, marked_unread: false, updated_at: now },
        { onConflict: 'user_id,partner_id' }
      );
    if (error) {
      setConversations(previous);
      setActionError('Could not delete the conversation. Please try again.');
    }
  };

  // Unread conversations first (chat alerts live here and on the Messages tab badge), newest first within each group.
  const filteredConversations = conversations
    .filter((c) => {
      if (activeTab === 'unread' && !isUnread(c)) return false;
      if (searchQuery.trim() && !c.name.toLowerCase().includes(searchQuery.toLowerCase())) return false;
      return true;
    })
    .sort(
      (a, b) =>
        Number(isUnread(b)) - Number(isUnread(a)) ||
        new Date(b.lastMessageAt).getTime() - new Date(a.lastMessageAt).getTime()
    );

  return (
    <div className="w-full min-h-[100dvh] bg-white text-[#51376D] flex flex-col font-sans overscroll-y-contain">
        <main className="flex-1 w-full px-4 pt-3.5 pb-[calc(8rem+env(safe-area-inset-bottom,0px))] space-y-3.5">
        <div className="flex items-center justify-between gap-2">
          <p className="text-xs text-[#51376D]/75 font-medium">Direct messages with your connections</p>

          <div className="flex items-center gap-1 bg-white border border-[#D5C6EC] p-1 rounded-full shrink-0">
            <button
              type="button"
              onClick={() => setActiveTab('all')}
              className={
                'px-3 py-1 rounded-full text-xs font-semibold transition cursor-pointer ' +
                (activeTab === 'all' ? 'bg-[#72519A] text-white shadow-2xs' : 'text-[#51376D]/85 hover:text-[#51376D]')
              }
            >
              All
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('unread')}
              className={
                'px-3 py-1 rounded-full text-xs font-semibold transition cursor-pointer ' +
                (activeTab === 'unread' ? 'bg-[#72519A] text-white shadow-2xs' : 'text-[#51376D]/85 hover:text-[#51376D]')
              }
            >
              Unread
            </button>
          </div>
        </div>

        <div className="w-full px-3.5 py-2 bg-white border border-[#D5C6EC] focus-within:border-[#72519A] focus-within:ring-2 focus-within:ring-[#72519A]/15 rounded-full transition-all flex items-center gap-2.5">
          <Search className="w-4 h-4 text-[#51376D]/55 shrink-0 pointer-events-none" />
          <input
            type="text"
            placeholder="Search conversations..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-transparent text-xs sm:text-sm text-[#51376D] placeholder-[#51376D]/55 focus:outline-none min-w-0"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="text-xs text-[#51376D]/55 hover:text-[#51376D] shrink-0 cursor-pointer"
            >
              Clear
            </button>
          )}
        </div>

        {actionError && (
          <p role="alert" className="rounded-2xl border border-red-200 bg-red-50 px-3.5 py-2 text-xs font-medium text-[#DC2626]">
            {actionError}
          </p>
        )}

        <div className="space-y-2">
          {loading ? (
            <div className="space-y-2" aria-busy="true" aria-label="Loading conversations">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="flex items-center gap-3 p-3 rounded-3xl bg-white border border-[#D5C6EC]">
                  <div className="w-12 h-12 rounded-full ail-shimmer shrink-0" />
                  <div className="flex-1 space-y-2">
                    <div className="h-3 w-1/3 rounded-full ail-shimmer" />
                    <div className="h-2.5 w-2/3 rounded-full ail-shimmer" />
                  </div>
                </div>
              ))}
            </div>
          ) : filteredConversations.length === 0 ? (
            <div className="bg-white border border-[#D5C6EC] rounded-3xl px-4 py-8 text-center space-y-3">
              <div className="w-11 h-11 bg-[#E8DFF5]/60 text-[#72519A] rounded-2xl flex items-center justify-center mx-auto">
                <MessageCircle className="w-5 h-5" />
              </div>
              <div className="space-y-1">
                <h2 className="text-sm font-bold text-[#51376D]" style={{ fontFamily: 'var(--font-brand)' }}>
                  No conversations yet
                </h2>
                <p className="text-xs text-[#51376D]/75 max-w-xs mx-auto leading-relaxed">
                  Explore the Discover feed and send a friendly hello to start a conversation.
                </p>
              </div>
              <Link
                href="/discover"
                className="inline-block px-5 py-2.5 rounded-full bg-[#72519A] text-white text-xs font-semibold hover:bg-[#51376D] transition"
              >
                Explore Discover Feed
              </Link>
            </div>
          ) : (
            filteredConversations.map((conv) => (
              <SwipeableConversationItem
                key={conv.recipientId}
                label={conv.name}
                unread={isUnread(conv)}
                onToggleRead={() => void toggleRead(conv)}
                onDelete={() => setPendingDelete(conv)}
              >
              <Link
                href={'/chat/' + conv.recipientId}
                draggable={false}
                className={
                  'flex items-center gap-3.5 px-3.5 py-3 bg-white border rounded-2xl transition-colors ' +
                  (isUnread(conv)
                    ? 'border-[#72519A]/40 bg-white'
                    : 'border-[#D5C6EC] hover:border-[#72519A]/30 hover:bg-[#E8DFF5]/40')
                }
              >
                <div className="relative w-12 h-12 shrink-0">
                  <img
                    src={conv.avatarUrl}
                    alt={conv.name}
                    className="rounded-full object-cover w-12 h-12 border border-[#D5C6EC]"
                  />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2 mb-0.5">
                    <div className="flex items-center gap-1.5 min-w-0">
                      <h2
                        className="text-[13.5px] font-bold text-[#51376D] truncate"
                        style={{ fontFamily: 'var(--font-brand)' }}
                      >
                        {conv.name}
                      </h2>
                      {conv.repScore !== undefined && <ReputationBadge score={conv.repScore} size="xs" />}
                    </div>
                    {conv.lastMessageAt && (
                      <span
                        className={
                          'text-[10.5px] shrink-0 ' +
                          (isUnread(conv) ? 'text-[#72519A] font-semibold' : 'text-[#51376D]/55')
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
                        (isUnread(conv) ? 'font-semibold text-[#51376D]' : 'text-[#51376D]/75')
                      }
                    >
                      {conv.lastMessage}
                    </p>
                    {conv.unreadCount > 0 ? (
                      <span className="min-w-[18px] h-[18px] px-1.5 rounded-full bg-[#72519A] text-white text-[10px] font-bold flex items-center justify-center shrink-0">
                        {conv.unreadCount}
                      </span>
                    ) : conv.markedUnread ? (
                      <span className="w-2.5 h-2.5 rounded-full bg-[#72519A] shrink-0" aria-label="Marked unread" />
                    ) : null}
                  </div>
                </div>

                <ChevronRight className="w-4 h-4 text-[#51376D]/55 shrink-0" />
              </Link>
              </SwipeableConversationItem>
            ))
          )}
        </div>
      </main>

      {pendingDelete && (
        <div className="fixed inset-0 z-[80] flex items-end sm:items-center justify-center bg-black/40 px-4 pb-[max(1rem,env(safe-area-inset-bottom))]" onClick={() => setPendingDelete(null)}>
          <div
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="delete-conv-title"
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-[380px] rounded-3xl bg-white border border-[#D5C6EC] p-5 shadow-brand-md"
          >
            <h2 id="delete-conv-title" className="text-sm font-bold text-[#51376D]">
              Delete conversation with {pendingDelete.name}?
            </h2>
            <p className="mt-1.5 text-xs leading-relaxed text-[#51376D]/75">
              It disappears from your Messages. {pendingDelete.name} keeps their copy, and a new message from them starts a fresh conversation.
            </p>
            <div className="mt-4 flex gap-2.5">
              <button
                type="button"
                onClick={() => setPendingDelete(null)}
                className="flex-1 h-11 rounded-full border border-[#D5C6EC] bg-white text-sm font-medium text-[#51376D] hover:bg-[#E8DFF5]/30 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => void confirmDelete()}
                className="flex-1 h-11 rounded-full bg-[#DC2626] text-sm font-semibold text-white hover:bg-red-700 transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}