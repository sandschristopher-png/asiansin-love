'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { Heart, Sparkles, X, MessageCircle } from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';

interface MatchToastData {
  id: string;
  name: string;
  avatarUrl?: string;
  targetId: string;
}

export function RealtimeMatchToast() {
  const [matchData, setMatchData] = useState<MatchToastData | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    let channel: any = null;
    let isMounted = true;
    let dismissTimer: NodeJS.Timeout;

    const showMatch = (data: MatchToastData) => {
      setMatchData(data);
      setVisible(true);
      clearTimeout(dismissTimer);
      dismissTimer = setTimeout(() => {
        if (isMounted) setVisible(false);
      }, 6500);
    };

    // 1. Listen to client-side dispatched mutual match events
    const handleLocalMutualMatch = async (e: any) => {
      const { targetId } = e.detail || {};
      if (!targetId) return;

      try {
        const { data: profile } = await supabase
          .from('profiles')
          .select('id, full_name, display_name, username, avatar_url')
          .eq('id', targetId)
          .maybeSingle();

        if (isMounted) {
          showMatch({
            id: targetId,
            targetId,
            name: profile?.display_name || profile?.full_name || profile?.username || 'Someone',
            avatarUrl: profile?.avatar_url || '/placeholder-avatar.svg',
          });
        }
      } catch (err) {
        console.error('Failed to fetch matched profile details:', err);
      }
    };

    window.addEventListener('ail-mutual-match', handleLocalMutualMatch);

    // 2. Listen to Supabase Realtime for database match notifications
    const initRealtime = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user || !isMounted) return;

        channel = supabase
          .channel(`match_toast_${user.id}`)
          .on(
            'postgres_changes',
            {
              event: 'INSERT',
              schema: 'public',
              table: 'notifications',
              filter: `user_id=eq.${user.id}`,
            },
            async (payload: any) => {
              const newRow = payload.new;
              if (newRow && newRow.type === 'match') {
                showMatch({
                  id: newRow.id,
                  targetId: newRow.actor_id || '',
                  name: newRow.title || "It's a Match!",
                  avatarUrl: undefined,
                });
              }
            }
          )
          .subscribe();
      } catch (err) {
        console.warn('Realtime subscription skipped:', err);
      }
    };

    initRealtime();

    return () => {
      isMounted = false;
      clearTimeout(dismissTimer);
      window.removeEventListener('ail-mutual-match', handleLocalMutualMatch);
      if (channel) supabase.removeChannel(channel);
    };
  }, []);

  if (!matchData || !visible) return null;

  return (
    <aside 
      aria-label="Match alert"
      className="absolute top-16 inset-x-3 z-50 pointer-events-auto animate-[pairsPageIn_320ms_cubic-bezier(0.16,1,0.3,1)_both]"
    >
      <div className="bg-white/95 backdrop-blur-md border border-[#6555b8]/30 rounded-2xl p-3 shadow-[0_12px_36px_rgba(101,85,184,0.22)] flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <div className="relative shrink-0">
            {matchData.avatarUrl ? (
              <img
                src={matchData.avatarUrl}
                alt={matchData.name}
                className="w-11 h-11 rounded-full object-cover ring-2 ring-[#6555b8]/30"
              />
            ) : (
              <div className="w-11 h-11 rounded-full bg-[#F3EFFC] flex items-center justify-center text-[#6555b8]">
                <Heart className="w-5 h-5 fill-[#6555b8]" />
              </div>
            )}
            <span className="absolute -bottom-1 -right-1 p-0.5 rounded-full bg-[#6555b8] text-white">
              <Sparkles className="w-3 h-3" />
            </span>
          </div>

          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="text-[11px] font-semibold text-[#6555b8] uppercase tracking-wider">
                Mutual Match!
              </span>
            </div>
            <p className="text-xs font-medium text-[#1C1924] truncate">
              You and {matchData.name} liked each other
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          {matchData.targetId ? (
            <Link
              href={`/profile/${matchData.targetId}`}
              onClick={() => setVisible(false)}
              className="px-2.5 py-1.5 rounded-full bg-[#6555b8] text-white text-[11px] font-medium flex items-center gap-1 active:scale-95 shadow-xs"
            >
              <MessageCircle className="w-3 h-3" />
              <span>Say Hi</span>
            </Link>
          ) : null}
          <button
            type="button"
            onClick={() => setVisible(false)}
            className="p-1 text-[#756D82] hover:text-[#1C1924] transition rounded-full hover:bg-black/5"
            aria-label="Dismiss toast"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </aside>
  );
}
