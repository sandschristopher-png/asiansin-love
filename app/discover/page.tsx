'use client';

import { playMatchChime } from '@/lib/sound';
import { getDistanceLabel } from '@/lib/location';
import React, { useState, useEffect, useMemo, useRef, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
import {
  X,
  ChevronLeft,
  ChevronRight,
  Search,
  Heart,
  X as XIcon,
  Star,
  MapPin,
  ShieldCheck,
  CheckCircle,
  SlidersHorizontal,
  RotateCcw,
  Loader2,
  Check,
  ChevronDown
} from 'lucide-react';
import { supabase } from '@/lib/supabase/client';
import { ActionType, getLocalCardActions, persistCardAction } from '@/lib/interactions';

const DISCOVERY_MODES = [
  { id: 'all', label: 'All' },
  { id: 'marriage', label: '💍 Marriage' },
  { id: 'verified', label: '🛡️ Verified' },
  { id: 'new', label: '✨ New' },
] as const;
type DiscoveryModeId = (typeof DISCOVERY_MODES)[number]['id'];

export interface ProfileItem {
  id: string;
  username?: string;
  name: string;
  age: number;
  gender: 'woman' | 'man' | 'trans_woman' | 'trans_man' | 'non_binary';
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
  online: boolean;
  recentlyActive?: boolean;
}

function DiscoverCardPhotoCarousel({
  profileId,
  photos,
  avatarUrl,
  name,
  repScore,
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
    <div className="relative block aspect-[4/5] w-full overflow-hidden bg-[#F2EEF7] select-none">
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

      <div
        className={
          'absolute ' +
          (hasMultiple ? 'top-4.5' : 'top-2.5') +
          ' inset-x-2.5 flex items-center justify-between z-20 pointer-events-none'
        }
      >
        <div className="flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-black/45 backdrop-blur-md border border-white/20 text-[10px] font-bold text-amber-300 shadow-xs">
          <ShieldCheck className="w-3 h-3 text-amber-300 shrink-0" />
          <span>{repScore ? repScore + '% Rep' : '100% Rep'}</span>
        </div>

        {online ? (
          <span className="presence-dot h-2.5 w-2.5 rounded-full bg-emerald-500 ring-2 ring-white/90 shadow-xs" />
        ) : recentlyActive ? (
          <span className="h-2 w-2 rounded-full bg-amber-400/90 ring-1.5 ring-white/80 shadow-xs" />
        ) : null}
      </div>

      {/* Split-Touch Photo Carousel Zones (left half = prev photo, right half = next photo) */}
      {hasMultiple && (
        <>
          <div
            onClick={handlePrev}
            className="absolute top-0 bottom-16 left-0 w-1/2 z-10 cursor-pointer"
            aria-label="Previous photo"
          />
          <div
            onClick={handleNext}
            className="absolute top-0 bottom-16 right-0 w-1/2 z-10 cursor-pointer"
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

function normalizeGenderValue(raw?: string | null): 'woman' | 'man' | 'trans_woman' | 'trans_man' | 'non_binary' {
  const val = (raw || '').toLowerCase().trim();
  if (val === 'man' || val === 'male' || val === 'men') return 'man';
  if (val === 'woman' || val === 'female' || val === 'women') return 'woman';
  if (val === 'trans_woman' || val === 'trans_women' || val === 'trans woman' || val === 'trans') return 'trans_woman';
  if (val === 'trans_man' || val === 'trans_men' || val === 'trans man') return 'trans_man';
  if (val === 'non_binary' || val === 'non-binary' || val === 'nonbinary') return 'non_binary';
  return 'woman';
}

function normalizeInterestedInList(raw: unknown): string[] {
  if (Array.isArray(raw)) {
    return raw.map((item) => normalizeGenderValue(String(item)));
  }
  if (typeof raw === 'string' && raw.trim()) {
    if (raw.toLowerCase().trim() === 'everyone') {
      return ['man', 'woman', 'trans_woman', 'trans_man', 'non_binary'];
    }
    return raw.split(',').map((s) => normalizeGenderValue(s));
  }
  return [];
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
    return !isNaN(val) && val >= 18 && val <= 65 ? val : 18;
  });
  const [maxAge, setMaxAge] = useState<number>(() => {
    const val = Number(searchParams.get('maxAge'));
    return !isNaN(val) && val >= 18 && val <= 65 ? val : 65;
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
        const { data: { user } } = await supabase.auth.getUser();
        const blockedUserIds = new Set<string>();
        let userInterestedIn: string[] = [];

        if (user) {
          const [profileRes, blocksRes, favsRes] = await Promise.all([
            supabase
              .from('profiles')
              .select('latitude, longitude, gender, country, interested_in, seeking_gender, onboarding_completed')
              .eq('id', user.id)
              .maybeSingle(),
            supabase
              .from('user_blocks')
              .select('blocker_id, blocked_id')
              .or('blocker_id.eq.' + user.id + ',blocked_id.eq.' + user.id),
            supabase
              .from('favorites')
              .select('favorite_profile_id')
              .eq('user_id', user.id),
          ]);

          const userProfile = profileRes.data;
          if (userProfile) {
            if (!userProfile.onboarding_completed) {
              router.push('/onboarding');
              return;
            }
            if (userProfile.latitude && userProfile.longitude) {
              setCurrentUserCoords({ lat: userProfile.latitude, lon: userProfile.longitude });
            }
            userInterestedIn = normalizeInterestedInList(
              userProfile.interested_in && userProfile.interested_in.length > 0
                ? userProfile.interested_in
                : userProfile.seeking_gender
            );
            if (!userSelectedGenderManually.current && userInterestedIn.length > 0) {
              setSelectedGenders(userInterestedIn);
            }
          }

          blocksRes.data?.forEach((b: any) => {
            if (b.blocker_id === user.id) blockedUserIds.add(b.blocked_id);
            if (b.blocked_id === user.id) blockedUserIds.add(b.blocker_id);
          });

          if (favsRes.data) {
            setCardActions((prev) => {
              const merged = { ...prev };
              favsRes.data.forEach((fav: { favorite_profile_id: string }) => {
                merged[fav.favorite_profile_id] = 'like';
              });
              return merged;
            });
          }
        }

        let query = supabase
          .from('profiles')
          .select('id, display_name, full_name, username, age, birthdate, gender, city, country, avatar_url, photos, is_verified, is_plus, reputation_score, last_active, relationship_intent, looking_for, occupation, bio, languages, height, weight, latitude, longitude, location_source, created_at')
          .eq('onboarding_completed', true)
          .order('created_at', { ascending: false })
          .limit(150);

        if (user) {
          query = query.neq('id', user.id);
        }

        const { data, error } = await query;

        if (error) {
          console.error('Error fetching profiles:', error.message);
          setProfiles([]);
          return;
        }

        const items: ProfileItem[] = (data || [])
          .filter((row: any) => {
            if (user && row.id === user.id) return false;
            if (blockedUserIds.has(row.id)) return false;
            return true;
          })
          .map((row: any) => {
            const countryVal = row.country || 'Philippines';
            const cityVal = row.city ? row.city + ', ' + countryVal : countryVal;
            const normGender = normalizeGenderValue(row.gender);

            let computedAge = row.age;
            if (!computedAge && row.birthdate) {
              const dob = new Date(row.birthdate);
              computedAge = Math.max(18, Math.floor((Date.now() - dob.getTime()) / (1000 * 60 * 60 * 24 * 365.25)));
            }

            const cleanName =
              (row.username && !row.username.startsWith('user_') ? row.username.replace(/^@/, '') : '') ||
              row.display_name ||
              row.full_name ||
              'Member';

            return {
              id: row.id,
              username: row.username,
              name: cleanName,
              age: computedAge || 25,
              gender: normGender,
              location: cityVal,
              country: countryVal,
              avatarUrl: row.avatar_url || '/placeholder-avatar.svg',
              photos: Array.isArray(row.photos) && row.photos.length > 0 ? row.photos : [row.avatar_url || '/placeholder-avatar.svg'],
              repScore: row.reputation_score ?? 100,
              verified: Boolean(row.is_verified),
              is_plus: Boolean(row.is_plus),
              latitude: row.latitude,
              longitude: row.longitude,
              location_source: row.location_source,
              online: Boolean(row.last_active && Date.now() - new Date(row.last_active).getTime() < 1000 * 60 * 15),
              intent: row.relationship_intent || 'Marriage',
              looking_for: row.looking_for,
              bio: row.bio,
              occupation: row.occupation,
              languages: row.languages,
              height: row.height,
              weight: row.weight,
              created_at: row.created_at,
            };
          });

        items.sort((a, b) => (b.is_plus ? 1 : 0) - (a.is_plus ? 1 : 0));
        setProfiles(items);
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

    if ((action === 'like' || action === 'star') && !isCurrentlyActive) {
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
    if (selectedGenders.length > 0) count++;
    if (minAge > 18 || maxAge < 65) count++;
    if (selectedIntent !== 'All') count++;
    if (verifiedOnly) count++;
    if (activeNowOnly) count++;
    return count;
  }, [selectedGenders, minAge, maxAge, selectedIntent, verifiedOnly, activeNowOnly]);

  const applyFilters = () => {
    setMinAge(draftMinAge);
    setMaxAge(draftMaxAge);
    setFiltersOpen(false);
  };

  const resetFilters = () => {
    setDiscoveryMode('all');
    setSelectedGenders([]);
    setSelectedCountry('All');
    setSearchQuery('');
    setMinAge(18);
    setMaxAge(65);
    setSelectedIntent('All');
    setVerifiedOnly(false);
    setActiveNowOnly(false);
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
        if (discoveryMode === 'marriage') {
          const intentStr = ((profile.intent || '') + ' ' + (profile.looking_for || '')).toLowerCase();
          return intentStr.includes('marriage') || intentStr.includes('serious');
        }
        if (discoveryMode === 'verified') return Boolean(profile.verified);
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
  ]);

  const visibleProfiles = filteredProfiles.slice(0, visibleLimit);
  const hasMore = visibleLimit < filteredProfiles.length;

  return (
    <div className="w-full min-h-full bg-[#FAFAFD] text-[#1C1924] flex flex-col">
      <main className="w-full px-3.5 sm:px-4 pt-3 pb-24 space-y-3.5">
        
        {/* Top Control Bar */}
        <section aria-label="Search and Filters" className="w-full space-y-3">
          <div className="w-full bg-white border border-[#E5E1EC] hover:border-[#CFC8DC] focus-within:border-[#6555b8] focus-within:ring-2 focus-within:ring-[#6555b8]/15 rounded-full shadow-[0_1px_3px_rgba(28,25,36,0.03)] transition-all flex items-center pl-3.5 pr-1.5 py-1">
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
              className="relative p-1.5 rounded-full text-[#6555b8] hover:bg-[#F3EFFC] transition shrink-0 ml-1"
            >
              <SlidersHorizontal className="w-4 h-4" />
              {activeFiltersCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 w-3.5 h-3.5 bg-[#6555b8] text-white text-[9px] font-medium rounded-full flex items-center justify-center">
                  {activeFiltersCount}
                </span>
              )}
            </button>
          </div>

          <div className="relative z-30 flex items-center justify-between gap-2 w-full py-1 select-none">
            <div
              ref={pillTrackRef}
              onMouseDown={handlePillMouseDown}
              onMouseLeave={handlePillMouseUp}
              onMouseUp={handlePillMouseUp}
              onMouseMove={handlePillMouseMove}
              onWheel={handlePillWheel}
              className="cursor-grab active:cursor-grabbing select-none flex-1 min-w-0 overflow-x-auto no-scrollbar touch-pan-x"
            >
              <div className="flex items-center gap-1.5 w-max px-0.5">
                <div className="flex items-center gap-1 shrink-0 pr-2 mr-1 border-r border-[#E5E1EC]">
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
                          'px-3.5 py-1 text-xs font-semibold rounded-full transition-all whitespace-nowrap active:scale-95 ' +
                          (active
                            ? 'bg-[#6555b8] text-white shadow-xs'
                            : 'bg-[#F2EEF7] text-[#524B5E] hover:bg-[#E9E4F0] hover:text-[#1C1924]')
                        }
                      >
                        {mode.label}
                      </button>
                    );
                  })}
                </div>

                {[
                  { id: 'All', label: 'All' },
                  { id: 'Philippines', label: 'Philippines' },
                  { id: 'Thailand', label: 'Thailand' },
                  { id: 'Vietnam', label: 'Vietnam' },
                ].map(({ id, label }) => {
                  const active = selectedCountry.toLowerCase() === id.toLowerCase();
                  return (
                    <button
                      key={id}
                      type="button"
                      onClick={() => {
                        if (!pillDraggedRef.current) setSelectedCountry(id);
                      }}
                      className={
                        'shrink-0 px-3.5 py-1 text-xs font-semibold rounded-full transition-all whitespace-nowrap active:scale-95 ' +
                        (active
                          ? 'bg-[#6555b8] text-white shadow-xs'
                          : 'bg-[#F3EFFC] text-[#524B5E] hover:bg-[#EBE4F7] hover:text-[#1C1924]')
                      }
                    >
                      {label}
                    </button>
                  );
                })}
              </div>
            </div>

            <div ref={countryDropdownRef} className="relative shrink-0">
              <button
                type="button"
                onClick={() => setIsCountryOpen((prev) => !prev)}
                className={
                  'flex items-center gap-1 shrink-0 px-3.5 py-1 text-xs font-semibold rounded-full transition-all whitespace-nowrap active:scale-95 max-w-[150px] sm:max-w-none ' +
                  (selectedCountry.toLowerCase() !== 'all'
                    ? 'bg-[#6555b8] text-white shadow-sm hover:bg-[#5646a3]'
                    : 'bg-[#F2EEF7] text-[#524B5E] hover:bg-[#E9E4F0] hover:text-[#1C1924]')
                }
              >
                <span className="truncate">{selectedCountry.toLowerCase() === 'all' ? 'Locations' : selectedCountry}</span>
                <ChevronDown className={'w-3 h-3 shrink-0 transition-transform duration-200 ' + (isCountryOpen ? 'rotate-180' : '')} />
              </button>

              {isCountryOpen && (
                <div className="absolute right-0 mt-2 w-64 bg-white border border-[#E5E1EC] rounded-2xl shadow-2xl p-2 z-50 max-h-80 overflow-y-auto space-y-1">
                  {['All', 'Philippines', 'Thailand', 'Vietnam', 'Indonesia', 'Cambodia', 'Malaysia', 'Singapore', 'Laos', 'United States', 'Canada', 'Australia', 'United Kingdom', 'Japan', 'South Korea'].map((cName) => {
                    const active = selectedCountry.toLowerCase() === cName.toLowerCase();
                    return (
                      <button
                        key={cName}
                        type="button"
                        onClick={() => {
                          setSelectedCountry(cName);
                          setIsCountryOpen(false);
                        }}
                        className={
                          'w-full text-left px-3 py-1.5 text-xs rounded-xl flex items-center justify-between transition ' +
                          (active ? 'bg-[#F3EFFC] text-[#6555b8] font-semibold' : 'text-[#524B5E] hover:bg-[#F8F7FA]')
                        }
                      >
                        <span>{cName === 'All' ? 'All Locations (Worldwide)' : cName}</span>
                        {active && <Check className="w-3.5 h-3.5 text-[#6555b8]" />}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </section>

        {/* Discovery Grid: Mobile 2-col, Desktop wider 3-4 col, 4:5 cards */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 w-full">
          {isLoading ? (
            Array.from({ length: 8 }).map((_, i) => (
              <div
                key={i}
                className="rounded-2xl sm:rounded-3xl overflow-hidden aspect-[4/5] w-full bg-[#EAE8F0] animate-pulse border border-[#E5E1EC] relative"
              >
                <div className="absolute inset-x-0 bottom-0 p-3 sm:p-3.5 space-y-2">
                  <div className="h-4 bg-white/40 rounded-full w-2/3" />
                  <div className="h-3 bg-white/30 rounded-full w-1/3" />
                </div>
              </div>
            ))
          ) : (
            visibleProfiles.map((profile) => {
              const state = cardActions[profile.id];
              const isLiked = state === 'like';
              const isStarred = state === 'star';
              const displayName = profile.username || profile.name || 'Member';
              const distanceLabel = currentUserCoords
                ? getDistanceLabel(currentUserCoords.lat, currentUserCoords.lon, profile.latitude, profile.longitude)
                : null;
              const vitalsLine = [
                profile.height ? profile.height.split('(')[0].trim() : null,
                profile.weight ? profile.weight.split('(')[0].trim() : null,
              ].filter(Boolean).join(' • ');

              return (
                <div
                  key={profile.id}
                  className="group relative rounded-2xl sm:rounded-3xl overflow-hidden aspect-[4/5] w-full bg-[#181926] border border-[#E5E1EC]/20 shadow-[0_2px_8px_rgba(28,25,36,0.06)] hover:shadow-[0_12px_32px_rgba(28,25,36,0.16)] transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] hover:-translate-y-1 active:scale-[0.985] select-none"
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

                  <div className="absolute bottom-0 inset-x-0 pt-12 pb-3 px-3 sm:px-3.5 z-20 pointer-events-none bg-gradient-to-t from-black/90 via-black/45 to-transparent flex items-end justify-between gap-2">
                    <Link href={'/profile/' + profile.id} className="min-w-0 flex-1 pointer-events-auto">
                      {Boolean(profile.looking_for || profile.intent) && (
                        <div className="mb-1">
                          <span className="inline-block px-2 py-0.5 rounded-full bg-white/20 backdrop-blur-md text-[9px] font-semibold text-white/95 border border-white/20 truncate max-w-[120px] sm:max-w-none">
                            {profile.looking_for || profile.intent}
                          </span>
                        </div>
                      )}

                      <h3 className="text-sm font-bold text-white flex items-center gap-1.5 drop-shadow-sm leading-tight">
                        <span className="truncate max-w-[110px] sm:max-w-[145px]">
                          {displayName}{profile.age ? ', ' + profile.age : ''}
                        </span>
                        {profile.verified && <CheckCircle className="w-3.5 h-3.5 text-[#B2A4D7] shrink-0" />}
                        {profile.is_plus && (
                          <span className="px-1.5 py-0.5 rounded-full bg-gradient-to-r from-amber-400 to-amber-500 text-slate-950 font-bold text-[9px] uppercase tracking-wider shadow-xs shrink-0 select-none">
                            PLUS
                          </span>
                        )}
                      </h3>

                      <p className="flex items-center gap-1 text-[11px] sm:text-xs text-white/80 font-medium mt-0.5 drop-shadow-sm truncate">
                        <MapPin
                          className={
                            'w-3 h-3 shrink-0 ' +
                            (profile.location_source === 'gps_verified' ? 'text-emerald-400' : 'text-[#B2A4D7]')
                          }
                        />
                        <span className="truncate">
                          {profile.location ? profile.location.split(',')[0] : 'Unknown'}
                          {distanceLabel ? ' • ' + distanceLabel : ''}
                        </span>
                      </p>

                      {vitalsLine && (
                        <p className="text-[10px] text-white/65 font-medium mt-0.5 truncate">
                          {vitalsLine}
                        </p>
                      )}
                    </Link>

                    <div className="flex items-center gap-1.5 shrink-0 pointer-events-auto">
                      <button
                        type="button"
                        aria-label={isStarred ? 'Unstar' : 'Star'}
                        onClick={(e) => {
                          e.stopPropagation();
                          e.preventDefault();
                          triggerAction(profile.id, 'star', displayName, profile.avatarUrl);
                        }}
                        className={
                          'w-8 h-8 rounded-full flex items-center justify-center border transition-all duration-200 active:scale-75 shadow-md backdrop-blur-md select-none cursor-pointer ' +
                          (isStarred
                            ? 'bg-amber-400 border-amber-300 text-slate-950 scale-105'
                            : 'bg-black/35 hover:bg-black/60 border-white/25 text-white/85 hover:text-white')
                        }
                      >
                        <Star className={'w-3.5 h-3.5 ' + (isStarred ? 'fill-slate-950' : '')} />
                      </button>

                      <button
                        type="button"
                        aria-label={isLiked ? 'Unlike' : 'Like'}
                        onClick={(e) => {
                          e.stopPropagation();
                          e.preventDefault();
                          triggerAction(profile.id, 'like', displayName, profile.avatarUrl);
                        }}
                        className={
                          'w-9 h-9 sm:w-10 sm:h-10 rounded-full flex items-center justify-center border transition-all duration-200 ease-[cubic-bezier(0.16,1,0.3,1)] active:scale-75 active:rotate-[-12deg] shadow-lg backdrop-blur-md shrink-0 select-none cursor-pointer ' +
                          (isLiked
                            ? 'bg-[#6555b8] border-[#8b7bd9] text-white shadow-[0_0_20px_rgba(101,85,184,0.55)] scale-105'
                            : 'bg-black/35 hover:bg-black/60 border-white/25 text-white/90 hover:text-white hover:scale-105')
                        }
                      >
                        <Heart
                          className={
                            'w-4 h-4 sm:w-5 sm:h-5 transition-transform duration-300 ease-out ' +
                            (isLiked ? 'fill-white scale-110' : 'hover:scale-110')
                          }
                        />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {!isLoading && filteredProfiles.length === 0 && (
          <div className="py-16 text-center space-y-3">
            <div className="w-12 h-12 mx-auto rounded-full bg-[#F3EFFC] flex items-center justify-center text-[#6555b8]">
              <Search className="w-5 h-5" />
            </div>
            <p className="text-sm font-semibold text-[#1C1924]">No members match your current filters</p>
            <p className="text-xs text-[#756D82] max-w-xs mx-auto">
              Try widening your age, country, or gender preferences to see more profiles.
            </p>
            <button
              type="button"
              onClick={resetFilters}
              className="mt-2 inline-flex items-center px-4 py-2 text-xs font-semibold rounded-full bg-[#6555b8] text-white hover:bg-[#5242a3] transition shadow-xs"
            >
              Reset All Filters
            </button>
          </div>
        )}

        {hasMore && (
          <div className="pt-4 pb-2 flex justify-center">
            <button
              type="button"
              onClick={() => setVisibleLimit((prev) => prev + BATCH_SIZE)}
              className="px-6 py-2.5 rounded-full bg-white border border-[#9a8cc3]/40 text-[#1C1924] hover:border-[#6555b8] text-xs font-semibold transition shadow-sm"
            >
              Load More Profiles ({filteredProfiles.length - visibleLimit} remaining)
            </button>
          </div>
        )}

        {lastPassed && (
          <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 px-4 py-2.5 rounded-full bg-white/95 border border-[#9a8cc3]/40 shadow-2xl backdrop-blur-md">
            <span className="text-xs text-[#1C1924]">Passed <strong>{lastPassed.name}</strong></span>
            <button
              type="button"
              onClick={undoLastPass}
              className="px-3 py-1 rounded-full bg-[#6555b8] hover:bg-[#7D4B9F] text-white text-xs font-semibold flex items-center gap-1 transition shadow-sm"
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
            <div className="flex items-center justify-between p-5 pb-3 border-b border-[#E5E1EC] shrink-0">
              <div className="flex items-center gap-2">
                <SlidersHorizontal className="w-5 h-5 text-[#6555b8]" />
                <h2 className="text-base font-semibold text-[#1C1924]">Refine Discover Feed</h2>
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
                <label className="text-xs font-semibold text-[#756D82] uppercase tracking-wider block mb-2">
                  Interested In
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {[
                    { id: 'woman', label: 'Women' },
                    { id: 'man', label: 'Men' },
                    { id: 'trans_woman', label: 'Trans Women' },
                    { id: 'trans_man', label: 'Trans Men' },
                    { id: 'non_binary', label: 'Non-Binary' },
                  ].map((item) => {
                    const isSelected = selectedGenders.includes(item.id);
                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => toggleGender(item.id)}
                        className={
                          'py-2.5 px-3 rounded-xl border text-xs font-medium transition ' +
                          (isSelected
                            ? 'bg-[#6555b8] text-white border-[#6555b8]'
                            : 'bg-white text-[#1C1924] border-[#E5E1EC] hover:bg-[#FAF8FD]')
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
                  <label className="text-xs font-semibold text-[#756D82] uppercase tracking-wider">Age Range</label>
                  <span className="text-xs font-semibold text-[#6555b8] bg-[#F3EFFC] px-2.5 py-0.5 rounded-full">
                    {draftMinAge} - {draftMaxAge} yrs
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <span className="text-[10px] text-[#756D82] block mb-1">Min Age ({draftMinAge})</span>
                    <input
                      type="range"
                      min={18}
                      max={65}
                      value={draftMinAge}
                      onChange={(e) => setDraftMinAge(Math.min(Number(e.target.value), draftMaxAge - 1))}
                      className="w-full accent-[#6555b8]"
                    />
                  </div>
                  <div>
                    <span className="text-[10px] text-[#756D82] block mb-1">Max Age ({draftMaxAge})</span>
                    <input
                      type="range"
                      min={18}
                      max={65}
                      value={draftMaxAge}
                      onChange={(e) => setDraftMaxAge(Math.max(Number(e.target.value), draftMinAge + 1))}
                      className="w-full accent-[#6555b8]"
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-3 pt-1 border-t border-[#E5E1EC]/60">
                <label className="flex items-center justify-between cursor-pointer py-1">
                  <span className="text-xs font-medium text-[#1C1924]">Verified Members Only</span>
                  <input
                    type="checkbox"
                    checked={verifiedOnly}
                    onChange={(e) => setVerifiedOnly(e.target.checked)}
                    className="sr-only peer"
                  />
                  <span className="w-10 h-6 rounded-full bg-[#E5E1EC] peer-checked:bg-[#6555b8] relative transition">
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
                  <span className="w-10 h-6 rounded-full bg-[#E5E1EC] peer-checked:bg-[#6555b8] relative transition">
                    <span className="absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition peer-checked:translate-x-4" />
                  </span>
                </label>
              </div>
            </div>

            <div className="p-4 bg-white border-t border-[#E5E1EC] flex items-center gap-3 shrink-0">
              <button
                type="button"
                onClick={resetFilters}
                className="flex-1 py-3 rounded-xl border border-[#E5E1EC] text-xs font-semibold text-[#524B5E] hover:bg-[#FAF8FD] transition"
              >
                Reset
              </button>
              <button
                type="button"
                onClick={applyFilters}
                className="flex-1 py-3 rounded-xl bg-[#6555b8] text-white text-xs font-semibold hover:bg-[#5444a6] transition shadow"
              >
                Apply
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

            <h3 className="text-xl font-bold text-[#1C1924] tracking-tight">
              It&apos;s a Match!
            </h3>
            <p className="text-xs text-[#6E6481] mt-1.5 max-w-[240px]">
              You and <span className="font-semibold text-[#1C1924]">{matchedModalProfile.name}</span> connected.
            </p>

            <div className="my-5 relative flex items-center justify-center">
              <div className="w-20 h-20 rounded-full border-4 border-[#6555b8]/20 overflow-hidden shadow-md">
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
                className="w-full py-3 px-4 rounded-full bg-[#6555b8] hover:bg-[#5748a3] text-white text-xs font-semibold shadow-md transition flex items-center justify-center gap-2"
              >
                Say Hello
              </Link>
              <button
                type="button"
                onClick={closeModalWithAnimation}
                className="w-full py-2.5 px-4 rounded-full text-xs font-semibold text-[#6E6481] hover:text-[#1C1924] hover:bg-[#F3EFFC] transition"
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

export default function DiscoverPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#FAFAFD] text-[#1C1924] p-8 text-center text-xs">Loading discover feed...</div>}>
      <DiscoverContent />
    </Suspense>
  );
}
