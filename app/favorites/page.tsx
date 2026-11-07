'use client';

import React, { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Lock, Heart, User, Send, MessageCircle, Eye, type LucideIcon } from 'lucide-react';
import { createBrowserClient } from '@supabase/ssr';
import { CardPhoto } from '@/components/CardPhoto';
import { ReputationBadge } from '@/components/ReputationBadge';
import { PlusBadge } from '@/components/ui/PlusBadge';
import { PhotoCarousel } from '@/components/cards/PhotoCarousel';
import { supabaseImage } from '@/lib/images/supabaseImage';

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
  /** Visitors tab: newest visit by this member. */
  visited_at?: string | null;
  /** Free preview: a visitor whose details unlock with Plus. */
  locked?: boolean;
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

/** Gallery for the card carousel: the photos array (avatar first if it is not in it), de-duplicated. */
function getPhotos(p: ProfileCardData): string[] {
  const isReal = (u: unknown): u is string => typeof u === 'string' && u.trim() !== '' && !u.endsWith('.svg');
  const list = [...(Array.isArray(p.photos) ? p.photos : [])].filter(isReal);
  if (isReal(p.avatar_url) && !list.includes(p.avatar_url)) list.unshift(p.avatar_url);
  return Array.from(new Set(list));
}

/** Card photo with a branded fallback (no photo, or the URL fails to load): never a black box. */
function SparkCardPhoto({ src, name, className }: { src: string; name: string; className: string }) {
  const [failedSrc, setFailedSrc] = useState<string | null>(null);
  if (!src || failedSrc === src) {
    return (
      <div className="absolute inset-0 w-full h-full bg-[#E8E6F1]/50 flex flex-col items-center justify-center text-[#8574B7]">
        <User className="w-12 h-12 stroke-1 text-[#8574B7]/40" />
        <span className="mt-1 text-lg font-bold text-[#8574B7]/70">{(name || '?').trim().charAt(0).toUpperCase()}</span>
      </div>
    );
  }
  return <CardPhoto src={src} alt={name} className={className} onError={() => setFailedSrc(src)} />;
}

/** "Visited 2h ago" from a visit timestamp. */
function visitedLabel(iso?: string | null): string {
  const t = iso ? Date.parse(iso) : NaN;
  if (!Number.isFinite(t)) return 'Visited recently';
  const mins = Math.max(0, Math.floor((Date.now() - t) / 60000));
  if (mins < 1) return 'Visited just now';
  if (mins < 60) return `Visited ${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `Visited ${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days === 1) return 'Visited yesterday';
  if (days < 30) return `Visited ${days}d ago`;
  return `Visited ${new Date(t).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}`;
}

/**
 * Visitors (footprints): avatar, handle, city and visit time. Locked rows (free members, past
 * the newest 3) are frosted placeholders with the PLUS badge; tapping one opens Plus.
 */
