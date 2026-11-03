'use client';
import { useRef } from 'react';
import { playMatchChime } from '@/lib/sound';
import React, { useState, useEffect, useMemo, Suspense } from 'react';
import { createPortal } from 'react-dom';
import Link from 'next/link';
import VerifiedBadge from '@/components/VerifiedBadge';
import { useSearchParams, useRouter } from 'next/navigation';
import { Camera, ChevronDown, ChevronLeft, ChevronRight, Search, Heart, X as XIcon, SlidersHorizontal, RotateCcw } from 'lucide-react';
import { supabase } from '@/lib/supabase/client';
import { INTENT_OPTIONS, normalizeIntent } from '@/lib/intents';
import { ActionType, getLocalCardActions, persistCardAction } from '@/lib/interactions';
import { CardPhoto } from '@/components/CardPhoto';
import { AudioPill } from '@/components/AudioPill';
import { isTrustedVoiceIntroUrl } from '@/lib/audio';
import { usePresentUserIds } from '@/lib/realtimePresence';
import { sharedTraits } from '@/lib/rhythm';
import { InCommonCard, RhythmPill } from '@/components/profile/RhythmBadges';
import { SparkHeartButton } from '@/components/SparkHeartButton';
import { MutualSparkModal } from '@/components/MutualSparkModal';

const DISCOVERY_MODES = [
  { id: 'all', label: 'All' },
  { id: 'online', label: 'Online' },
  { id: 'near_me', label: 'Near Me' },
  { id: 'new', label: 'New' },
] as const;
type DiscoveryModeId = (typeof DISCOVERY_MODES)[number]['id'];

const GENDER_LABELS: Record<string, string> = {
  woman: 'Women',
  man: 'Men',
};

/** Scroll offset of the nearest scrolled ancestor (the app shell scrolls an inner div). */
function scrollTopOf(el: HTMLElement | null): number {
  for (let node = el; node; node = node.parentElement) {
    if (node.scrollTop > 0) return node.scrollTop;
  }
  return typeof window !== 'undefined' ? window.scrollY : 0;
}

export interface ProfileItem {
  id: string;
  username?: string;
  name: string;
  age: number;
  gender: 'female' | 'male' | 'male';
  location: string;
  latitude?: number | null;
  longitude?: number | null;
  country: string;
  avatarUrl: string;
  photos?: string[];
  recentlyActive?: boolean;
  repScore: number;
  verified: boolean;
  is_plus?: boolean;
  online: boolean;
  intent?: string;
  looking_for?: string;
  interests?: string[];
  created_at?: string;
  voiceIntroUrl?: string | null;
  lastActive?: string | null;
  languages?: string | string[] | null;
  replyPace?: string | null;
}

