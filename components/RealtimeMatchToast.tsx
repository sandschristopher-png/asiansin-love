'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { Sparkles, MessageCircle, X } from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';
import { playMatchChime } from '@/lib/sound';

interface MatchEvent {
  matchedProfileId: string;
  matchedName: string;
  avatarUrl: string;
}

export function RealtimeMatchToast() {
  const [match, setMatch] = useState<MatchEvent | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    let channel: any;

    const setupMatchListener = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;
      const currentUserId = session.user.id;

      channel = supabase
        .channel('realtime-inbound-likes')
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'likes',
            filter: `target_user_id=eq.${currentUserId}`
          },
          async (payload: any) => {
            const senderId = payload.new.user_id;

            // Check mutual like
            const { data: mutual } = await supabase
              .from('likes')
              .select('id')
              .eq('user_id', currentUserId)
              .eq('target_user_id', senderId)
              .maybeSingle();

            if (mutual) {
              const { data: profile } = await supabase
                .from('profiles')
                .select('id, full_name, display_name, name, avatar_url')
                .eq('id', senderId)
                .single();

              if (profile) {
                if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
                  try { navigator.vibrate([30, 60, 30]); } catch (_) {}
                }
                playMatchChime();
                setMatch({
                  matchedProfileId: profile.id,
                  matchedName: profile.display_name || profile.full_name || profile.name || 'Someone',
                  avatarUrl: profile.avatar_url || '/placeholder-avatar.svg'
                });
                setVisible(true);
              }
            }
          }
        )
        .subscribe();
    };

    setupMatchListener();

    return () => {
      if (channel) supabase.removeChannel(channel);
    };
  }, []);

  if (!visible || !match) return null;

  return (
    <div className="fixed top-5 left-1/2 -translate-x-1/2 z-[100] w-[92%] max-w-sm">
      <div className="flex items-center justify-between p-3.5 rounded-2xl bg-[#1C1924]/95 text-white border border-[#DDD7E5]/20 shadow-2xl backdrop-blur-md animate-in slide-in-from-top-4 duration-300">
        <div className="flex items-center gap-3">
          <img
            src={match.avatarUrl}
            alt={match.matchedName}
            className="w-10 h-10 rounded-full object-cover border-2 border-[#8B7BD9]"
          />
          <div>
            <div className="flex items-center gap-1.5 text-xs font-bold text-[#E2DCF7]">
              <Sparkles className="w-3.5 h-3.5 text-[#E05375]" />
              It's a Match!
            </div>
            <p className="text-xs text-[#B2A9C4] truncate max-w-[140px]">
              {match.matchedName} liked you back
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          <Link
            href={`/chat/${match.matchedProfileId}`}
            onClick={() => setVisible(false)}
            className="px-3 py-1.5 rounded-xl bg-[#6555B8] hover:bg-[#5344A6] text-white text-xs font-semibold flex items-center gap-1 transition"
          >
            <MessageCircle className="w-3.5 h-3.5" />
            Chat
          </Link>
          <button
            type="button"
            onClick={() => setVisible(false)}
            className="p-1 text-white/60 hover:text-white transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
export default RealtimeMatchToast;
