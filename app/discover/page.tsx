'use client';

import { getDistanceLabel } from '@/lib/location';

import React, { useState, useEffect, useMemo, useRef, Suspense } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { ChevronLeft, ChevronRight, Search, Heart, X as XIcon, Star, MessageCircle, 
  MapPin, ShieldCheck, CheckCircle, SlidersHorizontal, 
  RotateCcw, Loader2, Check, Globe, ChevronDown } from 'lucide-react';
import { Footer } from '@/components/Footer';
import { supabase } from '@/lib/supabaseClient';
import { ActionType, getLocalCardActions, persistCardAction } from '@/lib/interactions';

const SEA_COUNTRIES = ['Philippines', 'Thailand', 'Vietnam', 'Indonesia', 'Malaysia', 'Singapore', 'Cambodia'];
const WESTERN_COUNTRIES = ['United States', 'Canada', 'Australia', 'United Kingdom', 'Germany'];
const ASIA_HUBS = ['Singapore', 'Japan', 'South Korea', 'Taiwan', 'Hong Kong'];
const SUITOR_COUNTRIES = ['United States', 'Canada', 'Australia', 'United Kingdom', 'Germany', 'Japan', 'South Korea'];

const PRIORITY_ORDER = ['Philippines', 'Thailand', 'Vietnam', 'Laos', 'Cambodia', 'Indonesia'];

const RELATIONSHIP_INTENTS = [
  'All',
  'Marriage',
  'Serious Relationship',
  'Casual Dating',
  'Friendship',
];

export interface ProfileItem {
  username?: string;
  id: string;
  name: string;
  age: number;
  gender: 'woman' | 'man' | 'trans';
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
  online: boolean;
  intent?: string;
  bio?: string;
  occupation?: string;
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