function DiscoverCardPhotoCarousel({
  profileId,
  photos,
  avatarUrl,
  name,
  repScore,
  online,
  recentlyActive,
  priority = false,
}: {
  profileId: string;
  photos?: string[];
  avatarUrl: string;
  name: string;
  repScore: number;
  online: boolean;
  recentlyActive?: boolean;
  priority?: boolean;
}) {
  const [currentIdx, setCurrentIdx] = useState(0);
  const rawList = (photos && photos.length > 0 ? photos : [avatarUrl]).filter(
    (p): p is string => typeof p === 'string' && p.trim().length > 0 && p !== '/placeholder-avatar.svg'
  );
  const uniqueList = Array.from(new Set(rawList));
  const displayPhotos = uniqueList.length > 0 ? uniqueList : [avatarUrl || '/placeholder-avatar.svg'];
  const hasMultiple = displayPhotos.length > 1;

  const handlePrev = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setCurrentIdx((prev) => (prev === 0 ? displayPhotos.length - 1 : prev - 1));
  };
  const handleNext = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setCurrentIdx((prev) => (prev === displayPhotos.length - 1 ? 0 : prev + 1));
  };

  return (
    <div className="relative block h-full w-full overflow-hidden bg-[#F2EEF7] select-none">
      <Link href={'/profile/' + profileId} className="absolute inset-0 z-0">
        <CardPhoto
          src={displayPhotos[currentIdx]}
          alt={name}
          priority={priority && currentIdx === 0}
          className="object-cover group-hover:scale-[1.03] transition-transform duration-500 ease-out"
        />
      </Link>
      {displayPhotos.length > 1 && (
        <span className="absolute bottom-2.5 right-2.5 z-20 inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-black/55 backdrop-blur-2xs text-white text-[10px] font-semibold pointer-events-none">
          <Camera className="w-3 h-3" />
          {displayPhotos.length}
        </span>
      )}
      <div className="absolute top-2.5 left-2.5 flex items-center gap-1.5 z-20 pointer-events-none">
        {online ? (
          <span className="h-2 w-2 rounded-full bg-emerald-500 ring-2 ring-white/90 shadow-xs shrink-0 animate-[pulse_3s_ease-in-out_infinite]" />
        ) : recentlyActive ? (
          <span className="h-2 w-2 rounded-full bg-amber-400 ring-1.5 ring-white/80 shadow-xs shrink-0 animate-[pulse_3s_ease-in-out_infinite]" />
        ) : null}
      </div>
      {hasMultiple && (
        <div className="flex items-center justify-between absolute inset-x-1.5 top-1/2 -translate-y-1/2 z-20 pointer-events-none opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
          <button
            type="button"
            onClick={handlePrev}
            className="pointer-events-auto p-1.5 rounded-full bg-black/40 hover:bg-black/70 text-white backdrop-blur-xs transition active:scale-90 cursor-pointer"
            aria-label="Previous photo"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={handleNext}
            className="pointer-events-auto p-1.5 rounded-full bg-black/40 hover:bg-black/70 text-white backdrop-blur-xs transition active:scale-90 cursor-pointer"
            aria-label="Next photo"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
}

function normalizeGenderValue(raw?: string | null): 'female' | 'male' | 'male' {
  const val = String(raw || '').toLowerCase().trim().replace(/[\s-]+/g, '_');
  if (['male', 'male', 'male', 'm', 'guy', 'guys'].includes(val)) return 'male';
  if (['female', 'female', 'female', 'f', 'lady', 'ladies', 'girl', 'girls'].includes(val)) return 'female';
  if (['female', 'female', 'transgender_woman', 'transgender_women', 'male', 'mtf', 'transfemale'].includes(val))
    return 'male';
  if (['male', 'male', 'transgender_man', 'transgender_men', 'ftm', 'transmale'].includes(val)) return 'male';
  if (['male', 'nonbinary', 'nb', 'enby'].includes(val)) return 'male';
  return 'female';
}


// Universal SWR Module Cache for Discover Feed
let memoryDiscoverCache: { profiles: ProfileItem[] } | null = null;
function getInitialDiscoverFeed(): ProfileItem[] {
  if (memoryDiscoverCache?.profiles?.length) return memoryDiscoverCache.profiles.slice();
  if (typeof window !== 'undefined') {
    try {
      const cachedRaw = localStorage.getItem('ail_discover_cache');
      if (cachedRaw) {
        const cached = JSON.parse(cachedRaw);
        if (Array.isArray(cached?.profiles) && cached.profiles.length > 0) {
          memoryDiscoverCache = { profiles: cached.profiles };
          return cached.profiles.slice();
        }
      }
    } catch {}
  }
  return [];
}

function DiscoverContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [discoveryMode, setDiscoveryMode] = useState<DiscoveryModeId>('all');
  const [currentUserCoords, setCurrentUserCoords] = useState<{ lat: number; lon: number } | null>(null);
  const [viewerSavedGenders, setViewerSavedGenders] = useState<string[]>([]);
  const [viewerAvatar, setViewerAvatar] = useState<string | null>(null);
  const [viewerTraits, setViewerTraits] = useState<{ interests: unknown; languages: unknown }>({
    interests: [],
    languages: null,
  });
  const initialFeed = getInitialDiscoverFeed();
  const [profiles, setProfiles] = useState<ProfileItem[]>(() => initialFeed);
  const presentIds = usePresentUserIds();
  const [isLoading, setIsLoading] = useState(() => initialFeed.length === 0);
  const [pullDistance, setPullDistance] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const pullStartY = useRef<number | null>(null);
  const [searchQuery, setSearchQuery] = useState(() => searchParams.get('q') || '');
  const [selectedCountry, setSelectedCountry] = useState('All');
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchAnimating, setSearchAnimating] = useState(false);
  const [searchClosing, setSearchClosing] = useState(false);

  useEffect(() => {
    if (profiles.length > 0) {
      memoryDiscoverCache = { profiles };
      try {
        localStorage.setItem('ail_discover_cache', JSON.stringify({ profiles }));
      } catch {}
    }
  }, [profiles]);

  const [selectedGenders, setSelectedGenders] = useState<string[]>(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('discover_gender_pref');
      if (stored !== null) {
        try {
          const parsed = JSON.parse(stored);
          if (Array.isArray(parsed)) return parsed;
        } catch {}
      }
    }
    return [];
  });

  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('discover_gender_pref', JSON.stringify(selectedGenders));
      } catch {}
    }
  }, [selectedGenders]);

  const toggleGender = (gender: string) => {
    setSelectedGenders((prev) =>
      prev.includes(gender) ? prev.filter((g) => g !== gender) : [...prev, gender]
    );
  };

  const [filtersOpen, setFiltersOpen] = useState(false);
  const [minAge, setMinAge] = useState<number>(18);
  const [maxAge, setMaxAge] = useState<number>(65);
  const [draftMinAge, setDraftMinAge] = useState<number>(18);
  const [draftMaxAge, setDraftMaxAge] = useState<number>(65);
  const [draftGenders, setDraftGenders] = useState<string[]>([]);
  const [draftCountry, setDraftCountry] = useState<string>('All');
  const [draftIntent, setDraftIntent] = useState<string>('all');
  const [draftVerifiedOnly, setDraftVerifiedOnly] = useState<boolean>(false);
  const [draftActiveNowOnly, setDraftActiveNowOnly] = useState<boolean>(false);
  const [draftMode, setDraftMode] = useState<DiscoveryModeId>('all');
  const [selectedIntent, setSelectedIntent] = useState<string>('all');
  const [verifiedOnly, setVerifiedOnly] = useState<boolean>(false);
  const [activeNowOnly, setActiveNowOnly] = useState<boolean>(false);

  const [matchedModalProfile, setMatchedModalProfile] = useState<{ id: string; name: string; avatarUrl?: string } | null>(null);
  const [isModalClosing, setIsModalClosing] = useState(false);
  const [filtersClosing, setFiltersClosing] = useState(false);
  // Drag-down-to-dismiss for the filter sheet (grab handle + header row).
  const SHEET_DISMISS_PX = 90;
  const [sheetDragY, setSheetDragY] = useState(0);
  const [isSheetDragging, setIsSheetDragging] = useState(false);
  // Once dragged, the sheet is positioned by transform (with a snap-back transition) instead of
  // the open animation, so releasing below the threshold doesn't replay the slide-up.
  const [sheetWasDragged, setSheetWasDragged] = useState(false);
  const sheetStartYRef = useRef(0);
  const sheetCurrentYRef = useRef(0);

  const handleSheetTouchStart = (e: React.TouchEvent) => {
    e.stopPropagation();
    sheetStartYRef.current = e.touches[0].clientY;
    sheetCurrentYRef.current = e.touches[0].clientY;
    setIsSheetDragging(true);
    setSheetWasDragged(true);
  };

  const handleSheetTouchMove = (e: React.TouchEvent) => {
    e.stopPropagation();
    const deltaY = e.touches[0].clientY - sheetStartYRef.current;
    sheetCurrentYRef.current = e.touches[0].clientY;
    setSheetDragY(deltaY > 0 ? deltaY : 0);
  };

  const handleSheetTouchEnd = (e: React.TouchEvent) => {
    e.stopPropagation();
    setIsSheetDragging(false);
    const deltaY = sheetCurrentYRef.current - sheetStartYRef.current;
    if (deltaY > SHEET_DISMISS_PX) {
      closeFiltersWithAnimation();
    } else {
      setSheetDragY(0); // snaps back with the 250 ms deceleration curve
    }
  };
  const [cardActions, setCardActions] = useState<Record<string, ActionType>>({});
  const [lastPassed, setLastPassed] = useState<{ id: string; name: string } | null>(null);

  const BATCH_SIZE = 12;
  const [visibleLimit, setVisibleLimit] = useState(BATCH_SIZE);

  useEffect(() => {
    if (filtersOpen) {
      setDraftMinAge(minAge);
      setDraftMaxAge(maxAge);
      setDraftGenders(selectedGenders);
      setDraftCountry(selectedCountry);
      setDraftIntent(selectedIntent);
      setDraftVerifiedOnly(verifiedOnly);
      setDraftActiveNowOnly(activeNowOnly);
      setDraftMode(discoveryMode);
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [filtersOpen, minAge, maxAge, selectedGenders, selectedCountry, selectedIntent, verifiedOnly, activeNowOnly, discoveryMode]);

  useEffect(() => {
    const handleMutualMatch = (e: CustomEvent<{ targetId: string }>) => {
      const target = profiles.find((p) => p.id === e.detail.targetId);
      if (target) {
        playMatchChime();
        setMatchedModalProfile({ id: target.id, name: target.name, avatarUrl: target.avatarUrl });
      }
    };
    window.addEventListener('ail-mutual-match' as any, handleMutualMatch);
    return () => window.removeEventListener('ail-mutual-match' as any, handleMutualMatch);
  }, [profiles]);

  useEffect(() => {
    const local = getLocalCardActions();
    setCardActions(local);

    async function loadFeed() {
      let hydrated = false;
      try {
        const cachedRaw = localStorage.getItem('ail_discover_cache');
        if (cachedRaw) {
          const cached = JSON.parse(cachedRaw);
          if (Array.isArray(cached.profiles) && cached.profiles.length > 0) {
            setProfiles(cached.profiles);
            hydrated = true;
          }
        }
      } catch {}
      if (!hydrated && profiles.length === 0) setIsLoading(true);
      try {
        const res = await fetch('/api/discover', { cache: 'no-store' });
        if (res.status === 401) {
          const hasVisited = localStorage.getItem('ail_returning') === '1';
          router.replace(hasVisited ? '/login' : '/');
          return;
        }
        if (res.ok) {
          const payload = await res.json();
          const v = payload.viewer;
          if (v) {
            if (v.onboarding_completed !== true) {
            router.replace('/onboarding');
            return;
          }
            if (v.latitude && v.longitude) {
              setCurrentUserCoords({ lat: v.latitude, lon: v.longitude });
            }
            setViewerTraits({ interests: v.interests ?? [], languages: v.languages ?? null });
            setViewerAvatar(v.avatarUrl ?? null);
            if (Array.isArray(v.interested_in) && v.interested_in.length > 0) {
              setViewerSavedGenders(v.interested_in);
              if (!localStorage.getItem('discover_gender_pref')) {
                setSelectedGenders(v.interested_in);
              }
            }
          }
          if (Array.isArray(payload.favoriteIds)) {
            setCardActions((prev) => {
              const merged = { ...prev };
              payload.favoriteIds.forEach((fid: string) => {
                merged[fid] = 'like';
              });
              return merged;
            });
          }
          if (Array.isArray(payload.profiles)) {
            // The server drops everyone already sparked, so a profile in this feed is NOT sparked:
            // clear any stale local "like" (localStorage) that would show a filled, dead heart.
            const feedIds = new Set<string>(payload.profiles.map((p: ProfileItem) => p.id));
            setCardActions((prev) => {
              const next = { ...prev };
              for (const id of Object.keys(next)) {
                if (next[id] === 'like' && feedIds.has(id)) delete next[id];
              }
              return next;
            });
            setProfiles(payload.profiles);
            if (payload.profiles.length > 0) {
              try {
                localStorage.setItem('ail_discover_cache', JSON.stringify({ profiles: payload.profiles }));
              } catch {}
            }
          }
        }
      } catch (err) {
        console.error('Failed to load discovery profiles:', err);
      } finally {
        setIsLoading(false);
      }
    }
    loadFeed();
  }, [router]);

  const refreshFeed = async () => {
    if (isRefreshing) return;
    setIsRefreshing(true);
    try {
      const res = await fetch('/api/discover', { cache: 'no-store' });
      if (res.ok) {
        const payload = await res.json();
        if (Array.isArray(payload.profiles)) {
          // Same reconciliation as the first load: feed profiles are never sparked server-side.
          const feedIds = new Set<string>(payload.profiles.map((p: ProfileItem) => p.id));
          setCardActions((prev) => {
            const next = { ...prev };
            for (const id of Object.keys(next)) {
              if (next[id] === 'like' && feedIds.has(id)) delete next[id];
            }
            return next;
          });
          setProfiles(payload.profiles);
          if (payload.profiles.length > 0) {
            try { localStorage.setItem('ail_discover_cache', JSON.stringify({ profiles: payload.profiles })); } catch {}
          }
        }
      }
    } catch {}
    setTimeout(() => { setIsRefreshing(false); }, 400);
  };

  const handlePullStart = (e: React.TouchEvent) => {
    if (isRefreshing || filtersOpen || searchOpen) return;
    if (scrollTopOf(e.currentTarget as HTMLElement) > 0) return;
    pullStartY.current = e.touches[0].clientY;
  };

  const handlePullMove = (e: React.TouchEvent) => {
    if (pullStartY.current === null) return;
    // The app shell scrolls an inner container, not the window: only pull when it is at the top.
    if (scrollTopOf(e.currentTarget as HTMLElement) > 0) { pullStartY.current = null; setPullDistance(0); return; }
    const dy = e.touches[0].clientY - pullStartY.current;
    if (dy <= 0) { setPullDistance(0); return; }
    setPullDistance(Math.min(dy * 0.45, 80));
  };

  const handlePullEnd = () => {
    if (pullStartY.current === null) return;
    pullStartY.current = null;
    if (pullDistance >= 56) { void refreshFeed(); }
    setPullDistance(0);
  };


  const closeModalWithAnimation = () => {
    setIsModalClosing(true);
    setTimeout(() => {
      setMatchedModalProfile(null);
      setIsModalClosing(false);
    }, 220);
  };

  const closeFiltersWithAnimation = () => {
    setFiltersClosing(true);
    setTimeout(() => {
      setFiltersOpen(false);
      setFiltersClosing(false);
      setSheetDragY(0);
      setIsSheetDragging(false);
      setSheetWasDragged(false);
    }, 240);
  };

  const [sparkLimitNotice, setSparkLimitNotice] = useState<string | null>(null);

  const triggerAction = async (id: string, action: ActionType, name?: string, avatarUrl?: string) => {
    const currentAction = cardActions[id];
    const isCurrentlyActive = currentAction === action;
    // A Spark is one-way from the card (Pairs / with.is): no un-spark, no double send.
    if (action === 'like' && isCurrentlyActive) return;
    if (action === 'like') {
      setSparkLimitNotice(`Spark sent to ${name || 'this member'}`);
      setTimeout(() => setSparkLimitNotice((cur) => (cur?.startsWith('Spark sent') ? null : cur)), 2200);
    }
    setCardActions((prev) => {
      const next = { ...prev };
      if (isCurrentlyActive) {
        delete next[id];
      } else {
        next[id] = action;
      }
      return next;
    });

    if (action === 'pass' && !isCurrentlyActive && name) {
      setLastPassed({ id, name });
    } else if (lastPassed?.id === id) {
      setLastPassed(null);
    }

    await persistCardAction(supabase, id, action, isCurrentlyActive);

    if (action === 'like' && !isCurrentlyActive) {
      try {
        const res = await fetch('/api/spark', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ targetUserId: id }),
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
          // Revert optimistic spark (e.g. 429 daily cap) so the UI stays truthful
          setCardActions((prev) => {
            const next = { ...prev };
            delete next[id];
            return next;
          });
          persistCardAction(supabase, id, 'like', true);
          setSparkLimitNotice(data?.error || 'Spark limit reached - try again later.');
          setTimeout(() => setSparkLimitNotice(null), 4000);
          return;
        }
        if (data?.mutual || data?.is_mutual) {
          playMatchChime();
          setMatchedModalProfile({ id, name: name || 'Member', avatarUrl: avatarUrl || '/placeholder-avatar.svg' });
        }
      } catch {}
    }
  };

  const undoLastPass = () => {
    if (!lastPassed) return;
    const targetId = lastPassed.id;
    setCardActions((prev) => {
      const next = { ...prev };
      delete next[targetId];
      return next;
    });
    persistCardAction(supabase, targetId, 'pass', true);
    setLastPassed(null);
  };

  const activeFiltersCount = useMemo(() => {
    let count = 0;
    if (selectedCountry.toLowerCase() !== 'all') count++;
    if (minAge > 18 || maxAge < 65) count++;
    if (selectedIntent !== 'All') count++;
    if (verifiedOnly) count++;
    if (activeNowOnly) count++;
    if (discoveryMode !== 'all') count++;
    if (
      selectedGenders.length > 0 &&
      (viewerSavedGenders.length === 0 ||
        selectedGenders.slice().sort().join(',') !== viewerSavedGenders.slice().sort().join(','))
    ) count++;
    return count;
  }, [selectedCountry, minAge, maxAge, selectedIntent, verifiedOnly, activeNowOnly, discoveryMode, selectedGenders, viewerSavedGenders]);

  const hasActiveFilters = activeFiltersCount > 0;

  const resetAndApplyFilters = () => {
    resetFilters();
    setSelectedGenders(viewerSavedGenders);
    setSelectedCountry('All');
    setSelectedIntent('all');
    setMinAge(18);
    setMaxAge(65);
    setVerifiedOnly(false);
    setActiveNowOnly(false);
    setDiscoveryMode('all');
  };

  const applyFilters = () => {
    setMinAge(draftMinAge);
    setMaxAge(draftMaxAge);
    setSelectedGenders(draftGenders);
    setSelectedCountry(draftCountry);
    setSelectedIntent(draftIntent);
    setVerifiedOnly(draftVerifiedOnly);
    setActiveNowOnly(draftActiveNowOnly);
    setDiscoveryMode(draftMode);
    closeFiltersWithAnimation();
  };

  const resetFilters = () => {
    setDraftGenders(viewerSavedGenders);
    setDraftCountry('All');
    setDraftIntent('all');
    setDraftMinAge(18);
    setDraftMaxAge(65);
    setDraftVerifiedOnly(false);
    setDraftActiveNowOnly(false);
    setDraftMode('all');
  };

  const filteredProfiles = useMemo(() => {
    return profiles.filter((profile) => {
      if (cardActions[profile.id] === 'pass') return false;
      const matchesCountry =
        selectedCountry.toLowerCase() === 'all' ||
        (profile.country || '').toLowerCase() === selectedCountry.toLowerCase();
      const matchesGender = selectedGenders.length === 0 || selectedGenders.includes(profile.gender);
      const q = searchQuery.toLowerCase().trim();
      const searchableName = (profile.username || profile.name || '').toLowerCase();
      const matchesQuery = !q || searchableName.includes(q) || profile.location.toLowerCase().includes(q);
      const matchesAge = profile.age >= minAge && profile.age <= maxAge;
      const matchesIntent = selectedIntent === 'all' || !profile.intent || normalizeIntent(profile.intent) === normalizeIntent(selectedIntent);
      const matchesVerified = !verifiedOnly || profile.verified;
      const matchesOnline = !activeNowOnly || profile.online || presentIds.has(profile.id);
      const matchesDiscoveryMode = (() => {
        if (discoveryMode === 'online') return Boolean(profile.online || presentIds.has(profile.id) || profile.recentlyActive);
        if (discoveryMode === 'near_me') return true;
        if (discoveryMode === 'new') {
          const createdAt = profile.created_at ? new Date(profile.created_at).getTime() : 0;
          return createdAt > Date.now() - 30 * 24 * 60 * 60 * 1000;
        }
        return true;
      })();
      return (
        matchesCountry &&
        matchesGender &&
        matchesQuery &&
        matchesAge &&
        matchesIntent &&
        matchesVerified &&
        matchesOnline &&
        matchesDiscoveryMode
      );
    });
  }, [profiles, cardActions, selectedCountry, selectedGenders, searchQuery, minAge, maxAge, selectedIntent, verifiedOnly, activeNowOnly, discoveryMode, presentIds]);

  const visibleProfiles = filteredProfiles.slice(0, visibleLimit);
  const hasMore = visibleLimit < filteredProfiles.length;

  return (
    <div onTouchStart={handlePullStart} onTouchMove={handlePullMove} onTouchEnd={handlePullEnd} className="w-full min-h-full bg-[#F8F7FA] text-[#1C1924] flex flex-col font-sans animate-[fadeIn_200ms_cubic-bezier(0.16,1,0.3,1)] overscroll-contain">
      {/* Pull-to-Refresh Indicator */}
      <div
        aria-hidden={!isRefreshing && pullDistance === 0}
        className={
          'flex items-center justify-center overflow-hidden transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] ' +
          (isRefreshing || pullDistance > 0 ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-4 max-h-0 pointer-events-none')
        }
        // Follows the finger 1:1 while pulling (no transition); animates open/closed otherwise.
        style={{ height: isRefreshing ? 40 : pullDistance, ...(pullDistance > 0 && !isRefreshing ? { transition: 'none' } : {}) }}
      >
        <div
          role={isRefreshing ? 'status' : undefined}
          aria-label={isRefreshing ? 'Refreshing' : undefined}
          className={'w-5 h-5 border-2 border-[#6555B8] border-t-transparent rounded-full ' + (isRefreshing ? 'animate-spin' : '')}
          // While pulling, rotation tracks the pull; while refreshing, animate-spin owns transform.
          style={isRefreshing ? undefined : { transform: `rotate(${pullDistance * 6}deg)`, opacity: Math.min(1, pullDistance / 56) }}
        />
      </div>
      <main className="w-full max-w-md mx-auto px-4 pt-4 pb-36 relative">
        {/* Static Pinned Search & Filter Controls on Left + Horizontally Scrolling Categories on Right */}
        <section aria-label="Search and Filters" className="sticky top-0 z-30 w-[calc(100%+2rem)] -mx-4 px-4 py-2 flex items-center gap-3 bg-[#F8F7FA]/95 backdrop-blur-md border-b border-[#EAE5F2]/60">
          <div className={`flex items-center gap-1.5 ${searchOpen || searchQuery ? 'flex-1 min-w-0' : 'hidden'}`}>
            {searchOpen || searchQuery ? (
              <div className={`flex-1 min-w-0 h-9 flex items-center gap-1 bg-white border border-[#DDD7E5] focus-within:border-[#6555B8] rounded-full pl-3 pr-2 shadow-2xs transition-all ${searchAnimating ? 'animate-[slideIn_200ms_cubic-bezier(0.16,1,0.3,1)]' : ''} ${searchClosing ? 'animate-[slideOut_180ms_ease-in_forwards]' : ''}`}>
                <Search className="w-3.5 h-3.5 text-[#8C849B] shrink-0" />
                <input
                  autoFocus
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  type="search"
                    autoComplete="off"
                    autoCorrect="off"
                    autoCapitalize="off"
                    spellCheck={false}
                    data-1p-ignore="true"
                    data-lpignore="true"
                    data-form-type="other"
                    placeholder="City or username"
                  className="flex-1 w-full bg-transparent text-xs text-[#1C1924] placeholder-[#8C849B] focus:outline-none"
                />
                <button
                  type="button"
                  onClick={() => {
                  setSearchClosing(true);
                  setTimeout(() => {
                    setSearchQuery('');
                    setSearchOpen(false);
                    setSearchClosing(false);
                  }, 180);
                }}
                  className="text-[#8C849B] hover:text-[#1C1924] text-xs px-1 cursor-pointer"
                >
                  <XIcon className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              null
            )}

          </div>

          {/* Horizontally Scrolling Category Pills */}
          {!(searchOpen || searchQuery) && (
          <div className="flex-1 min-w-0 overflow-x-auto no-scrollbar touch-pan-x select-none cursor-grab active:cursor-grabbing" onWheel={(e) => { if (e.deltaY !== 0) { e.currentTarget.scrollLeft += e.deltaY; } }} onMouseDown={(e) => { const el = e.currentTarget; el.dataset.dragging = "1"; el.dataset.startX = String(e.pageX); el.dataset.scrollLeft = String(el.scrollLeft); }} onMouseMove={(e) => { const el = e.currentTarget; if (el.dataset.dragging !== "1") return; e.preventDefault(); el.scrollLeft = Number(el.dataset.scrollLeft) - (e.pageX - Number(el.dataset.startX)) * 1.3; }} onMouseUp={(e) => { e.currentTarget.dataset.dragging = "0"; }} onMouseLeave={(e) => { e.currentTarget.dataset.dragging = "0"; }}>
            <div className="flex items-center gap-5 w-max">
              {DISCOVERY_MODES.map((mode) => {
                const active = discoveryMode === mode.id;
                return (
                  <button
                    key={mode.id}
                    type="button"
                    onClick={() => setDiscoveryMode(mode.id)}
                    className={`shrink-0 text-sm h-8 flex items-center transition-colors ${
                      active ? 'text-[#6555B8] font-bold' : 'text-black/40 font-medium'
                    }`}
                    
                  >
                    {mode.label}
                  </button>
                );
              })}
            </div>
          </div>
          )}
                        {(searchOpen || searchQuery) ? null : (
              <div className="shrink-0 h-8 flex items-center bg-white border border-[#E8E4EE] rounded-full px-1 shadow-[0_1px_3px_rgba(0,0,0,0.03)]">
                <button
                  type="button"
                  onClick={() => setSearchOpen(true)}
                  aria-label="Search profiles"
                  className="w-7 h-7 rounded-full flex items-center justify-center text-[#6C637B] hover:text-[#1C1924] hover:bg-[#F8F7FA] active:scale-95 transition-all cursor-pointer"
                >
                  <Search className="w-3.5 h-3.5" />
                </button>
                <div className="w-[1px] h-3.5 bg-[#E8E4EE] mx-0.5" />
                <button
                  type="button"
                  onClick={() => setFiltersOpen(true)}
                  aria-label="Filter preferences"
                  className="relative w-7 h-7 rounded-full flex items-center justify-center text-[#6C637B] hover:text-[#1C1924] hover:bg-[#F8F7FA] active:scale-95 transition-all cursor-pointer"
                >
                  <SlidersHorizontal className="w-3.5 h-3.5" />
                  {hasActiveFilters && (
                    <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-[#6555B8] ring-2 ring-white" />
                  )}
                </button>
              </div>
            )}
        </section>

        {/* 2-Column Feed Grid */}
        <div className="grid grid-cols-2 gap-3.5 w-full animate-fade-in-up">
          {isLoading ? (
            Array.from({ length: 8 }).map((_, i) => (
              <div
                key={i}
                className="rounded-2xl overflow-hidden aspect-[4/5] w-full bg-[#EAE8F0] animate-pulse border border-[#DDD7E5] relative"
              >
                <div className="absolute inset-x-0 bottom-0 p-3 space-y-2">
                  <div className="h-4 bg-white/40 rounded-full w-2/3" />
                  <div className="h-3 bg-white/30 rounded-full w-1/2" />
                </div>
              </div>
            ))
          ) : (
            visibleProfiles.map((profile, cardIdx) => {
              const state = cardActions[profile.id];
              const isLiked = state === 'like';
              const displayName = profile.username || profile.name || 'Member';
              const cityPart = profile.location ? profile.location.split(',')[0].trim() : '';
              const countryPart = profile.country || '';
              const formattedLocation =
                cityPart && countryPart && cityPart.toLowerCase() !== countryPart.toLowerCase()
                  ? `${cityPart}, ${countryPart}`
                  : cityPart || countryPart || 'Unknown';
              return (
                <div
                  key={profile.id}
                  className="group relative isolate rounded-2xl overflow-hidden aspect-[4/5] w-full bg-[#F2EEF7] border border-[#DDD7E5]/70 shadow-xs hover:shadow-md transition-all duration-300 select-none"
                >
                  <DiscoverCardPhotoCarousel
                    profileId={profile.id}
                    photos={profile.photos}
                    avatarUrl={profile.avatarUrl}
                    name={displayName}
                    repScore={profile.repScore}
                    online={profile.online || presentIds.has(profile.id)}
                    recentlyActive={profile.recentlyActive}
                    priority={cardIdx < 2}
                  />
                  {isTrustedVoiceIntroUrl(profile.voiceIntroUrl) && (
                    <div className="absolute top-[7px] left-6 z-30">
                      <AudioPill src={profile.voiceIntroUrl} label="Voice" size="sm" />
                    </div>
                  )}
                  <SparkHeartButton
                    sparked={isLiked}
                    name={displayName}
                    onSpark={() => triggerAction(profile.id, 'like', displayName, profile.avatarUrl)}
                    className="absolute top-3 right-3 z-20"
                  />
                  <div className="absolute bottom-0 inset-x-0 pt-10 pb-3 px-3 z-10 pointer-events-none bg-gradient-to-t from-black/65 via-black/25 to-transparent">
                    <Link href={'/profile/' + profile.id} className="block min-w-0 pointer-events-auto">
                      <div className="flex items-center min-w-0">
                        <h3
                          className="text-sm font-bold text-white leading-tight truncate"
                          style={{ fontFamily: 'var(--font-brand)' }}
                        >
                          {displayName}
                        </h3>
                        {profile.age ? (
                          <span
                            className="text-sm font-bold text-white leading-tight shrink-0"
                            style={{ fontFamily: 'var(--font-brand)' }}
                          >
                            {', ' + profile.age}
                          </span>
                        ) : null}
                        {profile.verified && <VerifiedBadge size="sm" className="shrink-0 ml-1" />}
                      </div>
                      <p className="text-[11px] text-white/90 font-medium mt-0.5 truncate pr-7">
                        {formattedLocation}
                      </p>
                      {(() => {
                        const common = sharedTraits(viewerTraits, profile);
                        if (!profile.replyPace && common.length === 0) return null;
                        return (
                          <div className="mt-1 flex flex-col items-start gap-1 min-w-0">
                            <RhythmPill field="reply_pace" value={profile.replyPace} variant="glass" />
                            <InCommonCard items={common} compact />
                          </div>
                        );
                      })()}
                    </Link>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {sparkLimitNotice && (
          <div className="fixed top-4 left-1/2 -translate-x-1/2 w-[calc(100%-2rem)] max-w-[400px] z-50 px-4 py-2.5 rounded-2xl bg-white/95 border border-[#ECE8F4] text-[#1C1924] text-[13px] font-medium shadow-[0_12px_32px_rgba(101,85,184,0.18)] backdrop-blur-md text-center">
            {sparkLimitNotice}
          </div>
        )}

        {!isLoading && filteredProfiles.length === 0 && (
          <div className="mt-4 p-8 rounded-2xl bg-white border border-[#DDD7E5] text-center space-y-3 shadow-xs">
            <div className="w-12 h-12 mx-auto rounded-2xl bg-[#F3EFFC] flex items-center justify-center text-[#6555B8]">
              <Search className="w-5 h-5" />
            </div>
            <p className="text-base font-bold text-[#1C1924]" style={{ fontFamily: 'var(--font-brand)' }}>
              No profiles match your current filters
            </p>
            <button
              type="button"
              onClick={resetAndApplyFilters}
              className="inline-flex items-center gap-1.5 px-5 py-2.5 text-xs font-semibold rounded-full bg-[#6555B8] text-white hover:bg-[#52449e] transition shadow-sm cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset Filters</span>
            </button>
          </div>
        )}

        {hasMore && (
          <div className="pt-5 pb-2 flex justify-center">
            <button
              type="button"
              onClick={() => setVisibleLimit((prev) => prev + BATCH_SIZE)}
              className="px-6 py-2.5 rounded-full bg-white border border-[#DDD7E5] text-[#1C1924] hover:border-[#6555B8] text-xs font-semibold transition shadow-xs cursor-pointer"
            >
              Load More Profiles ({filteredProfiles.length - visibleLimit} remaining)
            </button>
          </div>
        )}

        {lastPassed && (
          <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-[60] flex items-center gap-3 px-4 py-2.5 rounded-full bg-white/95 border border-[#DDD7E5] shadow-2xl backdrop-blur-md">
            <span className="text-xs text-[#1C1924]">
              Passed <strong>{lastPassed.name}</strong>
            </span>
            <button
              type="button"
              onClick={undoLastPass}
              className="px-3 py-1 rounded-full bg-[#6555B8] hover:bg-[#52449e] text-white text-xs font-semibold flex items-center gap-1 transition shadow-sm cursor-pointer"
            >
              <RotateCcw className="w-3 h-3" />
              Undo
            </button>
          </div>
        )}
      </main>
      <style jsx global>{`
        @keyframes sheetSlideUp {
          from { transform: translateY(100%); }
          to { transform: translateY(0); }
        }`}</style>

      {/* Filter Drawer (Pairs/With Style Mobile Bottom Sheet) */}
        {filtersOpen && typeof document !== 'undefined' &&
          createPortal(
            <div className="fixed inset-0 z-[999] flex justify-center items-end">
              {/* Dimmed backdrop */}
              <div
                className={
                  'fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity duration-200 ' +
                  (filtersClosing ? 'opacity-0' : 'opacity-100')
                }
                onClick={closeFiltersWithAnimation}
              />

              {/* Bottom Sheet Modal confined to mobile app shell */}
              <div className="relative z-10 w-full max-w-[430px] flex flex-col pointer-events-none">
                <div
                  role="dialog"
                  aria-modal="true"
                  className="w-full max-h-[85vh] bg-white rounded-t-[28px] shadow-[0_-10px_35px_rgba(0,0,0,0.16)] flex flex-col overflow-hidden will-change-transform pointer-events-auto"
                  style={
                    filtersClosing
                      ? { transform: 'translateY(100%)', transition: 'transform 0.22s cubic-bezier(0.16, 1, 0.3, 1)' }
                      : sheetWasDragged
                      ? {
                          transform: sheetDragY > 0 ? `translateY(${sheetDragY}px)` : undefined,
                          transition: isSheetDragging ? 'none' : 'transform 250ms cubic-bezier(0.16, 1, 0.3, 1)',
                        }
                      : { animation: 'sheetSlideUp 0.28s cubic-bezier(0.16, 1, 0.3, 1) both' }
                  }
                >
                  {/* Top Pull Handle: drag down (> 90px) to dismiss */}
                  <div
                    className="pt-3 pb-2 shrink-0 bg-white cursor-grab active:cursor-grabbing touch-none select-none"
                    onTouchStart={handleSheetTouchStart}
                    onTouchMove={handleSheetTouchMove}
                    onTouchEnd={handleSheetTouchEnd}
                    onTouchCancel={handleSheetTouchEnd}
                  >
                    <div className="w-10 h-1.5 rounded-full bg-slate-300 mx-auto mb-2" />
                  </div>

                  {/* Header (also a drag region) */}
                  <div
                    className="flex items-center justify-between px-5 py-2.5 border-b border-[#F0ECF4] shrink-0 bg-white select-none touch-none"
                    onTouchStart={handleSheetTouchStart}
                    onTouchMove={handleSheetTouchMove}
                    onTouchEnd={handleSheetTouchEnd}
                    onTouchCancel={handleSheetTouchEnd}
                  >
                    <div className="flex items-center gap-2">
                      <SlidersHorizontal className="w-4 h-4 text-[#6555B8]" />
                      <h2 className="text-sm font-bold text-[#1C1924]">Refine Discover Feed</h2>
                    </div>
                    <button
                      type="button"
                      onClick={closeFiltersWithAnimation}
                      className="p-1.5 rounded-full text-[#6C637B] hover:bg-[#F3EFFC] transition cursor-pointer"
                      aria-label="Close filters"
                    >
                      <XIcon className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Scrollable Form Body with hidden scrollbar */}
                  <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain touch-pan-y px-5 py-4 space-y-5 no-scrollbar [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
                    <div>
                      <label className="text-[11px] font-bold text-[#6C637B] uppercase tracking-wider block mb-2">
                        Interested In
                      </label>
                      <div className="flex flex-wrap gap-2">
                        {[
                          { id: 'female', label: 'Women' },
                          { id: 'male', label: 'Men' },
                        ].map((item) => {
                          const isSelected = draftGenders.includes(item.id);
                          return (
                            <button
                              key={item.id}
                              type="button"
                              onClick={() => {
                                setDraftGenders(
                                  draftGenders.includes(item.id)
                                    ? draftGenders.filter((g) => g !== item.id)
                                    : [...draftGenders, item.id]
                                );
                              }}
                              className={
                                'py-1.5 px-3.5 rounded-full border text-xs font-semibold transition-all cursor-pointer active:scale-95 ' +
                                (isSelected
                                  ? 'bg-[#6555B8] text-white border-[#6555B8] shadow-2xs'
                                  : 'bg-white text-[#1C1924] border-[#DDD7E5] hover:border-[#6555B8]/40')
                              }
                            >
                              {item.label}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    <div>
                      <label className="text-[11px] font-bold text-[#6C637B] uppercase tracking-wider block mb-2">
                        Age Range
                      </label>
                      <div className="flex items-center gap-2.5">
                        <div className="relative flex-1">
                          <select
                            aria-label="Minimum age"
                            value={draftMinAge}
                            onChange={(e) => setDraftMinAge(Math.min(Number(e.target.value), draftMaxAge))}
                            className="w-full appearance-none bg-slate-50 border border-slate-200 text-[#2D264B] font-medium rounded-xl pl-3 pr-9 py-2 text-sm cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#6555B8]/30"
                          >
                            {Array.from({ length: 48 }, (_, i) => i + 18).map((age) => (
                              <option key={age} value={age} className="bg-white text-[#2D264B]">{age}</option>
                            ))}
                          </select>
                          <ChevronDown aria-hidden className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        </div>
                        <span className="text-xs text-[#6C637B] font-medium">to</span>
                        <div className="relative flex-1">
                          <select
                            aria-label="Maximum age"
                            value={draftMaxAge}
                            onChange={(e) => setDraftMaxAge(Math.max(Number(e.target.value), draftMinAge))}
                            className="w-full appearance-none bg-slate-50 border border-slate-200 text-[#2D264B] font-medium rounded-xl pl-3 pr-9 py-2 text-sm cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#6555B8]/30"
                          >
                            {Array.from({ length: 48 }, (_, i) => i + 18).map((age) => (
                              <option key={age} value={age} className="bg-white text-[#2D264B]">{age}</option>
                            ))}
                          </select>
                          <ChevronDown aria-hidden className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        </div>
                      </div>
                    </div>

                    <div>
                      <label className="text-[11px] font-bold text-[#6C637B] uppercase tracking-wider block mb-2">
                        Country
                      </label>
                      <div className="relative">
                        <select
                          aria-label="Country"
                          value={draftCountry}
                          onChange={(e) => setDraftCountry(e.target.value)}
                          className="w-full appearance-none bg-slate-50 border border-slate-200 text-[#2D264B] font-medium rounded-xl pl-3 pr-9 py-2 text-sm cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#6555B8]/30"
                        >
                          <option value="All" className="bg-white text-[#2D264B]">All Countries</option>
                          {Array.from(new Set(profiles.map((pr) => (pr.country || '').trim()).filter(Boolean))).sort().map((c) => (
                            <option key={c} value={c} className="bg-white text-[#2D264B]">{c}</option>
                          ))}
                        </select>
                        <ChevronDown aria-hidden className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      </div>
                    </div>

                    <div>
                      <label className="text-[11px] font-bold text-[#6C637B] uppercase tracking-wider block mb-2">
                        Looking For
                      </label>
                      <div className="flex flex-wrap gap-2">
                        {[{value: 'all', label: 'All'}, ...INTENT_OPTIONS].map((option) => (
                          <button
                            key={option.value}
                            type="button"
                            onClick={() => setDraftIntent(option.value)}
                            className={
                              'py-1.5 px-3.5 rounded-full border text-xs font-semibold transition-all cursor-pointer active:scale-95 ' +
                              (draftIntent === option.value
                                ? 'bg-[#6555B8] text-white border-[#6555B8] shadow-2xs'
                                : 'bg-white text-[#1C1924] border-[#DDD7E5] hover:border-[#6555B8]/40')
                            }
                          >
                            {option.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <label className="text-[11px] font-bold text-[#6C637B] uppercase tracking-wider block mb-2">
                        Browse Mode
                      </label>
                      <div className="flex flex-wrap gap-2">
                        {DISCOVERY_MODES.map((mode) => (
                          <button
                            key={mode.id}
                            type="button"
                            onClick={() => setDraftMode(mode.id)}
                            className={
                              'py-1.5 px-3.5 rounded-full border text-xs font-semibold transition-all cursor-pointer active:scale-95 ' +
                              (draftMode === mode.id
                                ? 'bg-[#6555B8] text-white border-[#6555B8] shadow-2xs'
                                : 'bg-white text-[#1C1924] border-[#DDD7E5] hover:border-[#6555B8]/40')
                            }
                          >
                            {mode.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-3 pt-1">
                      {[
                        { label: 'Verified profiles only', value: draftVerifiedOnly, set: setDraftVerifiedOnly },
                        { label: 'Active now only', value: draftActiveNowOnly, set: setDraftActiveNowOnly },
                      ].map((row) => (
                        <button
                          key={row.label}
                          type="button"
                          onClick={() => row.set(!row.value)}
                          className="w-full flex items-center justify-between py-2 text-xs font-medium text-[#1C1924] cursor-pointer"
                        >
                          <span>{row.label}</span>
                          <span className={'w-10 h-6 rounded-full transition-colors relative shrink-0 ' + (row.value ? 'bg-[#6555B8]' : 'bg-[#DDD7E5]')}>
                            <span className={'absolute top-1 w-4 h-4 rounded-full bg-white shadow transition-all ' + (row.value ? 'left-5' : 'left-1')} />
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Sticky Footer */}
                  <div className="px-5 py-3 pb-[max(1rem,env(safe-area-inset-bottom))] bg-white/95 backdrop-blur-md border-t border-[#ECE8F2] flex items-center gap-3 shrink-0">
                    <button
                      type="button"
                      onClick={resetFilters}
                      className="py-2.5 px-4 rounded-full text-xs font-semibold text-[#6C637B] hover:text-[#1C1924] hover:bg-[#F8F7FA] transition cursor-pointer"
                    >
                      Reset
                    </button>
                    <button
                      type="button"
                      onClick={applyFilters}
                      className="flex-1 py-2.5 rounded-full bg-gradient-to-r from-[#6555B8] to-[#5546A8] text-white text-xs font-bold shadow-[0_4px_14px_rgba(101,85,184,0.35)] hover:opacity-95 active:scale-[0.98] transition-all cursor-pointer"
                    >
                      Apply Filters
                    </button>
                  </div>
                </div>
              </div>
            </div>,
            document.body
          )}

      {matchedModalProfile && (
        <MutualSparkModal
          name={matchedModalProfile.name}
          theirAvatar={matchedModalProfile.avatarUrl}
          myAvatar={viewerAvatar}
          chatHref={'/chat/' + matchedModalProfile.id}
          closing={isModalClosing}
          onClose={closeModalWithAnimation}
        />
      )}
    </div>
  );
}

function DiscoverFeed() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#F8F7FA] text-[#1C1924] p-8 text-center text-xs">Loading discover feed...</div>}>
      <DiscoverContent />
    </Suspense>
  );
}

export default function AuthGate() {
  const router = useRouter();
  const [authState, setAuthState] = useState<'loading' | 'member'>('loading');
  useEffect(() => {
    let mounted = true;
    supabase.auth.getUser().then(({ data, error }) => {
      if (!mounted) return;
      if (data?.user && !error) {
        setAuthState('member');
      } else {
        const hasVisited =
          typeof window !== 'undefined' &&
          (localStorage.getItem('ail_returning') === '1' ||
            document.cookie.split('; ').some((row) => row.startsWith('ail_returning=1')));
        router.replace(hasVisited ? '/login' : '/');
      }
    });
    return () => {
      mounted = false;
    };
  }, [router]);

  if (authState === 'loading') {
    return (
      <div className="min-h-screen bg-[#F8F7FA] flex items-center justify-center">
        <div className="animate-spin rounded-full h-10 w-10 border-4 border-[#6555B8] border-t-transparent"></div>
      </div>
    );
  }
  return <DiscoverFeed />;
}

