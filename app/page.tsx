'use client';

import { playMatchChime } from '@/lib/sound';
import { getDistanceLabel } from '@/lib/location';
import React, { useState, useEffect, useMemo, useRef, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
import {
  ChevronLeft,
  ChevronRight,
  Search,
  Heart,
  X as XIcon,
  ShieldCheck,
  CheckCircle,
  SlidersHorizontal,
  RotateCcw,
  Check,
  ChevronDown,
  Sparkles
} from 'lucide-react';
import { supabase } from '@/lib/supabase/client';
import { ActionType, getLocalCardActions, persistCardAction } from '@/lib/interactions';
import { HeroLanding } from '@/components/HeroLanding';

const DISCOVERY_MODES = [
  { id: 'all', label: 'All' },
  { id: 'online', label: 'Online' },
  { id: 'near_me', label: 'Near Me' },
  { id: 'new', label: 'New' },
] as const;
type DiscoveryModeId = (typeof DISCOVERY_MODES)[number]['id'];

const COUNTRY_FLAGS: Record<string, string> = {
  philippines: '🇵🇭',
  thailand: '🇹🇭',
  vietnam: '🇻🇳',
  indonesia: '🇮🇩',
  cambodia: '🇰🇭',
  malaysia: '🇲🇾',
  singapore: '🇸🇬',
  laos: '🇱🇦',
  myanmar: '🇲🇲',
  'united states': '🇺🇸',
  canada: '🇨🇦',
  australia: '🇦🇺',
  'united kingdom': '🇬🇧',
  japan: '🇯🇵',
  'south korea': '🇰🇷',
  taiwan: '🇹🇼',
  'hong kong': '🇭🇰',
  'united arab emirates': '🇦🇪',
  'new zealand': '🇳🇿',
};

function getCountryFlag(country?: string): string {
  if (!country) return '🌏';
  return COUNTRY_FLAGS[country.toLowerCase().trim()] || '🌏';
}

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
  gender: 'female' | 'male' | 'female' | 'male' | 'male';
  location: string;
  latitude?: number | null;
  longitude?: number | null;
  location_source?: 'gps_verified' | 'self_reported' | null;
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
  bio?: string;
  occupation?: string;
  languages?: string | string[];
  interests?: string[];
  height?: string;
  weight?: string;
  created_at?: string;
}

interface DiscoverCardPhotoCarouselProps {
  profileId: string;
  photos?: string[];
  avatarUrl: string;
  name: string;
  repScore: number;
  sharedCount: number;
  online: boolean;
  recentlyActive?: boolean;
}