  const displayPhotos = (photos && photos.filter(Boolean).length > 0) ? photos.filter(Boolean) : [avatarUrl || '/placeholder-avatar.svg'];
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
    <div className="relative block aspect-[3/4] w-full overflow-hidden bg-[#F2EEF7] select-none">
      <Link href={'/profile/' + profileId} className="absolute inset-0 z-0">
        <img
          src={displayPhotos[currentIdx]}
          alt={name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          loading="lazy"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#2d2f4c] via-transparent to-transparent opacity-80" />
      </Link>

      {/* Top Badges */}
      <div className="absolute top-2.5 inset-x-2.5 flex items-center justify-between z-20 pointer-events-none">
        {/* Rep Score Badge on Upper Left */}
        <div className="flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-black/45 backdrop-blur-md border border-white/20 text-[10px] font-semibold text-[#E5DEFF] shadow-xs">
          <ShieldCheck className="w-3 h-3 text-[#A78BFA] shrink-0" />
          <span>{repScore || 100}%</span>
        </div>

        {/* Pulsing Online Status on Upper Right */}
        {online && (
          <div className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-black/45 backdrop-blur-md border border-white/20 text-[10px] font-medium text-white shadow-xs">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span className="text-[10px] font-medium text-white">Online</span>
          </div>
        )}
      </div>

      {/* Story Progress Dashes */}
      {hasMultiple && (
        <div className="absolute top-8 inset-x-3 z-20 flex gap-1 pointer-events-none">
          {displayPhotos.map((_, i) => (
            <div
              key={i}
              className={'h-1 flex-1 rounded-full transition-all duration-200 ' + (
                i === currentIdx ? 'bg-white shadow-sm' : 'bg-white/30 backdrop-blur-sm'
              )}
            />
          ))}
        </div>
      )}

      {/* Mobile 50/50 Tap Zones */}
      {hasMultiple && (
        <>
          <div
            onClick={handlePrev}
            className="absolute inset-y-12 left-0 w-1/2 z-10 cursor-pointer"
            aria-label="Previous photo"
          />
          <div
            onClick={handleNext}
            className="absolute inset-y-12 right-0 w-1/2 z-10 cursor-pointer"
            aria-label="Next photo"
          />
        </>
      )}

      {/* Desktop Chevrons on Hover */}
      {hasMultiple && (
        <div className="hidden sm:flex items-center justify-between absolute inset-x-2 top-1/2 -translate-y-1/2 z-20 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            type="button"
            onClick={handlePrev}
            className="pointer-events-auto p-1.5 rounded-full bg-black/50 hover:bg-black/80 text-white backdrop-blur-sm transition"
            aria-label="Previous photo"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={handleNext}
            className="pointer-events-auto p-1.5 rounded-full bg-black/50 hover:bg-black/80 text-white backdrop-blur-sm transition"
            aria-label="Next photo"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
}

function DiscoverContent() {
  const searchParams = useSearchParams();
  const [currentUserCoords, setCurrentUserCoords] = useState<{ lat: number; lon: number } | null>(null);
  const [currentUserProfile, setCurrentUserProfile] = useState<{ gender?: string; country?: string } | null>(null);
  const [profiles, setProfiles] = useState<ProfileItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [searchQuery, setSearchQuery] = useState(() => searchParams.get('q') || '');
  const [selectedCountry, setSelectedCountry] = useState(() => {
    const c = searchParams.get('country');
    return c && c.toLowerCase() !== 'all' ? c : 'All';
  });
  const userSelectedGenderManually = useRef(Boolean(searchParams.get('gender')));
  const [selectedGender, setSelectedGender] = useState<'All' | 'woman' | 'man' | 'trans'>(() => {
    const g = searchParams.get('gender');
    return g && ['All', 'woman', 'man', 'trans'].includes(g) ? (g as any) : 'All';
  });

  const [filtersOpen, setFiltersOpen] = useState(false);
  const [isCountryOpen, setIsCountryOpen] = useState(false);
  const countryDropdownRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (countryDropdownRef.current && !countryDropdownRef.current.contains(event.target as Node)) {
        setIsCountryOpen(false);
      }
    }
    if (isCountryOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isCountryOpen]);
  const [minAge, setMinAge] = useState<number>(() => {
    const val = Number(searchParams.get('minAge'));
    return !isNaN(val) && val >= 18 && val <= 65 ? val : 18;
  });
  const [maxAge, setMaxAge] = useState<number>(() => {
    const val = Number(searchParams.get('maxAge'));
    return !isNaN(val) && val >= 18 && val <= 65 ? val : 65;
  });
  const [selectedIntent, setSelectedIntent] = useState<string>(() => searchParams.get('intent') || 'All');
  const [verifiedOnly, setVerifiedOnly] = useState<boolean>(() => searchParams.get('verified') === 'true');
  const [activeNowOnly, setActiveNowOnly] = useState<boolean>(() => searchParams.get('active') === 'true');

  const [cardActions, setCardActions] = useState<Record<string, ActionType>>({});
  const [lastPassed, setLastPassed] = useState<{ id: string; name: string } | null>(null);

  // Hybrid Infinite Scroll State
  const BATCH_SIZE = 16;
  const [visibleLimit, setVisibleLimit] = useState(BATCH_SIZE);
  const [autoLoadsCount, setAutoLoadsCount] = useState(0);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const sentinelRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const params = new URLSearchParams();

    if (searchQuery.trim()) params.set('q', searchQuery.trim());
    if (selectedCountry.toLowerCase() !== 'all') params.set('country', selectedCountry);
    if (selectedGender !== 'All') params.set('gender', selectedGender);
    if (minAge > 18) params.set('minAge', minAge.toString());
    if (maxAge < 65) params.set('maxAge', maxAge.toString());
    if (selectedIntent !== 'All') params.set('intent', selectedIntent);
    if (verifiedOnly) params.set('verified', 'true');
    if (activeNowOnly) params.set('active', 'true');

    const newQueryString = params.toString();
    const newRelativePathQuery = window.location.pathname + (newQueryString ? `?${newQueryString}` : '');
    window.history.replaceState(null, '', newRelativePathQuery);
  }, [
    searchQuery,
    selectedCountry,
    selectedGender,
    minAge,
    maxAge,
    selectedIntent,
    verifiedOnly,
    activeNowOnly,
  ]);

  const activeFiltersCount = useMemo(() => {
    let count = 0;
    if (minAge > 18 || maxAge < 65) count++;
    if (selectedIntent !== 'All') count++;
    if (verifiedOnly) count++;
    if (activeNowOnly) count++;
    return count;
  }, [minAge, maxAge, selectedIntent, verifiedOnly, activeNowOnly]);

  const resetFilters = () => {
    setSelectedGender('All');
    setSelectedCountry('All');
    setSearchQuery('');
    setMinAge(18);
    setMaxAge(65);
    setSelectedIntent('All');
    setVerifiedOnly(false);
    setActiveNowOnly(false);
  };

  useEffect(() => {
    const local = getLocalCardActions();
    setCardActions(local);

    async function hydrateRemoteFavorites() {
      try {
        const { data: { user } } = await supabase.auth.getUser();
      if (user && !searchParams.get('gender') && !userSelectedGenderManually.current) {
        const { data: p } = await supabase.from('profiles').select('interested_in, seeking_gender').eq('id', user.id).single();
        const seeking = (p?.interested_in || p?.seeking_gender || '').toLowerCase().trim();
        if (seeking === 'men' || seeking === 'man') setSelectedGender('man');
        else if (seeking === 'women' || seeking === 'woman') setSelectedGender('woman');
        else if (seeking === 'trans') setSelectedGender('trans');
      }
        if (!user) return;

        const { data: remoteFavorites, error } = await supabase
          .from('favorites')
          .select('favorite_profile_id')
          .eq('user_id', user.id);

        if (!error && remoteFavorites) {
          setCardActions((prev) => {
            const merged = { ...prev };
            remoteFavorites.forEach((fav: { favorite_profile_id: string }) => {
              if (!merged[fav.favorite_profile_id]) {
                merged[fav.favorite_profile_id] = 'like';
              }
            });
            return merged;
          });
        }
      } catch (err) {
        console.error('Error hydrating favorites:', err);
      }
    }

    hydrateRemoteFavorites();
  }, [supabase]);

  const triggerAction = (id: string, action: ActionType, name?: string) => {
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

    persistCardAction(supabase, id, action, isCurrentlyActive);
  };


  // Reset pagination when active filter criteria change
  useEffect(() => {
    setVisibleLimit(BATCH_SIZE);
    setAutoLoadsCount(0);
  }, [searchQuery, selectedCountry, selectedGender, minAge, maxAge, selectedIntent, verifiedOnly, activeNowOnly]);

  // IntersectionObserver for auto-loading batches
  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) return;

    const observer = new IntersectionObserver((entries) => {
      const first = entries[0];
      if (first.isIntersecting && hasMore && autoLoadsCount < 3 && !isLoadingMore) {
        setIsLoadingMore(true);
        setTimeout(() => {
          setVisibleLimit((prev) => prev + BATCH_SIZE);
          setAutoLoadsCount((prev) => prev + 1);
          setIsLoadingMore(false);
        }, 350);
      }
    }, { rootMargin: '400px' });

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [autoLoadsCount, isLoadingMore]);

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

  useEffect(() => {
    async function loadLiveProfiles() {
        let currentAuthUser: any = null;
        try {
          const { data: { user } } = await supabase.auth.getUser();
          currentAuthUser = user;
          if (user) {
            const { data: userProfile } = await supabase
              .from('profiles')
              .select('latitude, longitude, gender, country')
              .eq('id', user.id)
              .maybeSingle();
            if (userProfile) {
              if (userProfile.latitude && userProfile.longitude) {
                setCurrentUserCoords({ lat: userProfile.latitude, lon: userProfile.longitude });
              }
              setCurrentUserProfile({ gender: userProfile.gender, country: userProfile.country });
            }
          }
        } catch (e) {
          console.warn('Could not load user location for distance calculation', e);
        }
      try {
        // Fetch mutual blocks
        const { data: { user: authUser } } = await supabase.auth.getUser();
        const blockedUserIds = new Set<string>();
        if (authUser) {
          const { data: blocks } = await supabase
            .from('user_blocks')
            .select('blocker_id, blocked_id')
            .or(`blocker_id.eq.${authUser.id},blocked_id.eq.${authUser.id}`);
          blocks?.forEach((b: any) => {
            if (b.blocker_id === authUser.id) blockedUserIds.add(b.blocked_id);
            if (b.blocked_id === authUser.id) blockedUserIds.add(b.blocker_id);
          });
        }

        const { data, error } = await supabase
          .from('profiles')
          .select('id, display_name, full_name, username, age, gender, city, country, avatar_url, photos, is_verified, reputation_score, last_active, intent:relationship_intent, occupation, bio, latitude, longitude, location_source')
          .order('created_at', { ascending: false })
          .limit(120);

        if (error) {
          console.error('Error fetching live profiles:', error);
          return;
        }

        if (data && data.length > 0) {
          const liveItems: ProfileItem[] = data
            .filter((row: any) => !blockedUserIds.has(row.id))
            .map((row: any) => {
            const countryVal = row.country || 'Philippines';
            const cityVal = row.city ? `${row.city}, ${countryVal}` : countryVal;
            const normGender = (row.gender?.toLowerCase() || 'woman') as 'woman' | 'man' | 'trans';
            return {
              id: row.id,
              name: row.username || row.display_name || row.full_name || 'Member',
              age: row.age || 25,
              gender: ['woman', 'man', 'trans'].includes(normGender) ? normGender : 'woman',
              location: cityVal,
              country: countryVal,
              avatarUrl: row.avatar_url || '/placeholder-avatar.svg',
              photos: Array.isArray(row.photos) && row.photos.length > 0 ? row.photos : [row.avatar_url || '/placeholder-avatar.svg'],
              repScore: row.reputation_score || 98,
              verified: Boolean(row.is_verified),
                latitude: row.latitude,
                longitude: row.longitude,
                location_source: row.location_source,
              online: !!(row.last_active && (Date.now() - new Date(row.last_active).getTime() < 1000 * 60 * 15)),
              intent: row.intent || 'Marriage',
              bio: row.bio,
              occupation: row.occupation,
            };
          });

          // Avoid duplicating profiles that exist in remote DB
          const liveIds = new Set(liveItems.map(p => p.id));
          const filteredLiveItems = currentAuthUser ? liveItems.filter(p => p.id !== currentAuthUser.id) : liveItems;
            const existingIds = new Set(filteredLiveItems.map(p => p.id));
            const merged = [...filteredLiveItems, ...DUMMY_BOT_PROFILES.filter(b => !existingIds.has(b.id))];
            setProfiles(merged);
        }
      } catch (err) {
        console.error('Failed to load discovery profiles:', err);
      }
    }

    loadLiveProfiles();
  }, [supabase]);

  const availableCountries = Array.from(new Set(profiles.map((p) => p.country)));

  const isUserInSEA = useMemo(() => {
    if (!currentUserProfile) return false;
    const g = (currentUserProfile.gender || '').toLowerCase();
    const isFemale = g === 'woman' || g === 'female';
    const c = (currentUserProfile.country || '').toLowerCase();
    const seaList = ['philippines', 'thailand', 'vietnam', 'indonesia', 'malaysia', 'singapore', 'cambodia'];
    return isFemale && seaList.includes(c);
  }, [currentUserProfile]);

  const sortedCountries = useMemo(() => {
    if (isUserInSEA) {
      const userHome = currentUserProfile?.country;
      const filteredSuitors = userHome && !SUITOR_COUNTRIES.includes(userHome)
        ? [userHome, ...SUITOR_COUNTRIES]
        : SUITOR_COUNTRIES;
      return ['All', ...filteredSuitors];
    }
    return ['All', ...SEA_COUNTRIES];
  }, [isUserInSEA, currentUserProfile]);

  const filteredProfiles = profiles.filter((profile) => {
    const matchesCountry = selectedCountry.toLowerCase() === 'all' || profile.country.toLowerCase() === selectedCountry.toLowerCase();
    const matchesGender = selectedGender === 'All' || profile.gender.toLowerCase() === selectedGender.toLowerCase();
    const matchesQuery = 
      profile.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      profile.location.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesAge = profile.age >= minAge && profile.age <= maxAge;
    const matchesIntent = selectedIntent === 'All' || !profile.intent || profile.intent === selectedIntent;
    const matchesVerified = !verifiedOnly || profile.verified;
    const matchesOnline = !activeNowOnly || profile.online;

    const isPassed = cardActions[profile.id] === 'pass';
    return !isPassed && matchesCountry && matchesGender && matchesQuery && matchesAge && matchesIntent && matchesVerified && matchesOnline;
  });

  const visibleProfiles = filteredProfiles.slice(0, visibleLimit);
  const hasMore = visibleLimit < filteredProfiles.length;

  return (
    <div className="min-h-screen flex flex-col bg-[#FAFAFD] text-[#1C1924]">
      <main className="flex-1 max-w-5xl mx-auto w-full px-4 sm:px-6 pt-6 pb-32 md:pb-24 space-y-5">
        
        {/* Top Control Bar */}
        <section aria-label="Search and Filters" className="w-full">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3 w-full">
            {/* Left Controls: Gender & Country Selectors */}
            <div className="flex flex-wrap items-center gap-2 shrink-0">
              {/* Gender Segmented Switch */}
              <div className="flex items-center gap-1 p-1 bg-white border border-[#DDD7E5] rounded-full shadow-xs shrink-0">
                {(['All', 'woman', 'trans', 'man'] as const).map((gender) => {
                  const label = gender === 'All' ? 'All' : gender === 'woman' ? 'Women' : gender === 'trans' ? 'Trans' : 'Men';
                  const active = selectedGender === gender;
                  return (
                    <button
                      key={gender}
                      type="button"
                      onClick={() => {
                        userSelectedGenderManually.current = true;
                        setSelectedGender(gender);
                      }}
                      className={'px-3.5 py-1.5 text-xs sm:text-sm font-semibold rounded-full transition-all shrink-0 ' + (
                        active
                          ? 'bg-[#6555b8] text-white shadow-xs'
                          : 'text-[#6C637B] hover:text-[#1C1924] hover:bg-[#F3EFFC]'
                      )}
                    >
                      {label}
                    </button>
                  );
                })}
              </div>

              {/* Country Selector Pill */}
              <div ref={countryDropdownRef} className="relative shrink-0">
                <button
                  type="button"
                  onClick={() => setIsCountryOpen((prev) => !prev)}
                  className={'flex items-center gap-1.5 px-3.5 py-2 text-xs sm:text-sm font-semibold rounded-full border transition-all shadow-xs ' + (
                    selectedCountry.toLowerCase() !== 'all'
                      ? 'bg-[#F3EFFC] border-[#6555b8] text-[#6555b8]'
                      : 'bg-white border-[#DDD7E5] text-[#524B5E] hover:text-[#1C1924] hover:border-[#6555b8]/50'
                  )}
                >
                  <span>{selectedCountry.toLowerCase() === 'all' ? 'All Locations' : selectedCountry}</span>
                  <ChevronDown className={'w-4 h-4 shrink-0 transition-transform duration-200 ' + (isCountryOpen ? 'rotate-180 text-[#6555b8]' : 'text-[#8C849B]')} />
                </button>

                {/* Country Dropdown Menu */}
                {isCountryOpen && (
                  <div className="absolute left-0 mt-2 w-56 bg-white border border-[#E5E1EC] rounded-2xl shadow-xl p-1.5 z-40 max-h-80 overflow-y-auto">
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedCountry('All');
                        setIsCountryOpen(false);
                      }}
                      className={'w-full text-left px-3 py-2 text-xs font-semibold rounded-xl flex items-center justify-between transition ' + (
                        selectedCountry.toLowerCase() === 'all'
                          ? 'bg-[#F3EFFC] text-[#6555b8]'
                          : 'text-[#1C1924] hover:bg-[#F7F6FA]'
                      )}
                    >
                      <span>All Locations</span>
                      {selectedCountry.toLowerCase() === 'all' && <Check className="w-3.5 h-3.5 text-[#6555b8]" />}
                    </button>

                    {(() => {
                      const isSeekingMen = selectedGender === 'man';
                      const sections = isSeekingMen
                        ? [
                            { title: 'Western & Overseas', list: WESTERN_COUNTRIES },
                            { title: 'Asia Hubs', list: ASIA_HUBS },
                            { title: 'Southeast Asia', list: SEA_COUNTRIES },
                          ]
                        : [
                            { title: 'Southeast Asia', list: SEA_COUNTRIES },
                            { title: 'Western & Overseas', list: SUITOR_COUNTRIES },
                          ];

                      const knownLower = new Set([
                        ...WESTERN_COUNTRIES.map(c => c.toLowerCase()),
                        ...ASIA_HUBS.map(c => c.toLowerCase()),
                        ...SEA_COUNTRIES.map(c => c.toLowerCase()),
                        ...SUITOR_COUNTRIES.map(c => c.toLowerCase())
                      ]);

                      const otherCountries = Array.from(new Set(
                        profiles
                          .map(p => p.country)
                          .filter(c => c && !knownLower.has(c.toLowerCase()))
                      )).sort();

                      return (
                        <>
                          {sections.map((section, idx) => (
                            <div key={section.title}>
                              <div className={'px-3 pt-2.5 pb-1 text-[10px] font-bold text-[#8C849B] tracking-wider uppercase ' + (idx > 0 ? 'border-t border-[#F3EFFC] mt-1.5' : '')}>
                                {section.title}
                              </div>
                              {section.list.map((c) => (
                                <button
                                  key={c}
                                  type="button"
                                  onClick={() => {
                                    setSelectedCountry(c);
                                    setIsCountryOpen(false);
                                  }}
                                  className={'w-full text-left px-3 py-1.5 text-xs font-medium rounded-xl flex items-center justify-between transition ' + (
                                    selectedCountry.toLowerCase() === c.toLowerCase()
                                      ? 'bg-[#F3EFFC] text-[#6555b8] font-bold'
                                      : 'text-[#524B5E] hover:bg-[#F7F6FA] hover:text-[#1C1924]'
                                  )}
                                >
                                  <span>{c}</span>
                                  {selectedCountry.toLowerCase() === c.toLowerCase() && (
                                    <Check className="w-3.5 h-3.5 text-[#6555b8]" />
                                  )}
                                </button>
                              ))}
                            </div>
                          ))}

                          {otherCountries.length > 0 && (
                            <div>
                              <div className="px-3 pt-2.5 pb-1 text-[10px] font-bold text-[#8C849B] tracking-wider uppercase border-t border-[#F3EFFC] mt-1.5">
                                Other Regions
                              </div>
                              {otherCountries.map((c) => (
                                <button
                                  key={c}
                                  type="button"
                                  onClick={() => {
                                    setSelectedCountry(c);
                                    setIsCountryOpen(false);
                                  }}
                                  className={'w-full text-left px-3 py-1.5 text-xs font-medium rounded-xl flex items-center justify-between transition ' + (
                                    selectedCountry.toLowerCase() === c.toLowerCase()
                                      ? 'bg-[#F3EFFC] text-[#6555b8] font-bold'
                                      : 'text-[#524B5E] hover:bg-[#F7F6FA] hover:text-[#1C1924]'
                                  )}
                                >
                                  <span>{c}</span>
                                  {selectedCountry.toLowerCase() === c.toLowerCase() && (
                                    <Check className="w-3.5 h-3.5 text-[#6555b8]" />
                                  )}
                                </button>
                              ))}
                            </div>
                          )}
                        </>
                      );
                    })()}
                  </div>
                )}
              </div>
            </div>

            {/* Right Controls: Quick Search + Filters Drawer Button */}
            <div className="flex items-center gap-2 w-full lg:w-auto lg:max-w-md">
              <div className="w-full bg-white border border-[#DDD7E5] hover:border-[#6555b8]/50 focus-within:border-[#6555b8] focus-within:ring-2 focus-within:ring-[#6555b8]/15 rounded-full shadow-xs transition-all flex items-center pl-3.5 pr-1.5 py-1.5">
                <Search className="w-4 h-4 text-[#8C849B] shrink-0 pointer-events-none" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search city, name..."
                  className="w-full bg-transparent px-2.5 text-xs sm:text-sm text-[#1C1924] placeholder-[#8C849B] focus:outline-none min-w-0"
                />
                <div className="h-5 w-[1px] bg-[#DDD7E5] shrink-0 mx-1" />
                <button
                  type="button"
                  onClick={() => setFiltersOpen(true)}
                  aria-label="Open Filters"
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold text-[#524B5E] hover:text-[#1C1924] hover:bg-[#F3EFFC] transition shrink-0"
                >
                  <SlidersHorizontal className="w-3.5 h-3.5 text-[#6555b8]" />
                  <span>Filters</span>
                  {activeFiltersCount > 0 && (
                    <span className="w-4 h-4 bg-[#6555b8] text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                      {activeFiltersCount}
                    </span>
                  )}
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* Discovery Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3.5 sm:gap-4 w-full">
          {visibleProfiles.map((profile) => {
            const state = cardActions[profile.id];
            const isLiked = state === 'like';

            return (
              <div
                key={profile.id}
                className="group relative rounded-2xl sm:rounded-3xl overflow-hidden bg-white border border-[#E5E1EC] hover:border-[#6555b8]/35 shadow-xs hover:shadow-lg transition-all duration-200 flex flex-col justify-between"
              >
                {/* Photo Carousel Container */}
                <div className="relative w-full aspect-[4/5] overflow-hidden bg-[#F2EEF7]">
                  <DiscoverCardPhotoCarousel
                    profileId={profile.id}
                    photos={profile.photos}
                    avatarUrl={profile.avatarUrl}
                    name={profile.name}
                    repScore={profile.repScore}
                    online={profile.online}
                    recentlyActive={profile.recentlyActive}
                  />

                  {/* Contrast Gradient for Controls */}
                  <div className="absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-black/65 via-black/25 to-transparent pointer-events-none" />

                  {/* Pairs-Style Action Buttons: Pass (X) & Heart (Like) */}
                  <div className="absolute bottom-3 inset-x-3 flex items-center justify-between z-20 pointer-events-auto">
                    <button
                      type="button"
                      aria-label="Pass"
                      onClick={(e) => {
                        e.stopPropagation();
                        e.preventDefault();
                        triggerAction(profile.id, 'pass', profile.name);
                      }}
                      className="w-10 h-10 sm:w-11 sm:h-11 rounded-full flex items-center justify-center bg-black/45 hover:bg-black/65 text-white backdrop-blur-md border border-white/25 shadow-md transition-all active:scale-90"
                    >
                      <XIcon className="w-5 h-5" />
                    </button>

                    <button
                      type="button"
                      aria-label="Like"
                      onClick={(e) => {
                        e.stopPropagation();
                        e.preventDefault();
                        triggerAction(profile.id, 'like');
                      }}
                      className={'w-10 h-10 sm:w-11 sm:h-11 rounded-full flex items-center justify-center border transition-all duration-200 active:scale-95 shadow-md backdrop-blur-md ' + (
                        isLiked
                          ? 'bg-rose-500 border-rose-400 text-white shadow-rose-500/40 scale-105'
                          : 'bg-[#6555b8]/90 hover:bg-[#6555b8] border-white/30 text-white hover:shadow-[#6555b8]/40'
                      )}
                    >
                      <Heart className={'w-5 h-5 ' + (isLiked ? 'fill-white' : '')} />
                    </button>
                  </div>
                </div>

                {/* High Contrast Clean Details */}
                <div className="p-3.5 sm:p-4 bg-white">
                  <Link href={'/profile/' + profile.id} className="block group-hover:opacity-95">
                    <div className="flex items-center gap-1.5 mb-1">
                      <h3 className="text-lg sm:text-xl font-bold text-[#1C1924] flex items-center gap-1.5 truncate">
                        {((profile.username || profile.name || 'Member').startsWith('user_') ? 'Member' : (profile.username || profile.name || 'Member'))}{profile.age ? `, ${profile.age}` : ''}
                        {profile.verified && <CheckCircle className="w-4.5 h-4.5 text-[#6555b8] shrink-0" />}
                      </h3>
                    </div>
                    <p className="text-sm sm:text-base font-medium text-[#756D82] flex items-center gap-1.5 truncate">
                        <MapPin
                          className={'w-3.5 h-3.5 shrink-0 ' + (
                            profile.location_source === 'gps_verified' ? 'text-emerald-500' : 'text-[#8C849B]'
                          )}
                        />
                        <span className="truncate">{profile.location ? profile.location.split(',')[0] : 'Unknown'}</span>
                      </p>
                  </Link>
                </div>
              </div>
            );
          })}
        </div>

        {!isLoading && filteredProfiles.length === 0 && (
          <div className="py-16 text-center space-y-3">
            <p className="text-sm text-[#524B5E]">No members match your current filter settings.</p>
            <button
              type="button"
              onClick={resetFilters}
              className="px-5 py-2 rounded-full bg-[#6555b8] text-white text-xs font-semibold hover:bg-[#7D4B9F] transition"
            >
              Reset Filters
            </button>
          </div>
        )}

        {/* Scroll Sentinel for auto-fetch */}
        <div ref={sentinelRef} className="h-4 w-full pointer-events-none" />

        {/* Manual Load More Gate (after 3 auto-loads) */}
        {hasMore && autoLoadsCount >= 3 && (
          <div className="pt-4 pb-2 flex justify-center">
            <button
              type="button"
              onClick={() => {
                setIsLoadingMore(true);
                setTimeout(() => {
                  setVisibleLimit((prev) => prev + BATCH_SIZE);
                  setAutoLoadsCount(0); // Reset auto-loads so user can scroll again
                  setIsLoadingMore(false);
                }, 300);
              }}
              disabled={isLoadingMore}
              className="px-6 py-2.5 rounded-full bg-white border border-[#9a8cc3]/40 text-[#1C1924] hover:text-white hover:border-[#9a8cc3] text-xs font-semibold transition flex items-center gap-2 shadow-lg"
            >
              {isLoadingMore ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-[#9a8cc3]" />
                  <span>Loading profiles...</span>
                </>
              ) : (
                <span>Load More Profiles ({filteredProfiles.length - visibleLimit} remaining)</span>
              )}
            </button>
          </div>
        )}

        {/* Loading Spinner during auto-loads */}
        {isLoadingMore && autoLoadsCount < 3 && (
          <div className="py-6 flex justify-center items-center gap-2 text-xs text-[#9a8cc3]">
            <Loader2 className="w-4 h-4 animate-spin" />
            <span>Discovering more matches...</span>
          </div>
        )}

        {/* End of Feed State */}
        {!hasMore && filteredProfiles.length > 0 && (
          <div className="pt-8 pb-4 text-center">
            <p className="text-xs text-[#756D82]/70">
              You've viewed all {filteredProfiles.length} matches for your current criteria.
            </p>
          </div>
        )}

        {/* Undo Dismissal Snackbar */}
        {lastPassed && (
          <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 px-4 py-2.5 rounded-full bg-white/95 border border-[#9a8cc3]/40 shadow-2xl backdrop-blur-md">
            <span className="text-xs text-[#1C1924]">Passed <strong className="text-white">{lastPassed.name}</strong></span>
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
      <div 
        className={'fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex justify-end transition-opacity duration-300 ' + (
          filtersOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        )}
        onClick={() => setFiltersOpen(false)}
      >
        <div 
          className={'w-full max-w-sm sm:max-w-md bg-white h-full border-l border-[#DDD7E5] p-5 sm:p-6 overflow-y-auto flex flex-col justify-between transform transition-transform duration-300 ease-out ' + (
            filtersOpen ? 'translate-x-0' : 'translate-x-full'
          )}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="space-y-6">
            <div className="flex items-center justify-between pb-4 border-b border-[#7D7E92]/20">
              <div className="flex items-center gap-2">
                <SlidersHorizontal className="w-5 h-5 text-[#b2a4d7]" />
                <h2 className="text-base font-bold text-[#1C1924]">Refine Discover Feed</h2>
              </div>
              <button 
                type="button" 
                onClick={() => setFiltersOpen(false)}
                className="p-1.5 rounded-full text-[#524B5E] hover:text-white hover:bg-[#E5E1EC] transition"
              >
                <XIcon className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3">
              <div className="flex justify-between items-center text-xs font-semibold text-[#524B5E]">
                <span>Age Range</span>
                <span className="text-xs font-bold text-[#6555b8] bg-[#F3EFFC] px-2.5 py-0.5 rounded-full">{minAge} – {maxAge} yrs</span>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] text-[#756D82] uppercase font-bold">Min Age</label>
                  <input 
                    type="range" 
                    min="18" 
                    max="65" 
                    value={minAge} 
                    onChange={(e) => setMinAge(Math.min(Number(e.target.value), maxAge - 1))}
                    className="w-full accent-[#6555b8]" 
                  />
                </div>
                <div>
                  <label className="text-[10px] text-[#756D82] uppercase font-bold">Max Age</label>
                  <input 
                    type="range" 
                    min="18" 
                    max="65" 
                    value={maxAge} 
                    onChange={(e) => setMaxAge(Math.max(Number(e.target.value), minAge + 1))}
                    className="w-full accent-[#6555b8]" 
                  />
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <span className="text-xs font-semibold text-[#524B5E]">Relationship Intent</span>
              <div className="grid grid-cols-2 gap-2">
                {RELATIONSHIP_INTENTS.map((intent) => {
                  const active = selectedIntent === intent;
                  return (
                    <button
                      key={intent}
                      type="button"
                      onClick={() => setSelectedIntent(intent)}
                      className={'text-left text-xs px-3.5 py-2.5 rounded-xl border font-medium transition-all ' + (
                        active
                          ? 'bg-[#6555b8] border-[#6555b8] text-white shadow-xs'
                          : 'bg-white border-[#E5E1EC] text-[#524B5E] hover:bg-[#F3EFFC] hover:text-[#1C1924] hover:border-[#D0C7DF]'
                      )}
                    >
                      {intent}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="flex items-center justify-between sm:justify-start sm:gap-3 pt-2 sm:pt-6">
              <span className="text-xs font-semibold text-[#524B5E]">Verified Members Only</span>
              <button
                type="button"
                onClick={() => setVerifiedOnly(!verifiedOnly)}
                className={'w-11 h-6 rounded-full transition-colors flex items-center px-0.5 ' + (
                  verifiedOnly ? 'bg-[#6555b8]' : 'bg-[#E5E1EC]'
                )}
              >
                <div className={'w-5 h-5 rounded-full bg-white transition-transform ' + (
                  verifiedOnly ? 'translate-x-5' : 'translate-x-0'
                )} />
              </button>
            </div>

            <div className="flex items-center justify-between sm:justify-start sm:gap-3 pt-2 sm:pt-6">
              <span className="text-xs font-semibold text-[#524B5E]">Active Now / Today</span>
              <button
                type="button"
                onClick={() => setActiveNowOnly(!activeNowOnly)}
                className={'w-11 h-6 rounded-full transition-colors flex items-center px-0.5 ' + (
                  activeNowOnly ? 'bg-[#6555b8]' : 'bg-[#E5E1EC]'
                )}
              >
                <div className={'w-5 h-5 rounded-full bg-white transition-transform ' + (
                  activeNowOnly ? 'translate-x-5' : 'translate-x-0'
                )} />
              </button>
            </div>
          </div>

          <div className="pt-6 border-t border-[#7D7E92]/20 flex items-center gap-3">
            <button
              type="button"
              onClick={resetFilters}
              className="flex-1 py-2.5 rounded-full border border-[#DDD7E5] text-xs font-semibold text-[#524B5E] hover:text-white hover:bg-[#E5E1EC] transition flex items-center justify-center gap-1.5"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Reset
            </button>
            <button
              type="button"
              onClick={() => setFiltersOpen(false)}
              className="flex-1 py-2.5 rounded-full bg-[#6555b8] text-white text-xs font-semibold hover:bg-[#7D4B9F] transition shadow-md flex items-center justify-center gap-1.5"
            >
              <Check className="w-3.5 h-3.5" />
              Apply
            </button>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}


const DUMMY_BOT_PROFILES: ProfileItem[] = [
  {
    id: 'bot-jhoanna-cebu',
    name: 'Jhoanna',
    age: 29,
    gender: 'woman',
    location: 'Cebu City, Philippines',
    country: 'Philippines',
    avatarUrl: '/jhoanna.png',
    photos: ['/jhoanna.png'],
    verified: true,
    repScore: 98,
    online: true,
    recentlyActive: true,
    intent: 'Marriage',
    occupation: 'Registered Nurse',
    bio: 'Family-oriented and warm-hearted. Looking for a genuine, kind partner to build a meaningful life together.'
  },
  {
    id: 'bot-ploy-bangkok',
    name: 'Ploy',
    age: 32,
    gender: 'woman',
    location: 'Bangkok, Thailand',
    country: 'Thailand',
    avatarUrl: '/ploy%20chaiyaphon.png',
    photos: ['/ploy%20chaiyaphon.png'],
    verified: true,
    repScore: 97,
    online: true,
    recentlyActive: true,
    intent: 'Long-term relationship',
    occupation: 'Hospitality & Events',
    bio: 'Passionate about travel, great conversation, and quiet evenings. Seeking a mature, respectful gentleman.'
  }
];

export default function DiscoverPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#FAFAFD] text-[#1C1924] p-8 text-center text-xs">Loading discover feed...</div>}>
      <DiscoverContent />
    </Suspense>
  );
}