function VisitorsList({ visitors, onOpen }: { visitors: ProfileCardData[]; onOpen: (p: ProfileCardData) => void }) {
  return (
    <ul className="rounded-2xl border border-[#D0CDE1] bg-white divide-y divide-[#D0CDE1] overflow-hidden animate-fade-in-up">
      {visitors.map((v) => {
        const name = getPublicName(v);
        const photo = getPhoto(v);
        return (
          <li key={v.id}>
            <button
              type="button"
              onClick={() => onOpen(v)}
              className="w-full flex items-center gap-3 px-3.5 py-3 text-left cursor-pointer hover:bg-[#E8E6F1]/40 transition-colors"
            >
              <span className="relative w-11 h-11 shrink-0 rounded-full overflow-hidden bg-white border border-[#D0CDE1]">
                {v.locked ? (
                  <span aria-hidden className="absolute inset-0 bg-[#8574B7]/15 blur-[6px] scale-110" />
                ) : (
                  <SparkCardPhoto src={photo ? supabaseImage(photo, { width: 96, height: 96, quality: 75, resize: 'cover' }) : ''} name={name} className="object-cover" />
                )}
              </span>
              <span className="min-w-0 flex-1">
                {v.locked ? (
                  <>
                    <span aria-hidden className="block h-3 w-24 rounded-full bg-[#413B5E]/10 blur-[3px]" />
                    <span aria-hidden className="mt-1.5 block h-2.5 w-16 rounded-full bg-[#413B5E]/[0.07] blur-[3px]" />
                  </>
                ) : (
                  <>
                    <span className="block text-[13px] font-bold text-[#413B5E] truncate">@{name}</span>
                    <span className="block text-[11px] text-[#413B5E]/55 truncate">{getLocationLabel(v)}</span>
                  </>
                )}
              </span>
              <span className="shrink-0 flex flex-col items-end gap-1">
                <span className="text-[10.5px] font-medium text-[#413B5E]/50 whitespace-nowrap">{visitedLabel(v.visited_at)}</span>
                {v.locked && <PlusBadge />}
              </span>
            </button>
          </li>
        );
      })}
    </ul>
  );
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
  'inline-flex items-center justify-center gap-2 rounded-full px-5 py-2 text-xs font-semibold text-white bg-[#8574B7] hover:bg-[#534377] active:scale-95 transition-all';

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
      <div className="w-14 h-14 rounded-2xl bg-[#8574B7]/10 flex items-center justify-center text-[#8574B7] mb-3 mx-auto">
        <Icon className="w-6 h-6" strokeWidth={1.75} />
      </div>
      <h2 className="font-bold text-base text-[#413B5E] text-center">{title}</h2>
      <p className="text-xs text-[#413B5E]/55 text-center max-w-xs mt-1 mb-5 leading-relaxed">{subtitle}</p>
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
  // Deep links (notice center, emails): ?tab=sent | sparks | mutual | views, or the internal tab ids.
  useEffect(() => {
    const raw = new URLSearchParams(window.location.search).get('tab') || '';
    const alias: Record<string, SparkTab> = { sent: 'sparked', sparks: 'sparked_you', matches: 'mutual', views: 'visited', visitors: 'visited' };
    const tab = alias[raw] || raw;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- one-time read of the URL on mount
    if (tab === 'sparked' || tab === 'sparked_you' || tab === 'mutual' || tab === 'visited') setActiveTab(tab);
  }, []);
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
        // Sparked You / Visited are gated (Plus for men, free for women). "You Sparked" and
        // "Mutual" are the member's own sparks and always load, whatever the gate says.
        let sparkedYou: ProfileCardData[] = [];
        let visitedYou: ProfileCardData[] = [];
        let hasFullAccess = false;
        let viewerGender: 'male' | 'female' = 'male';
        if (resp.ok) {
          const gated = await resp.json();
          sparkedYou = gated.sparkedYou ?? [];
          visitedYou = gated.visitedYou ?? [];
          hasFullAccess = gated.access !== 'preview';
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
    { id: 'visited', label: 'Visitors', count: visitedList.length }
  ], [sparkedList.length, sparkedYouList.length, mutualList.length, visitedList.length]);

  // Members the viewer has sparked: their cards show a filled heart in every tab.
  const sparkedIds = useMemo(() => new Set(sparkedList.map((p) => p.id)), [sparkedList]);

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
    return { title: 'No Visitors Yet', subtitle: 'Members who view your profile will appear here.' };
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
    <main className="min-h-[100dvh] bg-white pb-[calc(8rem+env(safe-area-inset-bottom,0px))] overscroll-y-contain">
      <div className="max-w-md mx-auto px-3.5 pt-2">
        {/* Horizontal Sub-Tab Navigation */}
        {/* Discover-style pill tabs matching the discover filter pills. Sticky at top-0 of the app's
            scroll area (the Navbar sits outside it), so cards never show through above the bar. */}
        <div className="sticky top-0 z-30 bg-white/80 backdrop-blur-md -mx-3.5 mb-2">
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar [scrollbar-width:none] [&::-webkit-scrollbar]:hidden py-2.5 px-3.5" role="tablist">
            {tabs.map((t) => {
              const active = activeTab === t.id;
              return (
                <button
                  key={t.id}
                  type="button"
                  role="tab"
                  aria-selected={active}
                  onClick={() => setActiveTab(t.id)}
                  className={`inline-flex items-center gap-1 whitespace-nowrap shrink-0 transition-all active:scale-95 cursor-pointer text-xs px-3.5 py-1.5 rounded-full ${
                    active ? 'bg-[#8574B7] text-white font-semibold border border-transparent shadow-xs' : 'border border-[#D0CDE1] bg-white text-[#413B5E] font-medium hover:border-[#8574B7]/40 hover:bg-[#8574B7]/5'
                  }`}
                >
                  <span>{t.label}</span>
                  {formatBadgeCount(t.count) && (
                    <span
                      className={`inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full text-[10px] font-bold leading-none tabular-nums ml-0.5 ${
                        active ? 'bg-white text-[#8574B7]' : 'bg-[#8574B7]/10 text-[#8574B7]'
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

        {loading ? (
          <div className="grid grid-cols-2 gap-3 sm:gap-4">
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
        ) : activeTab === 'visited' ? (
          <VisitorsList
            visitors={currentList}
            onOpen={(v) => router.push(v.locked ? '/plus' : `/profile/${v.id}`)}
          />
        ) : (
          <>
          <div className="grid grid-cols-2 gap-3 sm:gap-4 animate-fade-in-up">
            {priorityList.map((person, idx) => {
              // Free: the newest Spark is a clear preview, the rest stay blurred until Plus.
              const shouldBlur =
                !isPlus && activeTab === 'sparked_you' && idx > 0;
              const publicName = getPublicName(person);
              const age = getAge(person);
              const photo = shouldBlur ? '/placeholder-avatar.svg' : getPhoto(person);
              // Locked (blurred) cards never load the member's real photos.
              const gallery = shouldBlur ? [] : getPhotos(person);
              const location = getLocationLabel(person);
              const rep = person.reputation_score ?? 100;
              return (
                <div
                  key={person.id}
                  onClick={() => { if (shouldBlur) { router.push('/plus'); } else { router.push(`/profile/${person.id}`); } }}
                  className="group relative isolate aspect-[3/4] rounded-2xl overflow-hidden bg-white border border-[#D0CDE1]/60 shadow-xs hover:shadow-md cursor-pointer active:scale-[0.98] transition-all duration-300"
                >
                  {gallery.length > 0 ? (
                    // Scroll-snap carousel (edge-resized WebP); a touch tap falls through to the card's onClick.
                    <PhotoCarousel photos={gallery} alt={publicName} priority={idx < 2} className="absolute inset-0" />
                  ) : (
                    <SparkCardPhoto src={photo} name={publicName} className={`object-cover ${shouldBlur ? 'blur-md scale-110' : ''}`} />
                  )}
                  {/* Same overlay layout as Discover cards (top-left Reputation, top-right heart). */}
                  {!shouldBlur && <ReputationBadge score={rep} variant="frosted" size="xs" className={`absolute ${gallery.length > 1 ? 'top-5' : 'top-2.5'} left-2.5 z-20`} />}
                  {/* Same bare heart as Discover: white stroke keys it against dark hair and backgrounds.
                      Filled once the viewer has sparked this member (Sent, Mutual), outline otherwise. */}
                  <span aria-hidden className="absolute top-3 right-3 z-30 p-1.5 pointer-events-none">
                    {sparkedIds.has(person.id) ? (
                      <Heart className="w-7 h-7 fill-[#8574B7] stroke-white drop-shadow-[0_2px_5px_rgba(0,0,0,0.5)]" strokeWidth={1.5} />
                    ) : (
                      <Heart className="w-7 h-7 fill-none stroke-white drop-shadow-[0_2px_5px_rgba(0,0,0,0.7)]" strokeWidth={2.5} />
                    )}
                  </span>
                  {shouldBlur && (
                    <div className="absolute inset-0 z-[26] flex flex-col items-center justify-center bg-black/30 p-3 text-center">
                      <div className="w-9 h-9 rounded-full bg-[#8574B7] text-white flex items-center justify-center mb-1.5 shadow-md"><Lock className="w-4 h-4" /></div>
                      <span className="text-[11px] font-bold text-white drop-shadow">Tap to Unblur with Plus</span>
                    </div>
                  )}
                  <div aria-hidden className="absolute inset-x-0 bottom-0 h-28 bg-gradient-to-t from-black/70 via-black/25 to-transparent pointer-events-none rounded-b-2xl z-20" />
                  <div className="absolute bottom-0 inset-x-0 pt-10 pb-3 px-3 z-[25] pointer-events-none text-white">
                    <h3 className="font-brand text-sm font-bold leading-tight truncate">{shouldBlur ? 'Someone Sparked You' : `${publicName}${age ? `, ${age}` : ''}`}</h3>
                    <p className="text-[11px] text-white/90 font-medium mt-0.5 truncate pr-7">{location}</p>
                  </div>
                </div>
              );
            })}
          </div>
          {activeTab === 'sparked_you' && recentInboundCount >= 15 && (
            <div className="mt-3.5 mb-1 mx-auto max-w-md px-3.5 py-2.5 rounded-xl bg-[#E8E6F1]/60 border border-[#8574B7]/20 text-center">
              <p className="text-[12px] font-semibold text-[#8574B7]">You're getting a lot of attention - {recentInboundCount} sparks in the last 48 hours</p>
              <p className="text-[11px] text-[#413B5E]/75 mt-0.5">Best matches first - profiles with photos and verification rise to the top</p>
            </div>
          )}
          {activeTab === 'sparked_you' && isPlus && lowSignalList.length > 0 && (
            <div className="mt-3.5">
              <button
                type="button"
                onClick={() => setShowLowSignal(!showLowSignal)}
                className="w-full py-2.5 rounded-xl border border-[#D0CDE1] bg-white text-[12px] font-semibold text-[#413B5E]/55 hover:bg-[#E8E6F1]/40 transition-colors cursor-pointer"
              >
                {showLowSignal ? 'Hide' : 'Show'} {lowSignalList.length} more {lowSignalList.length === 1 ? 'request' : 'requests'}
              </button>
              {showLowSignal && (
                <div className="grid grid-cols-2 gap-3.5 mt-2.5 animate-fade-in-up">
                  {lowSignalList.map((person) => (
                    <div
                      key={person.id}
                      onClick={() => router.push('/profile/' + person.id)}
                      className="group relative aspect-[3/4] rounded-2xl overflow-hidden bg-[#E8E6F1] border border-[#D0CDE1] shadow-xs cursor-pointer active:scale-[0.98] transition-all duration-200 flex flex-col items-center justify-center p-3"
                    >
                      <div className="w-12 h-12 rounded-full bg-[#8574B7]/15 flex items-center justify-center text-xl font-bold text-[#8574B7]/60">{getPublicName(person)[0]}</div>
                      <div className="text-[13px] font-bold text-[#413B5E] mt-2.5 truncate max-w-full">{getPublicName(person)}</div>
                      <div className="text-[11px] text-[#413B5E]/75 mt-0.5 truncate max-w-full">{getLocationLabel(person)}</div>
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