function DiscoverCardPhotoCarousel({
  profileId,
  photos,
  avatarUrl,
  name,
  repScore,
  sharedCount,
  online,
  recentlyActive,
}: DiscoverCardPhotoCarouselProps) {
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

      {hasMultiple && (
        <div className="absolute top-2 inset-x-2.5 z-20 flex gap-1 pointer-events-none">
          {displayPhotos.map((_, i) => (
            <div
              key={i}
              className={
                'h-1 flex-1 rounded-full transition-all duration-200 ' +
                (i === currentIdx ? 'bg-white shadow-xs' : 'bg-white/35 backdrop-blur-xs')
              }
            />
          ))}
        </div>
      )}

      {/* Fixed Top-Left Consistent Reputation Pill */}
      <div
        className={
          'absolute ' +
          (hasMultiple ? 'top-4' : 'top-2.5') +
          ' left-2.5 flex items-center gap-1.5 z-20 pointer-events-none'
        }
      >
        <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-black/50 backdrop-blur-xs text-[10px] font-medium text-white">
          <span>{repScore ? repScore + '% Rep' : '100% Rep'}</span>
        </div>

        {online ? (
          <span className="presence-dot h-2 w-2 rounded-full bg-emerald-500 ring-2 ring-white/90 shadow-xs shrink-0" />
        ) : recentlyActive ? (
          <span className="h-2 w-2 rounded-full bg-amber-400 ring-1.5 ring-white/80 shadow-xs shrink-0" />
        ) : null}
      </div>

      {/* Split-Touch Photo Carousel Zones */}
      {hasMultiple && (
        <>
          <div
            onClick={handlePrev}
            className="absolute top-12 bottom-20 left-0 w-1/2 z-10 cursor-pointer"
            aria-label="Previous photo"
          />
          <div
            onClick={handleNext}
            className="absolute top-12 bottom-20 right-0 w-1/2 z-10 cursor-pointer"
            aria-label="Next photo"
          />
        </>
      )}

      {hasMultiple && (
        <div className="hidden sm:flex items-center justify-between absolute inset-x-2 top-1/2 -translate-y-1/2 z-20 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-200">
          <button
            type="button"
            onClick={handlePrev}
            className="pointer-events-auto p-1.5 rounded-full bg-black/40 hover:bg-black/70 text-white backdrop-blur-xs transition active:scale-90"
            aria-label="Previous photo"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={handleNext}
            className="pointer-events-auto p-1.5 rounded-full bg-black/40 hover:bg-black/70 text-white backdrop-blur-xs transition active:scale-90"
            aria-label="Next photo"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
}

function normalizeGenderValue(raw?: string | null): 'female' | 'male' | 'female' | 'male' | 'male' {
  const val = String(raw || '').toLowerCase().trim().replace(/[\s-]+/g, '_');
  if (['male', 'male', 'male', 'm', 'guy', 'guys'].includes(val)) return 'male';
  if (['female', 'female', 'female', 'f', 'lady', 'ladies', 'girl', 'girls'].includes(val)) return 'female';
  if (['female', 'female', 'transgender_woman', 'transgender_women', 'male', 'mtf', 'transfemale'].includes(val)) return 'female';
  if (['male', 'male', 'transgender_man', 'transgender_men', 'ftm', 'transmale'].includes(val)) return 'male';
  if (['male', 'nonbinary', 'nb', 'enby'].includes(val)) return 'male';
  return 'female';
}

function formatConciseIntent(raw?: string | null): string {
  if (!raw) return 'Serious Relationship';
  const cleaned = raw.trim();
  if (cleaned.length <= 24) return cleaned;
  const lower = cleaned.toLowerCase();
  if (lower.includes('marriage') && lower.includes('kids')) return 'Marriage & Kids';
  if (lower.includes('marriage')) return 'Marriage-Minded';
  if (lower.includes('serious') || lower.includes('long-term') || lower.includes('long term')) return 'Long-Term Partner';
  if (lower.includes('life partner')) return 'Life Partner';
  const words = cleaned.split(/\s+/);
  let acc = '';
  for (const w of words) {
    if ((acc + ' ' + w).trim().length > 24) break;
    acc = (acc + ' ' + w).trim();
  }
  return acc || cleaned.slice(0, 22);
}

function DiscoverContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [discoveryMode, setDiscoveryMode] = useState<DiscoveryModeId>('all');

  const pillTrackRef = useRef<HTMLDivElement>(null);
  const pillIsDraggingRef = useRef(false);
  const pillStartXRef = useRef(0);
  const pillScrollLeftRef = useRef(0);
  const pillDraggedRef = useRef(false);

  const handlePillMouseDown = (e: React.MouseEvent) => {
    const slider = pillTrackRef.current;
    if (!slider) return;
    pillIsDraggingRef.current = true;
    pillDraggedRef.current = false;
    pillStartXRef.current = e.pageX - slider.offsetLeft;
    pillScrollLeftRef.current = slider.scrollLeft;
  };

  const handlePillMouseMove = (e: React.MouseEvent) => {
    if (!pillIsDraggingRef.current || !pillTrackRef.current) return;
    e.preventDefault();
    const slider = pillTrackRef.current;
    const x = e.pageX - slider.offsetLeft;
    const walk = (x - pillStartXRef.current) * 1.3;
    if (Math.abs(walk) > 4) {
      pillDraggedRef.current = true;
    }
    slider.scrollLeft = pillScrollLeftRef.current - walk;
  };

  const handlePillMouseUp = () => {
    pillIsDraggingRef.current = false;
    setTimeout(() => {
      pillDraggedRef.current = false;
    }, 60);
  };

  const handlePillWheel = (e: React.WheelEvent) => {
    const slider = pillTrackRef.current;
    if (!slider) return;
    if (e.deltaY !== 0) {
      slider.scrollLeft += e.deltaY;
    }
  };

  const [currentUserCoords, setCurrentUserCoords] = useState<{ lat: number; lon: number } | null>(null);
  const [viewerInterests, setViewerInterests] = useState<string[]>([]);
  const [viewerIntent, setViewerIntent] = useState<string>('');
  const [viewerSavedGenders, setViewerSavedGenders] = useState<string[]>([]);
  const [profiles, setProfiles] = useState<ProfileItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [searchQuery, setSearchQuery] = useState(() => searchParams.get('q') || '');
  const [selectedCountry, setSelectedCountry] = useState(() => {
    const c = searchParams.get('country');
    return c && c.toLowerCase() !== 'all' ? c : 'All';
  });

  const userSelectedGenderManually = useRef(Boolean(searchParams.get('gender')));
  const [selectedGenders, setSelectedGenders] = useState<string[]>(() => {
    const g = searchParams.get('gender');
    if (!g || g.toLowerCase() === 'all') return [];
    return g.split(',').map((s) => normalizeGenderValue(s));
  });

  const toggleGender = (gender: string) => {
    userSelectedGenderManually.current = true;
    setSelectedGenders((prev) =>
      prev.includes(gender) ? prev.filter((g) => g !== gender) : [...prev, gender]
    );
  };

  const [filtersOpen, setFiltersOpen] = useState(false);
  const [isCountryOpen, setIsCountryOpen] = useState(false);
  const countryDropdownRef = useRef<HTMLDivElement | null>(null);

  const [minAge, setMinAge] = useState<number>(() => {
    const val = Number(searchParams.get('minAge'));
    return !isNaN(val) && val >= 18 && val <= 80 ? val : 18;
  });
  const [maxAge, setMaxAge] = useState<number>(() => {
    const val = Number(searchParams.get('maxAge'));
    return !isNaN(val) && val >= 18 && val <= 80 ? val : 65;
  });
  const [draftMinAge, setDraftMinAge] = useState<number>(minAge);
  const [draftMaxAge, setDraftMaxAge] = useState<number>(maxAge);

  const [selectedIntent, setSelectedIntent] = useState<string>(() => searchParams.get('intent') || 'All');
  const [verifiedOnly, setVerifiedOnly] = useState<boolean>(() => searchParams.get('verified') === 'true');
  const [activeNowOnly, setActiveNowOnly] = useState<boolean>(() => searchParams.get('active') === 'true');

  const [matchedModalProfile, setMatchedModalProfile] = useState<{ id: string; name: string; avatarUrl?: string } | null>(null);
  const [isModalClosing, setIsModalClosing] = useState(false);
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
    function handleClickOutside(event: MouseEvent) {
      if (countryDropdownRef.current && !countryDropdownRef.current.contains(event.target as Node)) {
        setIsCountryOpen(false);
      }
    }
    if (isCountryOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isCountryOpen]);

  useEffect(() => {
    const handleMutualMatch = (e: CustomEvent<{ targetId: string }>) => {
      const target = profiles.find((p) => p.id === e.detail.targetId);
      if (target) {
        playMatchChime();
        setMatchedModalProfile({
          id: target.id,
          name: target.name,
          avatarUrl: target.avatarUrl,
        });
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
              router.push('/onboarding/profile');
              return;
            }
            if (v.latitude && v.longitude) {
              setCurrentUserCoords({ lat: v.latitude, lon: v.longitude });
            }
            if (Array.isArray(v.interests)) {
              setViewerInterests(v.interests);
            }
            if (v.intent) {
              setViewerIntent(v.intent);
            }
            if (Array.isArray(v.interested_in) && v.interested_in.length > 0) {
              setViewerSavedGenders(v.interested_in);
              if (!userSelectedGenderManually.current) {
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

  const computeSharedCount = (profile: ProfileItem): number => {
    let count = 0;
    if (viewerInterests.length > 0 && Array.isArray(profile.interests)) {
      const viewerSet = new Set(viewerInterests.map((i) => i.toLowerCase()));
      profile.interests.forEach((tag) => {
        if (viewerSet.has(tag.toLowerCase())) count++;
      });
    }
    if (viewerIntent && profile.intent && viewerIntent.toLowerCase() === profile.intent.toLowerCase()) {
      count++;
    }
    return count;
  };

  const closeModalWithAnimation = () => {
    setIsModalClosing(true);
    setTimeout(() => {
      setMatchedModalProfile(null);
      setIsModalClosing(false);
    }, 220);
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
          setMatchedModalProfile({
            id,
            name: name || 'Member',
            avatarUrl: avatarUrl || '/placeholder-avatar.svg',
          });
        }
      } catch {
        // Non-blocking spark check
      }
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
    setSelectedGenders(viewerSavedGenders.length > 0 ? viewerSavedGenders : []);
    setSelectedCountry('All');
    setSearchQuery('');
    setMinAge(18);
    setMaxAge(65);
    setDraftMinAge(18);
    setDraftMaxAge(65);
    setSelectedIntent('All');
    setVerifiedOnly(false);
    setActiveNowOnly(false);
    if (typeof window !== 'undefined') {
      try {
        localStorage.removeItem('ail_passed_ids');
      } catch {}
    }
    setCardActions((prev) => {
      const cleaned: Record<string, ActionType> = {};
      Object.entries(prev).forEach(([k, v]) => {
        if (v !== 'pass') cleaned[k] = v;
      });
      return cleaned;
    });
  };

  const filteredProfiles = useMemo(() => {
    const base = profiles.filter((profile) => {
      if (cardActions[profile.id] === 'pass') return false;

      const matchesCountry =
        selectedCountry.toLowerCase() === 'all' ||
        (profile.country || '').toLowerCase() === selectedCountry.toLowerCase();

      const matchesGender =
        selectedGenders.length === 0 || selectedGenders.includes(profile.gender);

      const q = searchQuery.toLowerCase().trim();
      const matchesQuery =
        !q ||
        profile.name.toLowerCase().includes(q) ||
        profile.location.toLowerCase().includes(q);

      const matchesAge = profile.age >= minAge && profile.age <= maxAge;
      const matchesIntent =
        selectedIntent === 'All' || !profile.intent || profile.intent === selectedIntent;
      const matchesVerified = !verifiedOnly || profile.verified;
      const matchesOnline = !activeNowOnly || profile.online;

      const matchesDiscoveryMode = (() => {
        if (discoveryMode === 'online') {
          return Boolean(profile.online || profile.recentlyActive);
        }
        if (discoveryMode === 'near_me') {
          if (currentUserCoords && profile.latitude && profile.longitude) {
            const R = 6371;
            const dLat = ((profile.latitude - currentUserCoords.lat) * Math.PI) / 180;
            const dLon = ((profile.longitude - currentUserCoords.lon) * Math.PI) / 180;
            const a =
              Math.sin(dLat / 2) * Math.sin(dLat / 2) +
              Math.cos((currentUserCoords.lat * Math.PI) / 180) *
                Math.cos((profile.latitude * Math.PI) / 180) *
                Math.sin(dLon / 2) *
                Math.sin(dLon / 2);
            const distKm = R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
            return distKm <= 500;
          }
          return true;
        }
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

    if (discoveryMode === 'new') {
      return [...base].sort((a, b) => {
        const tA = a.created_at ? new Date(a.created_at).getTime() : 0;
        const tB = b.created_at ? new Date(b.created_at).getTime() : 0;
        return tB - tA;
      });
    }
    return base;
  }, [
    profiles,
    cardActions,
    selectedCountry,
    selectedGenders,
    searchQuery,
    minAge,
    maxAge,
    selectedIntent,
    verifiedOnly,
    activeNowOnly,
    discoveryMode,
    currentUserCoords,
  ]);

  const visibleProfiles = filteredProfiles.slice(0, visibleLimit);
  const hasMore = visibleLimit < filteredProfiles.length;

  return (
    <div className="w-full min-h-full bg-[#F8F7FA] text-[#1C1924] flex flex-col font-sans">
      <main className="w-full px-4 pt-3.5 pb-36">
        
        {/* Top Control Bar */}
        <section aria-label="Search and Filters" className="w-full">
          {/* Search Bar */}
          <div className="w-full mb-4 bg-white border border-[#DDD7E5] hover:border-[#CFC8DC] focus-within:border-[#6555B8] focus-within:ring-2 focus-within:ring-[#6555B8]/15 rounded-full shadow-2xs transition-all flex items-center pl-3.5 pr-1.5 py-1.5">
            <Search className="w-4 h-4 text-[#8C849B] shrink-0 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search city, username..."
              className="w-full bg-transparent px-2 text-xs sm:text-sm text-[#1C1924] placeholder-[#8C849B] focus:outline-none min-w-0"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="text-[#8C849B] hover:text-[#1C1924] text-xs px-1.5 py-0.5 shrink-0"
              >
                Clear
              </button>
            )}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setFiltersOpen(true);
              }}
              aria-label="Open Filters"
              className="relative p-1.5 rounded-full text-[#6555B8] hover:bg-[#F3EFFC] transition shrink-0 ml-1"
            >
              <SlidersHorizontal className="w-4 h-4" />
              {activeFiltersCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 w-3.5 h-3.5 bg-[#6555B8] text-white text-[9px] font-bold rounded-full flex items-center justify-center">
                  {activeFiltersCount}
                </span>
              )}
            </button>
          </div>

          {/* Simplified Filter Pills Row: All, Online, Near Me, New */}
          <div
            ref={pillTrackRef}
            onMouseDown={handlePillMouseDown}
            onMouseLeave={handlePillMouseUp}
            onMouseUp={handlePillMouseUp}
            onMouseMove={handlePillMouseMove}
            onWheel={handlePillWheel}
            className="w-full mb-4 overflow-x-auto no-scrollbar touch-pan-x select-none"
          >
            <div className="flex items-center gap-2 w-max">
              {DISCOVERY_MODES.map((mode) => {
                const active = discoveryMode === mode.id;
                return (
                  <button
                    key={mode.id}
                    type="button"
                    onClick={() => {
                      if (!pillDraggedRef.current) setDiscoveryMode(mode.id);
                    }}
                    className={
                      'px-3 py-1.5 rounded-full text-xs font-semibold border transition-all whitespace-nowrap active:scale-95 cursor-pointer ' +
                      (active
                        ? 'bg-[#6555B8] border-[#6555B8] text-white'
                        : 'bg-white border-[#DDD7E5] text-[#524B5E] hover:border-[#6555B8]/40 hover:text-[#1C1924]')
                    }
                  >
                    {mode.label}
                  </button>
                );
              })}
            </div>
          </div>
        </section>

        {/* 2-Column Mobile Feed Grid */}
        <div className="grid grid-cols-2 gap-2.5 sm:gap-3 w-full">
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
              const isStarred = false;
              const displayName = profile.username || profile.name || 'Member';
              const sharedCount = computeSharedCount(profile);
              const cityPart = profile.location ? profile.location.split(',')[0].trim() : '';
              const countryPart = profile.country || '';
              const formattedLocation =
                cityPart && countryPart && cityPart.toLowerCase() !== countryPart.toLowerCase()
                  ? `${cityPart}, ${countryPart}`
                  : cityPart || countryPart || 'Unknown';
              const conciseGoal = formatConciseIntent(profile.intent || profile.looking_for);

              return (
                <div
                  key={profile.id}
                  className="group relative rounded-2xl overflow-hidden aspect-[4/5] w-full bg-[#F2EEF7] border border-[#DDD7E5]/60 shadow-xs hover:shadow-md transition-all duration-300 select-none"
                >
                  <DiscoverCardPhotoCarousel
                    profileId={profile.id}
                    photos={profile.photos}
                    avatarUrl={profile.avatarUrl}
                    name={displayName}
                    repScore={profile.repScore}
                    sharedCount={sharedCount}
                    online={profile.online}
                    recentlyActive={profile.recentlyActive}
                  />

                  {/* Top-Right Action Icons (44x44px touch targets, completely clear of bottom text gradient) */}
                  <div className="absolute top-2 right-2 z-20 flex flex-col gap-1.5 pointer-events-auto">
                    <button
                      type="button"
                      aria-label={isLiked ? 'Unlike' : 'Like'}
                      onClick={(e) => {
                        e.stopPropagation();
                        e.preventDefault();
                        triggerAction(profile.id, 'like', displayName, profile.avatarUrl);
                      }}
                      className={
                        'w-11 h-11 min-w-[44px] min-h-[44px] rounded-full flex items-center justify-center border transition-all duration-200 active:scale-90 backdrop-blur-xs select-none cursor-pointer ' +
                        (isLiked
                          ? 'bg-[#6555B8] border-[#6555B8] text-white shadow-md'
                          : 'bg-black/35 hover:bg-black/55 border-white/25 text-white')
                      }
                    >
                      <Heart className={'w-5 h-5 ' + (isLiked ? 'fill-white' : '')} />
                    </button>

                  </div>

                  {/* Subtle Bottom-Only Gradient with Full-Width Non-Overlapping Text */}
                  <div className="absolute bottom-0 inset-x-0 pt-10 pb-2.5 px-3 z-10 pointer-events-none bg-gradient-to-t from-black/60 via-black/25 to-transparent">
                    <Link href={'/profile/' + profile.id} className="block min-w-0 pointer-events-auto">
                      {/* Line 1: Name + Age + Verified Check */}
                      <div className="flex items-center gap-1 min-w-0">
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
                            , {profile.age}
                          </span>
                        ) : null}
                        {profile.verified && (
                          <CheckCircle className="w-3.5 h-3.5 text-white shrink-0 ml-0.5" />
                        )}
                      </div>

                      {/* Line 2: Location (City, Country) */}
                      <p className="text-[11px] text-white/90 font-medium mt-0.5 truncate">
                        {formattedLocation}
                      </p>

                      {/* Line 3: Single Clean Line for Intent / Relationship Goal */}
                      <p className="text-[10.5px] text-white/80 font-normal mt-0.5 truncate">
                        {conciseGoal}
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
            <p
              className="text-base font-bold text-[#1C1924]"
              style={{ fontFamily: 'var(--font-brand)' }}
            >
              No profiles match your current filters
            </p>
            <p className="text-xs text-[#6C637B] max-w-xs mx-auto leading-relaxed">
              Tap below to reset your filters to your saved preference ({viewerSavedGenders.map((g) => GENDER_LABELS[g] || g).join(', ') || 'All'}), or open Filters to adjust who you are looking for.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-2 pt-2">
              <button
                type="button"
                onClick={resetFilters}
                className="inline-flex items-center gap-1.5 px-5 py-2.5 text-xs font-semibold rounded-full bg-[#6555B8] text-white hover:bg-[#52449e] transition shadow-sm cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset Filters</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  userSelectedGenderManually.current = true;
                  setSelectedGenders([]);
                  setSelectedCountry('All');
                  setDiscoveryMode('all');
                }}
                className="inline-flex items-center gap-1.5 px-5 py-2.5 text-xs font-semibold rounded-full bg-white border border-[#DDD7E5] text-[#524B5E] hover:bg-[#F3EFFC] hover:text-[#6555B8] transition cursor-pointer"
              >
                <span>Show Everyone</span>
              </button>
            </div>
          </div>
        )}

        {hasMore && (
          <div className="pt-4 pb-2 flex justify-center">
            <button
              type="button"
              onClick={() => setVisibleLimit((prev) => prev + BATCH_SIZE)}
              className="px-6 py-2.5 rounded-full bg-white border border-[#DDD7E5] text-[#1C1924] hover:border-[#6555B8] text-xs font-semibold transition shadow-xs"
            >
              Load More Profiles ({filteredProfiles.length - visibleLimit} remaining)
            </button>
          </div>
        )}

        {lastPassed && (
          <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 px-4 py-2.5 rounded-full bg-white/95 border border-[#DDD7E5] shadow-2xl backdrop-blur-md">
            <span className="text-xs text-[#1C1924]">Passed <strong>{lastPassed.name}</strong></span>
            <button
              type="button"
              onClick={undoLastPass}
              className="px-3 py-1 rounded-full bg-[#6555B8] hover:bg-[#52449e] text-white text-xs font-semibold flex items-center gap-1 transition shadow-sm"
            >
              <RotateCcw className="w-3 h-3" />
              Undo
            </button>
          </div>
        )}
      </main>

      {/* Filter Drawer */}
      {filtersOpen && (
        <>
          <div
            className="fixed inset-0 z-[120] bg-black/60 backdrop-blur-sm transition-opacity duration-200"
            onClick={() => setFiltersOpen(false)}
          />
          <div className="fixed inset-x-0 bottom-0 z-[121] w-full max-w-lg mx-auto bg-white rounded-t-3xl shadow-2xl flex flex-col max-h-[85vh] pb-[max(1.5rem,env(safe-area-inset-bottom))]">
            <div className="flex items-center justify-between p-5 pb-3 border-b border-[#DDD7E5] shrink-0">
              <div className="flex items-center gap-2">
                <SlidersHorizontal className="w-5 h-5 text-[#6555B8]" />
                <h2
                  className="text-base font-bold text-[#1C1924]"
                  style={{ fontFamily: 'var(--font-brand)' }}
                >
                  Refine Discover Feed
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setFiltersOpen(false)}
                className="p-1.5 rounded-full text-[#524B5E] hover:bg-[#F3EFFC] transition"
                aria-label="Close filters"
              >
                <XIcon className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-5 py-4 space-y-6">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-semibold text-[#6C637B] uppercase tracking-wider">
                    Interested In
                  </label>
                  {selectedGenders.length > 0 && (
                    <button
                      type="button"
                      onClick={() => {
                        userSelectedGenderManually.current = true;
                        setSelectedGenders([]);
                      }}
                      className="text-[11px] font-semibold text-[#6555B8] hover:underline"
                    >
                      Show Everyone
                    </button>
                  )}
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {[
                    { id: 'female', label: 'Women' },
                    { id: 'male', label: 'Men' },
                    { id: 'female', label: 'Trans Women' },
                    { id: 'male', label: 'Trans Men' },
                    { id: 'male', label: 'Non-Binary' },
                  ].map((item) => {
                    const isSelected = selectedGenders.includes(item.id);
                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => toggleGender(item.id)}
                        className={
                          'py-2.5 px-3 rounded-2xl border text-xs font-semibold transition ' +
                          (isSelected
                            ? 'bg-[#6555B8] text-white border-[#6555B8]'
                            : 'bg-white text-[#1C1924] border-[#DDD7E5] hover:bg-[#F8F7FA]')
                        }
                      >
                        {item.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-semibold text-[#6C637B] uppercase tracking-wider">Age Range</label>
                  <span className="text-xs font-semibold text-[#6555B8] bg-[#F3EFFC] px-2.5 py-0.5 rounded-full">
                    {draftMinAge} - {draftMaxAge} yrs
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <span className="text-[10px] text-[#6C637B] block mb-1">Min Age ({draftMinAge})</span>
                    <input
                      type="range"
                      min={18}
                      max={65}
                      value={draftMinAge}
                      onChange={(e) => setDraftMinAge(Math.min(Number(e.target.value), draftMaxAge - 1))}
                      className="w-full accent-[#6555B8]"
                    />
                  </div>
                  <div>
                    <span className="text-[10px] text-[#6C637B] block mb-1">Max Age ({draftMaxAge})</span>
                    <input
                      type="range"
                      min={18}
                      max={65}
                      value={draftMaxAge}
                      onChange={(e) => setDraftMaxAge(Math.max(Number(e.target.value), draftMinAge + 1))}
                      className="w-full accent-[#6555B8]"
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-3 pt-1 border-t border-[#DDD7E5]/60">
                <label className="flex items-center justify-between cursor-pointer py-1">
                  <span className="text-xs font-medium text-[#1C1924]">Verified Members Only</span>
                  <input
                    type="checkbox"
                    checked={verifiedOnly}
                    onChange={(e) => setVerifiedOnly(e.target.checked)}
                    className="sr-only peer"
                  />
                  <span className="w-10 h-6 rounded-full bg-[#DDD7E5] peer-checked:bg-[#6555B8] relative transition">
                    <span className="absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition peer-checked:translate-x-4" />
                  </span>
                </label>
                <label className="flex items-center justify-between cursor-pointer py-1">
                  <span className="text-xs font-medium text-[#1C1924]">Active Now</span>
                  <input
                    type="checkbox"
                    checked={activeNowOnly}
                    onChange={(e) => setActiveNowOnly(e.target.checked)}
                    className="sr-only peer"
                  />
                  <span className="w-10 h-6 rounded-full bg-[#DDD7E5] peer-checked:bg-[#6555B8] relative transition">
                    <span className="absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition peer-checked:translate-x-4" />
                  </span>
                </label>
              </div>
            </div>

            <div className="p-4 bg-white border-t border-[#DDD7E5] flex items-center gap-3 shrink-0">
              <button
                type="button"
                onClick={resetFilters}
                className="flex-1 py-3 rounded-2xl border border-[#DDD7E5] text-xs font-semibold text-[#524B5E] hover:bg-[#F8F7FA] transition"
              >
                Reset Filters
              </button>
              <button
                type="button"
                onClick={applyFilters}
                className="flex-1 py-3 rounded-2xl bg-[#6555B8] text-white text-xs font-semibold hover:bg-[#52449e] transition shadow"
              >
                Apply Filters
              </button>
            </div>
          </div>
        </>
      )}

      {matchedModalProfile && (
        <div
          onClick={closeModalWithAnimation}
          className={
            'fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm transition-opacity duration-200 ' +
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
            <div className="w-12 h-12 rounded-full bg-rose-50 flex items-center justify-center mb-3 shadow-inner">
              <Heart className="w-6 h-6 text-rose-500 fill-rose-500" />
            </div>

            <h3
              className="text-xl font-bold text-[#1C1924] tracking-tight"
              style={{ fontFamily: 'var(--font-brand)' }}
            >
              It&apos;s a Match!
            </h3>
            <p className="text-xs text-[#6C637B] mt-1.5 max-w-[240px]">
              You and <span className="font-semibold text-[#1C1924]">{matchedModalProfile.name}</span> connected.
            </p>

            <div className="my-5 relative flex items-center justify-center">
              <div className="w-20 h-20 rounded-full border-4 border-[#6555B8]/20 overflow-hidden shadow-md">
                <img
                  src={matchedModalProfile.avatarUrl || '/placeholder-avatar.svg'}
                  alt={matchedModalProfile.name}
                  className="w-full h-full object-cover"
                />
              </div>
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
                className="w-full py-2.5 px-4 rounded-full text-xs font-semibold text-[#6C637B] hover:text-[#1C1924] hover:bg-[#F3EFFC] transition"
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
function HeroGate() {
  const router = useRouter();
  const [authState, setAuthState] = useState<'loading' | 'signedOut' | 'member'>('loading');
  useEffect(() => {
    let mounted = true;
    supabase.auth.getUser().then(({ data }) => {
      if (!mounted) return;
      setAuthState(data?.user ? 'member' : 'signedOut');
    });
    return () => { mounted = false; };
  }, []);

  // Signed-in members get the real feed at /discover - redirect instead of
  // rendering the legacy duplicate feed from this file.
  useEffect(() => {
    if (authState === 'member') router.replace('/discover');
  }, [authState, router]);

  if (authState === 'loading') {
    return (
      <div className="min-h-screen bg-[#F8F7FA] flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-[#6555B8] border-t-transparent"></div>
      </div>
    );
  }

  if (authState === 'signedOut') return <HeroLanding />;
  return null;
}

export default HeroGate;
