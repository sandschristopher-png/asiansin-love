'use client';

import React, { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Zap, Lock, Crown, CheckCircle2 } from 'lucide-react';
import UpgradeModal from '@/components/UpgradeModal';
import { createBrowserClient } from '@supabase/ssr';

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
  const ext = 'png';
  return '/nomatch-f.' + ext;
}

function getLocationLabel(p: ProfileCardData): string {
  const parts = [p.city, p.country].filter((x) => x && String(x).trim());
  return parts.length > 0 ? parts.join(', ') : 'Southeast Asia';
}

export default function SparksPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<SparkTab>('sparked');
  const [loading, setLoading] = useState<boolean>(true);
  const [userGender, setUserGender] = useState<'male' | 'female'>('male');
  const [isPlus, setIsPlus] = useState<boolean>(false);

  const [sparkedList, setSparkedList] = useState<ProfileCardData[]>([]);
  const [sparkedYouList, setSparkedYouList] = useState<ProfileCardData[]>([]);
  const [mutualList, setMutualList] = useState<ProfileCardData[]>([]);
  const [visitedList, setVisitedList] = useState<ProfileCardData[]>([]);
  const [recentInboundCount, setRecentInboundCount] = useState<number>(0);
  const [showLowSignal, setShowLowSignal] = useState<boolean>(false);

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
        const { data: { user } } = await supabaseClient.auth.getUser();
        
        if (!user) {
          if (isMounted) setLoading(false);
          return;
        }

        const [meRes, outSparksRes, inSparksRes, favRes, viewsRes] = await Promise.allSettled([
          supabaseClient.from('profiles').select('gender, looking_for, seeking, is_plus').eq('id', user.id).maybeSingle(),
          supabaseClient.from('sparks').select('receiver_id, created_at').eq('sender_id', user.id).order('created_at', { ascending: false }),
          supabaseClient.from('sparks').select('sender_id, created_at').eq('receiver_id', user.id).order('created_at', { ascending: false }),
          supabaseClient.from('favorites').select('favorite_id, created_at').eq('user_id', user.id).order('created_at', { ascending: false }),
          supabaseClient.from('profile_views').select('viewer_id, created_at').eq('viewed_id', user.id).order('created_at', { ascending: false })
        ]);

                const unwrap = <T,>(r: PromiseSettledResult<T>): T | null =>
          r.status === 'fulfilled' ? r.value : null;

        const meRow: any = unwrap(meRes)?.data ?? null;
        const g = String(meRow?.gender || user.user_metadata?.gender || '').toLowerCase();
        const look = String(meRow?.looking_for || meRow?.seeking || '').toLowerCase();
        const resolvedGender: 'male' | 'female' =
          g === 'female' || g === 'f' || g === 'female' || look === 'male' || look === 'm' || look === 'male'
            ? 'female'
            : 'male';
        const resolvedPlus = Boolean(meRow?.is_plus);

        const outSparkRows: any[] = (unwrap(outSparksRes)?.data as any[]) ?? [];
        const inSparkRows: any[] = (unwrap(inSparksRes)?.data as any[]) ?? [];
        const favRows: any[] = (unwrap(favRes)?.data as any[]) ?? [];
        const viewRows: any[] = (unwrap(viewsRes)?.data as any[]) ?? [];

        const outIds: string[] = Array.from(new Set<string>(
          outSparkRows.map((r) => r.receiver_id).filter((x): x is string => typeof x === 'string')
        ));
        const favIds: string[] = Array.from(new Set<string>(
          favRows.map((r) => r.favorite_id).filter((x): x is string => typeof x === 'string')
        ));
        const inIds: string[] = Array.from(new Set<string>(
          inSparkRows.map((r) => r.sender_id).filter((x): x is string => typeof x === 'string')
        ));
        const viewerIds: string[] = Array.from(new Set<string>(
          viewRows.map((r) => r.viewer_id).filter((x): x is string => typeof x === 'string' && x !== user.id)
        ));

        const mergedOutIds: string[] = Array.from(new Set<string>([...outIds, ...favIds]));
        const outSet = new Set<string>(mergedOutIds);
        const mutualIds: string[] = inIds.filter((id) => outSet.has(id));

        const fetchVisitorIds: string[] = resolvedPlus ? viewerIds : [];
        const allUniqueIds: string[] = Array.from(new Set<string>([...mergedOutIds, ...inIds, ...fetchVisitorIds]));

        const profileMap = new Map<string, ProfileCardData>();
        if (allUniqueIds.length > 0) {
          const { data: profilesData } = await supabaseClient
            .from('profiles')
            .select('*')
            .in('id', allUniqueIds);
          for (const pr of ((profilesData || []) as ProfileCardData[])) {
            profileMap.set(pr.id, pr);
          }
        }

        const sparkedProfiles = mergedOutIds.map((id) => profileMap.get(id)).filter((x): x is ProfileCardData => Boolean(x));
        const sparkedYouProfiles = inIds.map((id) => profileMap.get(id)).filter((x): x is ProfileCardData => Boolean(x));
        const mutualProfiles = mutualIds.map((id) => profileMap.get(id)).filter((x): x is ProfileCardData => Boolean(x));
        const visitedProfiles = fetchVisitorIds.map((id) => profileMap.get(id)).filter((x): x is ProfileCardData => Boolean(x));
        // --- Free-tier masking: strip PII from sparkedYou/visited before state/cache ---
        const maskProfile = (pr: ProfileCardData): ProfileCardData => ({
          ...pr,
          full_name: null,
          username: null,
          avatar_url: null,
          gallery: [],
        });
        const finalSparkedYouProfiles = resolvedPlus
          ? sparkedYouProfiles
          : sparkedYouProfiles.map(maskProfile);
        const finalVisitedProfiles = resolvedPlus
          ? visitedProfiles
          : visitedProfiles.map(maskProfile);

        const cutoff48h = new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString();
        const recentInbound = inSparkRows.filter((r) => r.created_at && r.created_at >= cutoff48h).length;

        if (!isMounted) return;

        setUserGender(resolvedGender);
        setRecentInboundCount(recentInbound);
        setIsPlus(resolvedPlus);
        setSparkedList(sparkedProfiles);
        setSparkedYouList(finalSparkedYouProfiles);
        setMutualList(mutualProfiles);
        setVisitedList(finalVisitedProfiles);
        setLoading(false);

        try {
          const cachePayload: CachedSparksState = {
            userGender: resolvedGender,
            isPlus: resolvedPlus,
            sparked: sparkedProfiles,
            sparkedYou: finalSparkedYouProfiles,
            mutual: mutualProfiles,
            visited: finalVisitedProfiles,
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
    { id: 'sparked', label: 'You Sparked', count: sparkedList.length },
    { id: 'sparked_you', label: 'Sparked You', count: sparkedYouList.length },
    { id: 'mutual', label: 'Mutual', count: mutualList.length },
    { id: 'visited', label: 'Visited', count: visitedList.length }
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
    return { title: 'No Mutual Sparks Yet', subtitle: 'When you and another member both Spark each other, your match unlocks here.' };
  }, [activeTab]);

  // Popularity triage: credible senders first, no-photo senders collapsed
  const [priorityList, lowSignalList] = useMemo(() => {
    if (activeTab !== 'sparked_you' || !isPlus) return [currentList, [] as ProfileCardData[]];
    const priority: ProfileCardData[] = [];
    const lowSignal: ProfileCardData[] = [];
    for (const p of currentList) {
      const photo = getPhoto(p);
      const hasRealPhoto = photo !== '/nomatch-f.png' && photo !== '/placeholder-avatar.svg';
      if (p.is_verified || hasRealPhoto) priority.push(p);
      else lowSignal.push(p);
    }
    return [priority, lowSignal];
  }, [activeTab, currentList, isPlus]);

  return (
    <main className="min-h-[calc(100dvh-3rem)] bg-white pb-28">
      <div className="max-w-md mx-auto px-3.5 pt-2">
        {/* Horizontal Sub-Tab Navigation */}
        <div className="sticky top-12 z-30 bg-white/95 backdrop-blur-md border-b border-[#ECE8F4] -mx-3.5 px-3.5 mb-3.5">
          <div className="flex items-center gap-5 overflow-x-auto no-scrollbar">
            {tabs.map((t) => {
              const active = activeTab === t.id;
              return (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setActiveTab(t.id)}
                  className={`relative py-2.5 text-[13px] font-semibold whitespace-nowrap transition-all duration-150 active:scale-95 cursor-pointer flex items-center gap-1.5 ${
                    active ? 'text-[#6555B8]' : 'text-[#8C849B] hover:text-[#1C1924]'
                  }`}
                >
                  <span>{t.label}</span>
                  {t.count > 0 && (
                    <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                      active ? 'bg-[#6555B8]/12 text-[#6555B8]' : 'bg-slate-100 text-[#8C849B]'
                    }`}>
                      {t.count}
                    </span>
                  )}
                  {active && (
                    <span className="absolute bottom-0 left-0 right-0 h-[2.5px] rounded-full bg-[#6555B8] transition-all duration-200" />
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Visited Tab Paywall for Free Users */}
        {activeTab === 'visited' && !isPlus ? (
          <div className="animate-fade-in-up flex flex-col items-center justify-center text-center py-10 px-4">
            <div className="w-16 h-16 rounded-full bg-[#F3F0FA] border border-[#E2DCF3] flex items-center justify-center mb-4 shadow-2xs">
              <img src="/ail-plus.png" alt="AIL+" className="w-10 h-10 rounded-xl" />
            </div>
            <h2 className="text-lg font-bold text-[#1C1924] mb-1.5">See Who Visited Your Profile</h2>
            <p className="text-xs text-[#6C637B] max-w-[270px] leading-relaxed mb-5">Unlock your real-time visitor history, unblur incoming Sparks, and travel across Southeast Asia with AIL+.</p>
            <Link href="/settings?upgrade=plus" className="inline-flex items-center gap-2 h-11 px-6 rounded-full bg-[#6555B8] hover:bg-[#5646A6] text-white text-xs font-semibold shadow-sm active:scale-95 transition-all">
              <Crown className="w-4 h-4 text-amber-300" />
              <span>Upgrade to AIL+ · $14.99/mo</span>
            </Link>
          </div>
        ) : loading ? (
          <div className="grid grid-cols-2 gap-3.5">
            {[0, 1, 2, 3].map((i) => (
              <div key={i} className="aspect-[3/4] rounded-2xl bg-[#F4F2F8] animate-pulse" />
            ))}
          </div>
        ) : currentList.length === 0 ? (
          <div className="animate-fade-in-up flex flex-col items-center justify-center text-center pt-4 pb-6 px-4">
            <div className="relative w-56 h-44 mx-auto mb-2 flex items-center justify-center">
              <img src={userGender === 'female' ? '/nomatch-f.png' : '/nomatch-m.png'} alt="No Sparks Yet" className="w-full h-full object-contain select-none pointer-events-none" />
            </div>
            <h2 className="text-base font-bold text-[#1C1924] mb-1">{emptyCopy.title}</h2>
            <p className="text-xs text-[#6C637B] max-w-[260px] leading-relaxed mb-5">{emptyCopy.subtitle}</p>
            <Link href="/discover" className="inline-flex items-center justify-center h-10 px-6 rounded-full bg-[#6555B8] hover:bg-[#5646A6] text-white text-xs font-semibold shadow-xs active:scale-95 transition-all">Explore Discover Feed</Link>
          </div>
        ) : (
          <>
          <div className="grid grid-cols-2 gap-3.5 animate-fade-in-up">
            {priorityList.map((person) => {
              const shouldBlur = (activeTab === 'sparked_you' || activeTab === 'visited') && !isPlus;
              const publicName = getPublicName(person);
              const age = getAge(person);
              const photo = shouldBlur ? '/placeholder-avatar.svg' : getPhoto(person);
              const location = getLocationLabel(person);
              const rep = person.reputation_score ?? 100;              return (
                <div
                  key={person.id}
                  onClick={() => { if (shouldBlur) { router.push('/settings?upgrade=plus'); } else { router.push(`/profile/${person.id}`); } }}
                  className="group relative aspect-[3/4] rounded-2xl overflow-hidden bg-[#1C1924] shadow-xs border border-[#ECE8F4] cursor-pointer active:scale-[0.98] transition-all duration-200"
                >
                  <img src={photo} alt={publicName} loading="lazy" className={`w-full h-full object-cover transition-transform duration-300 group-hover:scale-105 ${shouldBlur ? 'blur-md scale-110' : ''}`} />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/15 to-transparent" />
                  <div className="absolute top-2.5 left-2.5 px-2.5 py-1 rounded-full bg-black/55 backdrop-blur-md text-white text-[11px] font-semibold">{rep}% Rep</div>
                  <div className="absolute top-2.5 right-2.5 w-8 h-8 rounded-full bg-[#6555B8]/90 backdrop-blur-md text-white flex items-center justify-center shadow-xs"><Zap className="w-3.5 h-3.5 fill-white" /></div>
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
