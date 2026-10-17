'use client';
import { playMatchChime } from '@/lib/sound';
import React, { useState, useEffect, useMemo, Suspense } from 'react';
import { createPortal } from 'react-dom';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
import { Camera, Zap, ChevronLeft, ChevronRight, Search, Heart, X as XIcon, CheckCircle, SlidersHorizontal, RotateCcw } from 'lucide-react';
import { supabase } from '@/lib/supabase/client';
import { ActionType, getLocalCardActions, persistCardAction } from '@/lib/interactions';

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
  trans_woman: 'Trans Women',
  trans_man: 'Trans Men',
  non_binary: 'Non-Binary',
};

export interface ProfileItem {
  id: string;
  username?: string;
  name: string;
  age: number;
  gender: 'woman' | 'man' | 'trans_woman' | 'trans_man' | 'non_binary';
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
}

function DiscoverCardPhotoCarousel({
  profileId,
  photos,
  avatarUrl,
  name,
  repScore,
  online,
  recentlyActive,
}: {
  profileId: string;
  photos?: string[];
  avatarUrl: string;
  name: string;
  repScore: number;
  online: boolean;
  recentlyActive?: boolean;
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
        <img
          src={displayPhotos[currentIdx]}
          alt={name}
          className="w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-500 ease-out"
          loading="lazy"
        />
      </Link>
      {displayPhotos.length > 1 && (
        <span className="absolute bottom-2.5 right-2.5 z-20 inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-black/55 backdrop-blur-2xs text-white text-[10px] font-semibold pointer-events-none">
          <Camera className="w-3 h-3" />
          {displayPhotos.length}
        </span>
      )}
      <div className="absolute top-2.5 left-2.5 flex items-center gap-1.5 z-20 pointer-events-none">
        <div className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-black/50 backdrop-blur-xs text-[10px] font-semibold text-white">
          <span>{repScore ? repScore + '% Rep' : '100% Rep'}</span>
        </div>
        {online ? (
          <span className="h-2 w-2 rounded-full bg-emerald-500 ring-2 ring-white/90 shadow-xs shrink-0" />
        ) : recentlyActive ? (
          <span className="h-2 w-2 rounded-full bg-amber-400 ring-1.5 ring-white/80 shadow-xs shrink-0" />
        ) : null}
      </div>
      {hasMultiple && (
        <div className="flex items-center justify-between absolute inset-x-1.5 top-1/2 -translate-y-1/2 z-20 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity">
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

function normalizeGenderValue(raw?: string | null): 'woman' | 'man' | 'trans_woman' | 'trans_man' | 'non_binary' {
  const val = String(raw || '').toLowerCase().trim().replace(/[\s-]+/g, '_');
  if (['man', 'men', 'male', 'm', 'guy', 'guys'].includes(val)) return 'man';
  if (['woman', 'women', 'female', 'f', 'lady', 'ladies', 'girl', 'girls'].includes(val)) return 'woman';
  if (['trans_woman', 'trans_women', 'transgender_woman', 'transgender_women', 'trans', 'mtf', 'transfemale'].includes(val))
    return 'trans_woman';
  if (['trans_man', 'trans_men', 'transgender_man', 'transgender_men', 'ftm', 'transmale'].includes(val)) return 'trans_man';
  if (['non_binary', 'nonbinary', 'nb', 'enby'].includes(val)) return 'non_binary';
  return 'woman';
}

function DiscoverContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [discoveryMode, setDiscoveryMode] = useState<DiscoveryModeId>('all');
  const [currentUserCoords, setCurrentUserCoords] = useState<{ lat: number; lon: number } | null>(null);
  const [viewerSavedGenders, setViewerSavedGenders] = useState<string[]>([]);
  const [profiles, setProfiles] = useState<ProfileItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState(() => searchParams.get('q') || '');
  const [selectedCountry, setSelectedCountry] = useState('All');
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchAnimating, setSearchAnimating] = useState(false);

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
  const [selectedIntent, setSelectedIntent] = useState<string>('All');
  const [verifiedOnly, setVerifiedOnly] = useState<boolean>(false);
  const [activeNowOnly, setActiveNowOnly] = useState<boolean>(false);

  const [matchedModalProfile, setMatchedModalProfile] = useState<{ id: string; name: string; avatarUrl?: string } | null>(null);
  const [isModalClosing, setIsModalClosing] = useState(false);
  const [filtersClosing, setFiltersClosing] = useState(false);
  const [cardActions, setCardActions] = useState<Record<string, ActionType>>({});
  const [lastPassed, setLastPassed] = useState<{ id: string; name: string } | null>(null);

  const BATCH_SIZE = 12;
  const [visibleLimit, setVisibleLimit] = useState(BATCH_SIZE);

  useEffect(() => {
    if (filtersOpen) {
      setDraftMinAge(minAge);
      setDraftMaxAge(maxAge);
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [filtersOpen, minAge, maxAge]);

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
      setIsLoading(true);
      try {
        const res = await fetch('/api/discover', { cache: 'no-store' });
        if (res.ok) {
          const payload = await res.json();
          const v = payload.viewer;
          if (v) {
            if (v.onboarding_completed === false) {
              router.push('/onboarding');
              return;
            }
            if (v.latitude && v.longitude) {
              setCurrentUserCoords({ lat: v.latitude, lon: v.longitude });
            }
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
            setProfiles(payload.profiles);
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
    }, 240);
  };

  const triggerAction = async (id: string, action: ActionType, name?: string, avatarUrl?: string) => {
    const currentAction = cardActions[id];
    const isCurrentlyActive = currentAction === action;
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
        if (data?.mutual) {
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
    return count;
  }, [selectedCountry, minAge, maxAge, selectedIntent, verifiedOnly, activeNowOnly, discoveryMode]);

  const applyFilters = () => {
    setMinAge(draftMinAge);
    setMaxAge(draftMaxAge);
    setFiltersOpen(false);
  };

  const resetFilters = () => {
    setDiscoveryMode('all');
    setSelectedGenders(viewerSavedGenders);
    setSelectedCountry('All');
    setSearchQuery('');
    setMinAge(18);
    setMaxAge(65);
    setDraftMinAge(18);
    setDraftMaxAge(65);
    setSelectedIntent('All');
    setVerifiedOnly(false);
    setActiveNowOnly(false);
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
      const matchesIntent = selectedIntent === 'All' || !profile.intent || profile.intent === selectedIntent;
      const matchesVerified = !verifiedOnly || profile.verified;
      const matchesOnline = !activeNowOnly || profile.online;
      const matchesDiscoveryMode = (() => {
        if (discoveryMode === 'online') return Boolean(profile.online || profile.recentlyActive);
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
  }, [profiles, cardActions, selectedCountry, selectedGenders, searchQuery, minAge, maxAge, selectedIntent, verifiedOnly, activeNowOnly, discoveryMode]);

  const visibleProfiles = filteredProfiles.slice(0, visibleLimit);
  const hasMore = visibleLimit < filteredProfiles.length;

  return (
    <div className="w-full min-h-full bg-[#F8F7FA] text-[#1C1924] flex flex-col font-sans animate-[fadeIn_200ms_cubic-bezier(0.16,1,0.3,1)]">
      <main className="w-full max-w-md mx-auto px-4 pt-4 pb-36 relative">
        {/* Static Pinned Search & Filter Controls on Left + Horizontally Scrolling Categories on Right */}
        <section aria-label="Search and Filters" className="w-full mb-4 flex items-center gap-2">
          <div className="shrink-0 flex items-center gap-1.5">
            {searchOpen || searchQuery ? (
              <div className={`flex-1 min-w-0 h-9 flex items-center gap-1 bg-white border border-[#DDD7E5] focus-within:border-[#6555B8] rounded-full pl-3 pr-2 shadow-2xs transition-all ${searchAnimating ? 'animate-[slideIn_200ms_cubic-bezier(0.16,1,0.3,1)]' : ''}`}>
                <Search className="w-3.5 h-3.5 text-[#8C849B] shrink-0" />
                <input
                  autoFocus
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="City or username"
                  className="flex-1 w-full bg-transparent text-xs text-[#1C1924] placeholder-[#8C849B] focus:outline-none"
                />
                <button
                  type="button"
                  onClick={() => {
                  setSearchAnimating(true);
                  setTimeout(() => {
                    setSearchQuery('');
                    setSearchOpen(false);
                    setSearchAnimating(false);
                  }, 200);
                }}
                  className="text-[#8C849B] hover:text-[#1C1924] text-xs px-1 cursor-pointer"
                >
                  ×
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => {
                  setSearchAnimating(true);
                  setTimeout(() => setSearchOpen(true), 10);
                  setTimeout(() => setSearchAnimating(false), 200);
                }}
                aria-label="Open Search"
                className="w-9 h-9 rounded-full bg-white border border-[#DDD7E5] text-[#6C637B] hover:text-[#6555B8] hover:border-[#CFC8DC] flex items-center justify-center transition shadow-2xs cursor-pointer"
              >
                <Search className="w-4 h-4" />
              </button>
            )}

            <button
              type="button"
              onClick={() => setFiltersOpen(true)}
              aria-label="Open Filters"
              className="relative w-9 h-9 rounded-full bg-white border border-[#DDD7E5] text-[#6555B8] hover:border-[#CFC8DC] flex items-center justify-center transition shadow-2xs cursor-pointer"
            >
              <SlidersHorizontal className="w-4 h-4" />
              {activeFiltersCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-[#6555B8] ring-2 ring-white" />
              )}
            </button>
          </div>

          {/* Horizontally Scrolling Category Pills */}
          {!(searchOpen || searchQuery) && (
          <div className="flex-1 min-w-0 overflow-x-auto no-scrollbar touch-pan-x select-none cursor-grab active:cursor-grabbing" onWheel={(e) => { if (e.deltaY !== 0) { e.currentTarget.scrollLeft += e.deltaY; } }} onMouseDown={(e) => { const el = e.currentTarget; el.dataset.dragging = "1"; el.dataset.startX = String(e.pageX); el.dataset.scrollLeft = String(el.scrollLeft); }} onMouseMove={(e) => { const el = e.currentTarget; if (el.dataset.dragging !== "1") return; e.preventDefault(); el.scrollLeft = Number(el.dataset.scrollLeft) - (e.pageX - Number(el.dataset.startX)) * 1.3; }} onMouseUp={(e) => { e.currentTarget.dataset.dragging = "0"; }} onMouseLeave={(e) => { e.currentTarget.dataset.dragging = "0"; }}>
            <div className="flex items-center gap-1.5 w-max">
              {DISCOVERY_MODES.map((mode) => {
                const active = discoveryMode === mode.id;
                return (
                  <button
                    key={mode.id}
                    type="button"
                    onClick={() => setDiscoveryMode(mode.id)}
                    className={
                      'h-9 px-4 rounded-full text-xs font-semibold border inline-flex items-center justify-center transition-all whitespace-nowrap active:scale-95 cursor-pointer ' +
                      (active
                        ? 'bg-[#6555B8] border-[#6555B8] text-white shadow-2xs'
                        : 'bg-white border-[#DDD7E5] text-[#524B5E] hover:border-[#6555B8]/40 hover:text-[#1C1924]')
                    }
                  >
                    {mode.label}
                  </button>
                );
              })}
            </div>
          </div>
          )}
        </section>

        {/* 2-Column Feed Grid */}
        <div className="grid grid-cols-2 gap-3.5 w-full">
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
            visibleProfiles.map((profile) => {
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
                  className="group relative rounded-2xl overflow-hidden aspect-[4/5] w-full bg-[#F2EEF7] border border-[#DDD7E5]/70 shadow-xs hover:shadow-md transition-all duration-300 select-none"
                >
                  <DiscoverCardPhotoCarousel
                    profileId={profile.id}
                    photos={profile.photos}
                    avatarUrl={profile.avatarUrl}
                    name={displayName}
                    repScore={profile.repScore}
                    online={profile.online}
                    recentlyActive={profile.recentlyActive}
                  />
                  <button
                    type="button"
                    aria-label={isLiked ? 'Remove Spark' : 'Send Spark'}
                    onClick={(e) => {
                      e.stopPropagation();
                      e.preventDefault();
                      triggerAction(profile.id, 'like', displayName, profile.avatarUrl);
                    }}
                    className={
                      'absolute top-2.5 right-2.5 z-20 w-8 h-8 rounded-full flex items-center justify-center transition-all duration-200 active:scale-90 cursor-pointer ' +
                      (isLiked
                        ? 'bg-[#6555B8] text-white shadow-md'
                        : 'bg-black/45 text-white hover:bg-black/65 backdrop-blur-xs')
                    }
                  >
                    <Zap className={'w-4 h-4 ' + (isLiked ? 'fill-white' : '')} />
                  </button>
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
                        {profile.verified && <CheckCircle className="w-3.5 h-3.5 text-white shrink-0 ml-1" />}
                      </div>
                      <p className="text-[11px] text-white/90 font-medium mt-0.5 truncate pr-7">
                        {formattedLocation}
                      </p>
                    </Link>
                  </div>
                </div>
              );
            })
          )}
        </div>

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
              onClick={resetFilters}
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

      {/* Filter Drawer */}
      {filtersOpen && typeof document !== 'undefined' &&
        createPortal(
          <div className="fixed inset-0 z-[999] flex items-end justify-center">
            <div
              className={
                'fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity duration-200 ' +
                (filtersClosing ? 'opacity-0' : 'opacity-100')
              }
              onClick={closeFiltersWithAnimation}
            />
            <div
              role="dialog"
              aria-modal="true"
              className="relative z-10 w-full max-w-[430px] mx-auto bg-white rounded-t-3xl shadow-2xl flex flex-col overflow-hidden will-change-transform"
              style={
                filtersClosing
                  ? { transform: 'translateY(100%)', transition: 'transform 0.24s cubic-bezier(0.16, 1, 0.3, 1)' }
                  : { animation: 'filterSheetIn 0.26s cubic-bezier(0.16, 1, 0.3, 1) both' }
              }
            >
              <div className="flex items-center justify-between px-4 py-3 border-b border-[#DDD7E5] shrink-0 bg-white">
                <div className="flex items-center gap-2">
                  <SlidersHorizontal className="w-4 h-4 text-[#6555B8]" />
                  <h2 className="text-sm font-bold text-[#1C1924]">Refine Discover Feed</h2>
                </div>
                <button
                  type="button"
                  onClick={closeFiltersWithAnimation}
                  className="p-1.5 rounded-full text-[#524B5E] hover:bg-[#F3EFFC] transition cursor-pointer"
                  aria-label="Close filters"
                >
                  <XIcon className="w-4 h-4" />
                </button>
              </div>
              <div className="flex-1 min-h-0 overflow-y-auto px-4 py-3 space-y-4">
                <div>
                  <label className="text-[11px] font-semibold text-[#6C637B] uppercase tracking-wider block mb-2">
                    Interested In
                  </label>
                  <div className="flex flex-wrap gap-1.5">
                    {[
                      { id: 'woman', label: 'Women' },
                      { id: 'man', label: 'Men' },
                      { id: 'trans', label: 'Trans' },
                    ].map((item) => {
                      const isTrans = item.id === 'trans';
                      const isSelected = isTrans
                        ? selectedGenders.some((g) => ['trans_woman', 'trans_man', 'non_binary'].includes(g))
                        : selectedGenders.includes(item.id);
                      return (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => {
                            if (isTrans) {
                              const hasAnyTrans = selectedGenders.some((g) =>
                                ['trans_woman', 'trans_man', 'non_binary'].includes(g)
                              );
                              if (hasAnyTrans) {
                                setSelectedGenders(
                                  selectedGenders.filter((g) => !['trans_woman', 'trans_man', 'non_binary'].includes(g))
                                );
                              } else {
                                setSelectedGenders([...selectedGenders, 'trans_woman', 'trans_man', 'non_binary']);
                              }
                            } else {
                              toggleGender(item.id);
                            }
                          }}
                          className={
                            'py-1.5 px-3 rounded-full border text-xs font-semibold transition cursor-pointer active:scale-95 ' +
                            (isSelected ? 'bg-[#6555B8] text-white border-[#6555B8]' : 'bg-white text-[#1C1924] border-[#DDD7E5]')
                          }
                        >
                          {item.label}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
              <div className="px-4 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] bg-white border-t border-[#DDD7E5] flex items-center gap-3 shrink-0">
                <button
                  type="button"
                  onClick={resetFilters}
                  className="py-2 px-3 rounded-full text-xs font-semibold text-[#524B5E] hover:text-[#1C1924] cursor-pointer"
                >
                  Reset
                </button>
                <button
                  type="button"
                  onClick={applyFilters}
                  className="flex-1 py-2.5 rounded-full bg-[#6555B8] text-white text-xs font-semibold hover:bg-[#52449e] cursor-pointer"
                >
                  Apply Filters
                </button>
              </div>
            </div>
          </div>,
          document.body
        )}

      {matchedModalProfile && (
        <div
          onClick={closeModalWithAnimation}
          className={
            'fixed inset-0 z-[999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm transition-opacity duration-200 ' +
            (isModalClosing ? 'opacity-0 pointer-events-none' : 'opacity-100')
          }
        >
          <div
            role="dialog"
            aria-modal="true"
            onClick={(e) => e.stopPropagation()}
            className={
              'w-full max-w-sm rounded-3xl bg-white border border-[#DDD7E5]/70 p-6 shadow-2xl flex flex-col items-center text-center transform transition-all duration-200 ' +
              (isModalClosing ? 'scale-90 opacity-0' : 'scale-100 opacity-100')
            }
          >
            <div className="w-12 h-12 rounded-full bg-rose-50 flex items-center justify-center mb-3">
              <Heart className="w-6 h-6 text-rose-500 fill-rose-500" />
            </div>
            <h3 className="text-xl font-bold text-[#1C1924]" style={{ fontFamily: 'var(--font-brand)' }}>
              It&apos;s a Match!
            </h3>
            <p className="text-xs text-[#6C637B] mt-1.5">You and <span className="font-semibold text-[#1C1924]">{matchedModalProfile.name}</span> connected.</p>
            <div className="my-5 w-20 h-20 rounded-full border-4 border-[#6555B8]/20 overflow-hidden shadow-md">
              <img src={matchedModalProfile.avatarUrl || '/placeholder-avatar.svg'} alt="" className="w-full h-full object-cover" />
            </div>
            <div className="w-full flex flex-col gap-2 mt-1">
              <Link
                href={'/chat/' + matchedModalProfile.id}
                className="w-full py-3 px-4 rounded-full bg-[#6555B8] hover:bg-[#52449e] text-white text-xs font-semibold shadow-md transition flex items-center justify-center gap-2"
              >
                Say Hello
              </Link>
              <button
                type="button"
                onClick={closeModalWithAnimation}
                className="w-full py-2.5 px-4 rounded-full text-xs font-semibold text-[#6C637B] hover:text-[#1C1924] hover:bg-[#F3EFFC] transition cursor-pointer"
              >
                Keep Browsing
              </button>
            </div>
          </div>
        </div>
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
    supabase.auth.getUser().then(({ data }) => {
      if (!mounted) return;
      if (data?.user) setAuthState('member');
      else router.replace('/');
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