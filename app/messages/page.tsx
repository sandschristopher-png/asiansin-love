'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { MessageCircle, ShieldCheck, Search, ChevronRight, Clock } from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';

interface ConversationItem {
  id: string;
  matchId?: string;
  recipientId: string;
  name: string;
  avatarUrl?: string;
  repScore?: number;
  lastMessage: string;
  lastMessageAt: string;
  unreadCount: number;
}

export default function MessagesPage() {
  const [activeTab, setActiveTab] = useState<'all' | 'unread'>('all');
  const [conversations, setConversations] = useState<ConversationItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchConversations() {
      setLoading(true);
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          setLoading(false);
          return;
        }

        // Fetch conversations/matches
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

        if (error || !data) {
          setConversations([]);
        } else {
          // Format conversation items
          const items: ConversationItem[] = data.map((c: any) => {
            const partnerId = c.participant_1 === user.id ? c.participant_2 : c.participant_1;
            return {
              id: c.id,
              recipientId: partnerId,
              name: 'Member',
              lastMessage: c.last_message || 'Started a conversation',
              lastMessageAt: new Date(c.updated_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
              unreadCount: 0,
            };
          });
          setConversations(items);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }

    fetchConversations();
  }, []);

  const filteredConversations = conversations.filter((c) => {
    if (activeTab === 'unread' && c.unreadCount === 0) return false;
    if (searchQuery.trim() && !c.name.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  });

  return (
    <main className="flex-1 max-w-4xl mx-auto w-full px-4 sm:px-6 lg:px-8 pt-6 pb-32 space-y-6">
      {/* Header & Subtitle */}
      <div className="space-y-1">
        <h1 className="text-2xl sm:text-3xl font-bold text-[#1C1924]">Direct Messages</h1>
        <p className="text-xs sm:text-sm text-[#756D82]">
          Private, authentic courtship conversations with verified members.
        </p>
      </div>

      {/* Control Row: Search & Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        {/* Filter Pills */}
        <div className="flex items-center gap-1.5 p-1 bg-white border border-[#DDD7E5] rounded-full shadow-xs w-fit">
          <button
            type="button"
            onClick={() => setActiveTab('all')}
            className={'px-4 py-1.5 text-xs sm:text-sm font-semibold rounded-full transition-all ' + (
              activeTab === 'all'
                ? 'bg-[#6555b8] text-white shadow-xs'
                : 'text-[#524B5E] hover:text-[#1C1924] hover:bg-[#F3EFFC]'
            )}
          >
            All Messages
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('unread')}
            className={'px-4 py-1.5 text-xs sm:text-sm font-semibold rounded-full transition-all ' + (
              activeTab === 'unread'
                ? 'bg-[#6555b8] text-white shadow-xs'
                : 'text-[#524B5E] hover:text-[#1C1924] hover:bg-[#F3EFFC]'
            )}
          >
            Unread
          </button>
        </div>

        {/* Quick Search */}
        <div className="relative w-full sm:w-64">
          <Search className="w-4 h-4 text-[#8C849B] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search conversations..."
            className="w-full pl-9 pr-4 py-1.5 bg-white border border-[#DDD7E5] rounded-full text-xs sm:text-sm text-[#1C1924] placeholder-[#8C849B] focus:outline-none focus:border-[#6555b8] focus:ring-2 focus:ring-[#6555b8]/15 transition-all shadow-xs"
          />
        </div>
      </div>

      {/* Conversations Container */}
      <div className="bg-white rounded-3xl border border-[#DDD7E5] shadow-xs overflow-hidden divide-y divide-[#E5E1EC]">
        {loading ? (
          <div className="py-16 text-center text-xs sm:text-sm text-[#756D82]">
            Loading conversations...
          </div>
        ) : filteredConversations.length === 0 ? (
          <div className="py-16 px-6 text-center space-y-4">
            <div className="w-12 h-12 rounded-full bg-[#F3EFFC] text-[#6555b8] flex items-center justify-center mx-auto">
              <MessageCircle className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <h3 className="text-sm sm:text-base font-bold text-[#1C1924]">No conversations yet</h3>
              <p className="text-xs sm:text-sm text-[#756D82] max-w-sm mx-auto">
                Explore profiles in the discover feed to send introductions and initiate meaningful courtship.
              </p>
            </div>
            <Link
              href="/discover"
              className="inline-flex px-6 py-2.5 rounded-full bg-[#6555b8] text-white text-xs sm:text-sm font-semibold hover:bg-[#52449e] transition shadow-xs"
            >
              Explore Discover Feed
            </Link>
          </div>
        ) : (
          filteredConversations.map((c) => (
            <Link
              key={c.id}
              href={`/messages/${c.id}`}
              className="flex items-center justify-between p-4 sm:p-5 hover:bg-[#FAF8FD] transition group"
            >
              <div className="flex items-center gap-3.5 sm:gap-4 min-w-0">
                {/* Avatar with Rep Indicator */}
                <div className="relative w-12 h-12 sm:w-14 sm:h-14 rounded-full overflow-hidden bg-[#EAE6F2] shrink-0 border border-[#DDD7E5]">
                  {c.avatarUrl ? (
                    <img src={c.avatarUrl} alt={c.name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center font-bold text-[#6555b8] text-sm">
                      {c.name.slice(0, 2).toUpperCase()}
                    </div>
                  )}
                </div>

                {/* Details */}
                <div className="min-w-0 space-y-1">
                  <div className="flex items-center gap-2">
                    <h2 className="text-sm sm:text-base font-bold text-[#1C1924] truncate group-hover:text-[#6555b8] transition">
                      {c.name}
                    </h2>
                    <span className="flex items-center gap-0.5 text-[10px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                      <ShieldCheck className="w-3 h-3 text-emerald-600" />
                      {c.repScore || 100}% Rep
                    </span>
                  </div>
                  <p className="text-xs sm:text-sm text-[#524B5E] truncate">
                    {c.lastMessage}
                  </p>
                </div>
              </div>

              {/* Timestamp & Chevron */}
              <div className="flex items-center gap-2 sm:gap-3 shrink-0 ml-3">
                <span className="text-[11px] sm:text-xs text-[#8C849B] flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {c.lastMessageAt}
                </span>
                <ChevronRight className="w-4 h-4 text-[#8C849B] group-hover:text-[#6555b8] group-hover:translate-x-0.5 transition" />
              </div>
            </Link>
          ))
        )}
      </div>
    </main>
  );
}