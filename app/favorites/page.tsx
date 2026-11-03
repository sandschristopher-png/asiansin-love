'use client';

import React, { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Lock, Crown, Heart, User, Send, MessageCircle, Eye, type LucideIcon } from 'lucide-react';
import { createBrowserClient } from '@supabase/ssr';
import { CardPhoto } from '@/components/CardPhoto';

type SparkTab = 'sparked' | 'sparked_you' | 'mutual' | 'visited';

interface ProfileCardData {
  id: string;
  username?: string | null;
  display_name?: string | null;
  full_name?: string | null;
  age?: number | null;
  birthdate?: string | null;
  dob?: string | null;
  city?: string | null;
  country?: string | null;
  avatar_url?: string | null;
  photos?: string[] | null;
  reputation_score?: number | null;
  is_verified?: boolean | null;
  is_plus?: boolean | null;
  is_online?: boolean | null;
}

interface CachedSparksState {
  userGender: 'male' | 'female';
  isPlus: boolean;
  sparked: ProfileCardData[];
  sparkedYou: ProfileCardData[];
  mutual: ProfileCardData[];
  visited: ProfileCardData[];
  timestamp: number;
}

const CACHE_KEY = 'ail_sparks_fast_cache_v2';

function getPublicName(p: ProfileCardData): string {
  if (p.username && p.username.trim()) return p.username.trim().replace(/^@/, '');
  if (p.display_name && p.display_name.trim()) return p.display_name.trim();
  if (p.full_name && p.full_name.trim()) {
    return p.full_name.trim().split(/\s+/)[0];
  }
  return 'Member';
}

function getAge(p: ProfileCardData): number | null {
  if (typeof p.age === 'number' && p.age >= 18 && p.age < 100) return p.age;
  const rawDob = p.birthdate || p.dob;
  if (rawDob) {
    const birth = new Date(rawDob);
    if (!isNaN(birth.getTime())) {
      const diff = Date.now() - birth.getTime();
      const age = Math.floor(diff / (1000 * 60 * 60 * 24 * 365.25));
      if (age >= 18 && age < 100) return age;
    }
  }
  return null;
}

function getPhoto(p: ProfileCardData): string {
  if (p.avatar_url && p.avatar_url.trim()) return p.avatar_url;
  if (Array.isArray(p.photos) && p.photos.length > 0 && p.photos[0]) return p.photos[0];
  return '';
}

/** Card photo with a branded fallback (no photo, or the URL fails to load): never a black box. */
function SparkCardPhoto({ src, name, className }: { src: string; name: string; className: string }) {
  const [failedSrc, setFailedSrc] = useState<string | null>(null);
  if (!src || failedSrc === src) {
    return (
      <div className="absolute inset-0 w-full h-full bg-gradient-to-br from-[#F6F5F9] to-[#EAE7F8] flex flex-col items-center justify-center text-[#6555B8]">
        <User className="w-12 h-12 stroke-1 text-[#6555B8]/40" />
        <span className="mt-1 text-lg font-bold text-[#6555B8]/70">{(name || '?').trim().charAt(0).toUpperCase()}</span>
      </div>
    );
  }
  return <CardPhoto src={src} alt={name} className={className} onError={() => setFailedSrc(src)} />;
}

function getLocationLabel(p: ProfileCardData): string {
  const parts = [p.city, p.country].filter((x) => x && String(x).trim());
  return parts.length > 0 ? parts.join(', ') : 'Southeast Asia';
}


let memorySparksCache: any = null;
function getInitialSparksState(): any {
  if (memorySparksCache) return JSON.parse(JSON.stringify(memorySparksCache));
  if (typeof window !== 'undefined') {
    try {
      const raw = sessionStorage.getItem(CACHE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed && Array.isArray(parsed.sparked)) {
          memorySparksCache = parsed;
          return JSON.parse(JSON.stringify(parsed));
        }
      }
    } catch {}
  }
  return null;
}

const STATE_CTA_CLASS =
  'inline-flex items-center justify-center gap-2 rounded-full px-5 py-2 text-xs font-semibold text-white bg-[#6555B8] hover:bg-[#524496] active:scale-95 transition-all';

/** 1..99, then "99+"; nothing for zero. */
const formatBadgeCount = (count: number) => {
  if (!count || count <= 0) return null;
  return count > 99 ? '99+' : count.toString();
};

