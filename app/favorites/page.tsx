// app/favorites/page.tsx — Sparks Hub
'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { Zap, Lock, Eye } from 'lucide-react';
import { createBrowserClient } from '@supabase/ssr';

type SubTab = 'you-sparked' | 'sparked-you' | 'mutual' | 'visited-you';

type SparkCard = {
  id: string;
  display_name?: string | null;
  username?: string | null;
  age?: number | null;
  city?: string | null;
  avatar_url?: string | null;
  last_active?: string | null;
};

export default function SparksPage() {
  const [tab, setTab] = useState<SubTab>('you-sparked');
  const [cards, setCards] = useState<SparkCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [isPlus, setIsPlus] = useState(false);
  const [myGender, setMyGender] = useState<string | null>(null);

  const fetchAll = useCallback(async () => {
    const supabase = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setCards([]); setLoading(false); return; }

      const { data: me } = await supabase
        .from('profiles')
        .select('is_plus, gender')
        .eq('id', user.id)
        .single();
      setIsPlus(!!me?.is_plus);
      setMyGender(me?.gender ?? null);

      // Blocked users excluded everywhere
      const { data: blocks } = await supabase
        .from('user_blocks')
        .select('blocker_id, blocked_id')
        .or(`blocker_id.eq.${user.id},blocked_id.eq.${user.id}`);
      const blocked = new Set<string>();
      (blocks || []).forEach((b: any) => {
        blocked.add(b.blocker_id); blocked.add(b.blocked_id);
      });
      blocked.delete(user.id);

      // All sparks involving me
      const { data: mySparks } = await supabase
        .from('sparks')
        .select('sender_id, receiver_id, created_at')
        .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`)
        .order('created_at', { ascending: false });

      const sent = new Set((mySparks || []).filter((s: any) => s.sender_id === user.id).map((s: any) => s.receiver_id));
      const receivedIds = (mySparks || []).filter((s: any) => s.receiver_id === user.id).map((s: any) => s.sender_id);
      const mutualIds = receivedIds.filter((id: string) => sent.has(id));

      let targetIds: string[] = [];
      if (tab === 'you-sparked') targetIds = [...sent];
      else if (tab === 'sparked-you') targetIds = receivedIds;
      else if (tab === 'mutual') targetIds = mutualIds;
      else if (tab === 'visited-you') {
        const { data: views } = await supabase
          .from('profile_views')
          .select('viewer_id, created_at')
          .eq('viewed_id', user.id)
          .order('created_at', { ascending: false })
          .limit(60);
        targetIds = [...new Set((views || []).map((v: any) => v.viewer_id))];
      }

      targetIds = targetIds.filter((id) => !blocked.has(id));
      if (targetIds.length === 0) { setCards([]); setLoading(false); return; }

      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, display_name, username, age, city, avatar_url, last_active')
        .in('id', targetIds);
      setCards(profiles || []);
    } catch (e) {
      console.error('Sparks page load error:', e);
      setCards([]);
    } finally {
      setLoading(false);
    }
  }, [tab]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const blurred = tab === 'sparked-you' && !isPlus;
  const locked = tab === 'visited-you' && !isPlus;

  const TABS: { key: SubTab; label: string }[] = [
    { key: 'you-sparked', label: 'You Sparked' },
    { key: 'sparked-you', label: 'Sparked You' },
    { key: 'mutual', label: 'Mutual' },
    { key: 'visited-you', label: 'Visited' },
  ];

  const emptyImg = myGender === 'woman' ? '/nomatch-f.png' : '/nomatch-m.png';
  const emptyCopy: Record<SubTab, string> = {
    'you-sparked': 'You have not sparked anyone yet',
    'sparked-you': 'No one has sparked you yet. Check back soon!',
    'mutual': 'No mutual sparks yet. Keep exploring!',
    'visited-you': 'No profile visits yet.',
  };

  return (
    <div className="w-full px-3.5 sm:px-4 pt-3 pb-28">
      {/* Compact sub-tab pills, sticky, no redundant big header */}
      <div className="sticky top-0 z-30 -mx-3.5 sm:-mx-4 px-3.5 sm:px-4 py-2 bg-white">
        <div className="flex gap-4 overflow-x-auto no-scrollbar">
          {TABS.map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`shrink-0 text-sm transition-colors ${
                tab === t.key ? 'text-[#6555B8] font-bold' : 'text-black/40 font-medium'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {locked ? (
        <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
          <div className="w-14 h-14 rounded-full bg-[#F3EFFC] flex items-center justify-center mb-4">
            <Lock className="w-6 h-6 text-[#6555B8]" />
          </div>
          <h2 className="text-lg font-semibold text-[#4C3B75]">See who visited you</h2>
          <p className="text-sm text-black/60 mt-1 mb-5">Upgrade to AIL+ to unlock your full visitor history.</p>
          <Link href="/settings" className="px-5 py-2.5 rounded-full bg-[#6555B8] text-white text-sm font-semibold">
            Upgrade to AIL+ · $14.99/mo
          </Link>
        </div>
      ) : loading ? (
        <div className="grid grid-cols-2 gap-2.5 pt-4">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="aspect-[4/5] rounded-xl bg-black/5 animate-pulse" />
          ))}
        </div>
      ) : cards.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <img src={emptyImg} alt="" className="w-36 h-36 mx-auto mb-3 object-contain" />
          <p className="text-sm text-black/60">{emptyCopy[tab]}</p>
          {tab === 'you-sparked' && (
            <Link href="/discover" className="mt-4 px-5 py-2.5 rounded-full bg-[#6555B8] text-white text-sm font-semibold">
              Discover People
            </Link>
          )}
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-2.5 pt-4">
            {cards.map((p) => (
              <Link
                key={p.id}
                href={`/profile/${p.username || p.id}`}
                className="relative rounded-xl overflow-hidden bg-[#F3EFFC]"
              >
                <div className={`aspect-[4/5] ${blurred ? 'blur-md' : ''}`}>
                  {p.avatar_url ? (
                    <img src={p.avatar_url} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <img src="/placeholder-avatar.svg" alt="" className="w-full h-full object-cover opacity-40" />
                  )}
                </div>
                {!blurred && p.last_active && isRecent(p.last_active) && (
                  <span className="absolute top-2 right-2 w-2.5 h-2.5 rounded-full bg-amber-400 ring-2 ring-white" />
                )}
                <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/60 to-transparent p-2.5">
                  <p className="text-white text-sm font-semibold truncate">
                    {p.display_name || p.username || 'Anonymous'}
                    {p.age ? `, ${p.age}` : ''}
                  </p>
                  {p.city && <p className="text-white/70 text-xs truncate">{p.city}</p>}
                </div>
              </Link>
            ))}
          </div>

          {blurred && (
            <div className="mt-4 flex flex-col items-center px-6 py-4 rounded-2xl bg-[#F3EFFC] text-center">
              <Eye className="w-5 h-5 text-[#6555B8] mb-1" />
              <p className="text-sm text-[#4C3B75] font-medium">
                {cards.length} {cards.length === 1 ? 'person has' : 'people have'} sparked you
              </p>
              <p className="text-xs text-black/60 mb-3">Upgrade to AIL+ to reveal who.</p>
              <Link href="/settings" className="px-5 py-2 rounded-full bg-[#6555B8] text-white text-sm font-semibold">
                Unlock with AIL+
              </Link>
            </div>
          )}
        </>
      )}
    </div>
  );
}

function isRecent(lastActive: string): boolean {
  const t = new Date(lastActive).getTime();
  return Date.now() - t < 15 * 60 * 1000;
}