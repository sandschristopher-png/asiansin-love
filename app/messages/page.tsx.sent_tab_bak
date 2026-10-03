'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { MessageCircle, Search, ChevronRight, Clock } from 'lucide-react';
import { Navbar } from '@/components/Navbar';
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

    async function loadConversations() {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          setLoading(false);
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
          setConversations([]);
          setLoading(false);
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
          .select('id, name, avatar_url, reputation_score')
          .in('id', partnerIds);

        const profileMap = new Map((profilesData || []).map((p: any) => [p.id, p]));

        const formatted: ConversationItem[] = data.map((conv: any) => {
          const partnerId = conv.participant_1 === user.id ? conv.participant_2 : conv.participant_1;
          const partner = profileMap.get(partnerId) as any;
          return {
            id: conv.id,
            recipientId: partnerId,
            name: partner?.name || 'Member',
            avatarUrl: partner?.avatar_url || '/placeholder-avatar.svg',
            repScore: partner?.reputation_score || 95,
            lastMessage: conv.last_message || 'Started a conversation',
            lastMessageAt: conv.updated_at,
            unreadCount: 0,
          };
        });

        setConversations(formatted);
      } catch (err) {
        console.error('Error loading conversations:', err);
      } finally {
        setLoading(false);
      }
    }

    loadConversations();

    const channelSetup = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      channel = supabase
        .channel(`user_inbox_${user.id}`)
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'conversations' },
          () => loadConversations()
        )
        .subscribe();
    };
    channelSetup();

    return () => {
      if (channel) supabase.removeChannel(channel);
    };
  }, []);

  const filteredConversations = conversations.filter((c) => {
    if (activeTab === 'unread' && c.unreadCount === 0) return false;
    if (searchQuery.trim() && !c.name.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  });

  return (
    <div className="min-h-screen flex flex-col bg-[#F8F7FA] text-[#1C1924]">
      <Navbar />

      <main className="flex-1 w-full px-4 pt-4 pb-28 space-y-4">
        {/* Page Title */}
        <div className="space-y-0.5">
          <h1 className="text-xl sm:text-[22px] font-semibold text-[#1C1924] tracking-tight">Direct Messages</h1>
          <p className="text-xs text-[#756D82]">
            Private courtship conversations with verified members
          </p>
        </div>

        {/* Controls: Segmented Tabs & Search */}
        <div className="space-y-2.5">
          {/* Compact Segmented Control */}
          <div className="grid grid-cols-2 p-1 bg-[#F0ECF6] rounded-2xl text-xs font-semibold text-[#756D82]">
            <button
              type="button"
              onClick={() => setActiveTab('all')}
              className={`py-1.5 rounded-xl transition-all text-center ${
                activeTab === 'all'
                  ? 'bg-white text-[#1C1924] shadow-xs font-bold'
                  : 'hover:text-[#1C1924]'
              }`}
            >
              All Messages
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('unread')}
              className={`py-1.5 rounded-xl transition-all text-center ${
                activeTab === 'unread'
                  ? 'bg-white text-[#1C1924] shadow-xs font-bold'
                  : 'hover:text-[#1C1924]'
              }`}
            >
              Unread
            </button>
          </div>

          {/* Full-Width Search Input */}
          <div className="relative w-full">
            <Search className="w-4 h-4 text-[#8C849B] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search conversations..."
              className="w-full pl-9 pr-4 py-2 bg-white border border-[#DDD7E5] rounded-2xl text-xs text-[#1C1924] placeholder-[#8C849B] focus:outline-none focus:border-[#6555b8] shadow-xs transition"
            />
          </div>
        </div>

        {/* Conversations List */}
        <div className="bg-white rounded-3xl border border-[#DDD7E5] shadow-xs overflow-hidden divide-y divide-[#F0EDF5]">
          {loading ? (
            <div className="py-16 text-center text-xs text-[#756D82]">
              Loading conversations...
            </div>
          ) : filteredConversations.length === 0 ? (
            <div className="py-14 px-6 text-center space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-[#F3EFFC] text-[#6555b8] flex items-center justify-center mx-auto">
                <MessageCircle className="w-6 h-6 stroke-[1.75]" />
              </div>
              <div className="space-y-1 max-w-xs mx-auto">
                <h3 className="text-sm font-bold text-[#1C1924]">No conversations yet</h3>
                <p className="text-xs text-[#756D82] leading-relaxed">
                  Explore profiles in the discover feed to send introductions and initiate meaningful courtship.
                </p>
              </div>
              <Link
                href="/discover"
                className="inline-flex items-center justify-center px-5 py-2.5 rounded-full bg-[#6555b8] hover:bg-[#52449e] text-white text-xs font-semibold shadow-xs transition active:scale-95"
              >
                Explore Discover Feed
              </Link>
            </div>
          ) : (
            filteredConversations.map((c) => (
              <Link
                key={c.id}
                href={`/messages/${c.id}`}
                className="flex items-center gap-3.5 p-3.5 hover:bg-[#FAF8FD] transition group"
              >
                <div className="relative w-12 h-12 rounded-2xl overflow-hidden bg-[#FAF8FD] border border-[#DDD7E5] shrink-0">
                  <img
                    src={c.avatarUrl}
                    alt={c.name}
                    className="w-full h-full object-cover"
                  />
                </div>

                <div className="min-w-0 flex-1 space-y-1">
                  <div className="flex items-center justify-between gap-2">
                    <h4 className="text-sm font-bold text-[#1C1924] truncate group-hover:text-[#6555b8] transition">
                      {c.name}
                    </h4>
                    <span className="text-[10px] text-[#8C849B] shrink-0 flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {new Date(c.lastMessageAt).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                    </span>
                  </div>
                  <p className="text-xs text-[#756D82] truncate">
                    {c.lastMessage}
                  </p>
                </div>

                <ChevronRight className="w-4 h-4 text-[#8C849B] shrink-0 group-hover:text-[#6555b8] transition" />
              </Link>
            ))
          )}
        </div>
      </main>
    </div>
  );
}