/**
 * Shared empty / paywall state for every Sparks tab, matching Discover's: a Lucide line icon in a
 * soft brand squircle (no illustrations), title, one-line subtitle and a single CTA.
 */
function TabState({
  icon: Icon,
  title,
  subtitle,
  cta,
}: {
  icon: LucideIcon;
  title: string;
  subtitle: string;
  cta: React.ReactNode;
}) {
  return (
    <div className="animate-fade-in-up flex flex-col items-center text-center pt-10 pb-6 px-4">
      <div className="w-14 h-14 rounded-2xl bg-[#6555B8]/10 flex items-center justify-center text-[#6555B8] mb-3 mx-auto">
        <Icon className="w-6 h-6" strokeWidth={1.75} />
      </div>
      <h2 className="font-bold text-base text-[#2D264B] text-center">{title}</h2>
      <p className="text-xs text-[#8A839E] text-center max-w-xs mt-1 mb-5 leading-relaxed">{subtitle}</p>
      {cta}
    </div>
  );
}

const TAB_ICONS: Record<string, LucideIcon> = {
  sparked: Send,
  sparked_you: Heart,
  mutual: MessageCircle,
  visited: Eye,
};

export default function SparksPage() {
  const router = useRouter();
  const initialSparks = getInitialSparksState();
  const [activeTab, setActiveTab] = useState<SparkTab>('sparked');
  const [loading, setLoading] = useState<boolean>(() => !initialSparks);
  const [userGender, setUserGender] = useState<'male' | 'female'>(() => initialSparks?.userGender || 'male');
  const [isPlus, setIsPlus] = useState<boolean>(() => Boolean(initialSparks?.isPlus));
  const [sparkedList, setSparkedList] = useState<ProfileCardData[]>(() => initialSparks?.sparked || []);
  const [sparkedYouList, setSparkedYouList] = useState<ProfileCardData[]>(() => initialSparks?.sparkedYou || []);
  const [mutualList, setMutualList] = useState<ProfileCardData[]>(() => initialSparks?.mutual || []);
  const [visitedList, setVisitedList] = useState<ProfileCardData[]>(() => initialSparks?.visited || []);
  const [recentInboundCount, setRecentInboundCount] = useState<number>(0);
  const [showLowSignal, setShowLowSignal] = useState<boolean>(false);

  useEffect(() => {
    if (!loading) {
      memorySparksCache = {
        userGender,
        isPlus,
        sparked: sparkedList,
        sparkedYou: sparkedYouList,
        mutual: mutualList,
        visited: visitedList,
      };
    }
  }, [loading, userGender, isPlus, sparkedList, sparkedYouList, mutualList, visitedList]);

  useEffect(() => {
    try {
      const raw = sessionStorage.getItem(CACHE_KEY);
      if (raw) {
        const parsed: CachedSparksState = JSON.parse(raw);
        if (parsed && Array.isArray(parsed.sparked)) {
          setUserGender(parsed.userGender || 'male');
          setIsPlus(Boolean(parsed.isPlus));
          setSparkedList(parsed.sparked || []);
          setSparkedYouList(parsed.sparkedYou || []);
          setMutualList(parsed.mutual || []);
          setVisitedList(parsed.visited || []);
          setLoading(false);
        }
      }
    } catch {}

    let isMounted = true;
    async function loadAllSparks() {
      try {
        
        const supabaseClient = createBrowserClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL!,
          process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
        );
        // Local session read (no network round trip); RLS and /api/sparks/gated still verify it.
        const { data: { session } } = await supabaseClient.auth.getSession();
        const user = session?.user;
        
        if (!user) {
          if (isMounted) setLoading(false);
          return;
        }

        // Outbound / inbound sparks load in parallel with the gated fetch (no waterfall).
        const sparksPromise = Promise.allSettled([
          supabaseClient.from('sparks').select('receiver_id, created_at').eq('sender_id', user.id).order('created_at', { ascending: false }),
          supabaseClient.from('sparks').select('sender_id, created_at').eq('receiver_id', user.id).order('created_at', { ascending: false })
        ]);

        // Server-side gated fetch — no client-side bypass possible
        const resp = await fetch('/api/sparks/gated');
        // Sparked You / Visited are gated (AIL+ for men, free for women). "You Sparked" and
        // "Mutual" are the member's own sparks and always load, whatever the gate says.
        let sparkedYou: ProfileCardData[] = [];
        let visitedYou: ProfileCardData[] = [];
        let hasFullAccess = false;
        let viewerGender: 'male' | 'female' = 'male';
        if (resp.ok) {
          const gated = await resp.json();
          sparkedYou = gated.sparkedYou ?? [];
          visitedYou = gated.visitedYou ?? [];
          hasFullAccess = true;
          if (gated.gender === 'female') viewerGender = 'female';
        } else if (resp.status !== 403 && resp.status !== 401) {
          console.error('Sparks gate error:', resp.status);
        }

        // Fetch your own outbound sparks and mutuals (these are safe to read directly)
        const [outSparksRes, inSparksRes] = await sparksPromise;

        const unwrap = <T,>(r: PromiseSettledResult<T>): T | null =>
          r.status === 'fulfilled' ? r.value : null;

        const outSparkRows: any[] = (unwrap(outSparksRes)?.data as any[]) ?? [];
        const inSparkRows: any[] = (unwrap(inSparksRes)?.data as any[]) ?? [];

        const outIds: string[] = Array.from(new Set<string>(
          outSparkRows.map((r) => r.receiver_id).filter((x): x is string => typeof x === 'string')
        ));
        const inIds: string[] = Array.from(new Set<string>(
          inSparkRows.map((r) => r.sender_id).filter((x): x is string => typeof x === 'string')
        ));

        const mergedOutIds: string[] = Array.from(new Set<string>([...outIds]));
        const outSet = new Set<string>(mergedOutIds);
        const mutualIds: string[] = inIds.filter((id) => outSet.has(id));

        const allIds = Array.from(new Set<string>([...mergedOutIds, ...inIds]));
        const profileMap = new Map<string, ProfileCardData>();
        if (allIds.length > 0) {
          const { data: profilesData } = await supabaseClient.from('profiles').select('*').in('id', allIds);
          for (const pr of ((profilesData || []) as ProfileCardData[])) {
            profileMap.set(pr.id, pr);
          }
        }

        const sparkedProfiles = mergedOutIds.map((id) => profileMap.get(id)).filter((x): x is ProfileCardData => Boolean(x));
        const sparkedYouProfiles = (sparkedYou ?? []) as ProfileCardData[];
        const mutualProfiles = mutualIds.map((id) => profileMap.get(id)).filter((x): x is ProfileCardData => Boolean(x));
        const visitedProfiles = (visitedYou ?? []) as ProfileCardData[];

        const cutoff48h = new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString();
        const recentInbound = inSparkRows.filter((r) => r.created_at && r.created_at >= cutoff48h).length;

        if (!isMounted) return;

        setUserGender(viewerGender);
        setRecentInboundCount(recentInbound);
        setIsPlus(hasFullAccess); // server-confirmed access to the gated tabs
        setSparkedList(sparkedProfiles);
        setSparkedYouList(sparkedYouProfiles);
        setMutualList(mutualProfiles);
        setVisitedList(visitedProfiles);
        setLoading(false);

        try {
          const cachePayload: CachedSparksState = {
            userGender: viewerGender,
            isPlus: hasFullAccess,
            sparked: sparkedProfiles,
            sparkedYou: sparkedYouProfiles,
            mutual: mutualProfiles,
            visited: visitedProfiles,
            timestamp: Date.now()
          };
          sessionStorage.setItem(CACHE_KEY, JSON.stringify(cachePayload));
        } catch {}
      } catch (err) {
        console.error('Error loading Sparks:', err);
        if (isMounted) setLoading(false);
      }
    }

    loadAllSparks();
    return () => { isMounted = false; };
  }, []);

  const tabs: { id: SparkTab; label: string; count: number }[] = useMemo(() => [
    { id: 'sparked', label: 'Sent', count: sparkedList.length },
    { id: 'sparked_you', label: 'Received', count: sparkedYouList.length },
    { id: 'mutual', label: 'Mutual', count: mutualList.length },
    { id: 'visited', label: 'Views', count: visitedList.length }
  ], [sparkedList.length, sparkedYouList.length, mutualList.length, visitedList.length]);

  const currentList = useMemo(() => {
    if (activeTab === 'sparked') return sparkedList;
    if (activeTab === 'sparked_you') return sparkedYouList;
    if (activeTab === 'mutual') return mutualList;
    return visitedList;
  }, [activeTab, sparkedList, sparkedYouList, mutualList, visitedList]);

  const emptyCopy = useMemo(() => {
    if (activeTab === 'sparked') {
      return { title: 'No Sparks Yet', subtitle: 'Tap the Spark icon on anyone who stands out in Discover to connect.' };
    }
    if (activeTab === 'sparked_you') {
      return { title: 'No Incoming Sparks Yet', subtitle: 'Keep your profile photo fresh—when someone sparks you, they will appear right here!' };
    }
    if (activeTab === 'mutual') {
      return { title: 'No Mutual Sparks Yet', subtitle: 'When you and another member both Spark each other, your match unlocks here.' };
    }
    return { title: 'No Visitors Yet', subtitle: 'Members who view your profile will be listed here with AIL+.' };
  }, [activeTab]);

  // Popularity triage: credible senders first, no-photo senders collapsed
  const [priorityList, lowSignalList] = useMemo(() => {
    if (activeTab !== 'sparked_you' || !isPlus) return [currentList, [] as ProfileCardData[]];
    const priority: ProfileCardData[] = [];
    const lowSignal: ProfileCardData[] = [];
    for (const p of currentList) {
      const photo = getPhoto(p);
      const hasRealPhoto = photo !== '' && photo !== '/placeholder-avatar.svg';
      if (p.is_verified || hasRealPhoto) priority.push(p);
      else lowSignal.push(p);
    }
    return [priority, lowSignal];
  }, [activeTab, currentList, isPlus]);

  return (
    <main className="min-h-[100dvh] bg-white pb-[calc(6rem+env(safe-area-inset-bottom,16px))] overscroll-y-contain">
      <div className="max-w-md mx-auto px-3.5 pt-2">
        {/* Horizontal Sub-Tab Navigation */}
        {/* Discover-style text tabs: no pill backgrounds, no underline, no divider. Sticky at top-0 of the app's
            scroll area (the Navbar sits outside it), so cards never show through above the bar. */}
        <div className="sticky top-0 z-30 bg-white -mx-3.5 mb-2">
          <div className="flex items-center gap-5 overflow-x-auto no-scrollbar [scrollbar-width:none] [&::-webkit-scrollbar]:hidden py-2 px-4" role="tablist">
            {tabs.map((t) => {
              const active = activeTab === t.id;
              return (
                <button
                  key={t.id}
                  type="button"
                  role="tab"
                  aria-selected={active}
                  onClick={() => setActiveTab(t.id)}
                  className={`inline-flex items-center gap-1.5 py-1.5 whitespace-nowrap shrink-0 transition-colors cursor-pointer ${
                    active ? 'text-[#2D264B] font-bold text-sm' : 'text-[#8A839E] hover:text-[#2D264B] font-medium text-sm'
                  }`}
                >
                  <span>{t.label}</span>
                  {formatBadgeCount(t.count) && (
                    <span
                      className={`inline-flex items-center justify-center min-w-[18px] h-4 px-1 rounded-full text-[10px] font-bold leading-none tabular-nums ${
                        active ? 'bg-[#6555B8] text-white' : 'bg-slate-100 text-[#8A839E]'
                      }`}
                    >
                      {formatBadgeCount(t.count)}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Visited Tab Paywall for Free Users */}
        {activeTab === 'visited' && !isPlus ? (
          <TabState
            icon={Eye}
            title="See Who Visited Your Profile"
            subtitle="Unlock your real-time visitor history, unblur incoming Sparks, and travel across Southeast Asia with AIL+."
            cta={
              <Link href="/settings?upgrade=plus" className={STATE_CTA_CLASS}>
                <Crown className="w-4 h-4 text-amber-300" />
                <span>Upgrade to AIL+ · $14.99/mo</span>
              </Link>
            }
          />
        ) : loading ? (
          <div className="grid grid-cols-2 gap-3.5">
            {[0, 1, 2, 3].map((i) => (
              <div key={i} className="aspect-[3/4] rounded-2xl ail-shimmer" />
            ))}
          </div>
        ) : currentList.length === 0 ? (
          <TabState
            icon={TAB_ICONS[activeTab] ?? Heart}
            title={emptyCopy.title}
            subtitle={emptyCopy.subtitle}
            cta={
              <Link href="/discover" className={STATE_CTA_CLASS}>
                Explore Discover Feed
              </Link>
            }
          />
        ) : (
          <>
          <div className="grid grid-cols-2 gap-3.5 animate-fade-in-up">
            {priorityList.map((person) => {
              const shouldBlur = (activeTab === 'sparked_you' || activeTab === 'visited') && !isPlus;
              const publicName = getPublicName(person);
              const age = getAge(person);
              const photo = shouldBlur ? '/placeholder-avatar.svg' : getPhoto(person);
              const location = getLocationLabel(person);
              const rep = person.reputation_score ?? 100;
              return (
                <div
                  key={person.id}
                  onClick={() => { if (shouldBlur) { router.push('/settings?upgrade=plus'); } else { router.push(`/profile/${person.id}`); } }}
                  className="group relative isolate aspect-[3/4] rounded-2xl overflow-hidden bg-slate-100 shadow-xs border border-[#ECE8F4] cursor-pointer active:scale-[0.98] transition-all duration-200"
                >
                  <SparkCardPhoto src={photo} name={publicName} className={`object-cover transition-transform duration-300 group-hover:scale-105 ${shouldBlur ? 'blur-md scale-110' : ''}`} />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/15 to-transparent" />
                  <div className="absolute top-3 left-3 z-10 px-2.5 py-1 rounded-full bg-black/55 backdrop-blur-md text-white text-[11px] font-semibold">{rep}% Rep</div>
                  <div className="absolute top-3 right-3 z-10 w-8 h-8 rounded-full bg-[#6555B8]/90 backdrop-blur-md text-white flex items-center justify-center shadow-xs"><Heart strokeWidth={2} className="w-3.5 h-3.5 fill-white" /></div>
                  {shouldBlur && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/30 p-3 text-center">
                      <div className="w-9 h-9 rounded-full bg-[#6555B8] text-white flex items-center justify-center mb-1.5 shadow-md"><Lock className="w-4 h-4" /></div>
                      <span className="text-[11px] font-bold text-white drop-shadow">Tap to Unblur with AIL+</span>
                    </div>
                  )}
                  <div className="absolute bottom-2.5 left-3 right-3 text-white">
                    <div className="font-bold text-[15px] leading-tight truncate">{shouldBlur ? (activeTab === 'visited' ? 'Someone Visited You' : 'Someone Sparked You') : `${publicName}${age ? `, ${age}` : ''}`}</div>
                    <div className="text-[11px] text-white/85 truncate mt-0.5">{location}</div>
                  </div>
                </div>
              );
            })}
          </div>
          {activeTab === 'sparked_you' && recentInboundCount >= 15 && (
            <div className="mt-3.5 mb-1 mx-auto max-w-md px-3.5 py-2.5 rounded-xl bg-[#F3EFFC] border border-[#6555B8]/20 text-center">
              <p className="text-[12px] font-semibold text-[#6555B8]">You're getting a lot of attention - {recentInboundCount} sparks in the last 48 hours</p>
              <p className="text-[11px] text-[#6C637B] mt-0.5">Best matches first - profiles with photos and verification rise to the top</p>
            </div>
          )}
          {activeTab === 'sparked_you' && isPlus && lowSignalList.length > 0 && (
            <div className="mt-3.5">
              <button
                type="button"
                onClick={() => setShowLowSignal(!showLowSignal)}
                className="w-full py-2.5 rounded-xl border border-[#E2DCEB] bg-white text-[12px] font-semibold text-[#8C849B] hover:bg-[#F8F7FA] transition-colors cursor-pointer"
              >
                {showLowSignal ? 'Hide' : 'Show'} {lowSignalList.length} more {lowSignalList.length === 1 ? 'request' : 'requests'}
              </button>
              {showLowSignal && (
                <div className="grid grid-cols-2 gap-3.5 mt-2.5 animate-fade-in-up">
                  {lowSignalList.map((person) => (
                    <div
                      key={person.id}
                      onClick={() => router.push('/profile/' + person.id)}
                      className="group relative aspect-[3/4] rounded-2xl overflow-hidden bg-gradient-to-br from-[#ECE7F6] to-[#DDD5EE] border border-[#ECE8F4] shadow-xs cursor-pointer active:scale-[0.98] transition-all duration-200 flex flex-col items-center justify-center p-3"
                    >
                      <div className="w-12 h-12 rounded-full bg-[#6555B8]/15 flex items-center justify-center text-xl font-bold text-[#6555B8]/60">{getPublicName(person)[0]}</div>
                      <div className="text-[13px] font-bold text-[#1C1924] mt-2.5 truncate max-w-full">{getPublicName(person)}</div>
                      <div className="text-[11px] text-[#6C637B] mt-0.5 truncate max-w-full">{getLocationLabel(person)}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
          </>
        )}
      </div>
    </main>
  );
}
