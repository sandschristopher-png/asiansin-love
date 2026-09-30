'use client';

import { getDistanceLabel } from '@/lib/location';

import React, { useState, useEffect, useMemo, useRef, Suspense } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { ChevronLeft, ChevronRight, Search, Heart, X as XIcon, Star, MessageCircle, 
  MapPin, ShieldCheck, CheckCircle, SlidersHorizontal, 
  RotateCcw, Loader2, Check } from 'lucide-react';
import { Footer } from '@/components/Footer';
import { supabase } from '@/lib/supabaseClient';
import { ActionType, getLocalCardActions, persistCardAction } from '@/lib/interactions';

const PRIORITY_ORDER = ['Philippines', 'Thailand', 'Vietnam', 'Laos', 'Cambodia', 'Indonesia'];

const RELATIONSHIP_INTENTS = [
  'All',
  'Marriage',
  'Long-term Relationship',
  'Serious Dating',
  'Casual Dating',
  'Friendship'
];

export interface ProfileItem {
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
        {/* Subtle Rep Score */}
        {repScore ? (
          <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-black/40 backdrop-blur-md border border-white/15 text-[10px] font-semibold text-emerald-300">
            <ShieldCheck className="w-3 h-3 text-emerald-400 shrink-0" />
            <span>{repScore}%</span>
          </div>
        ) : <div />}

        {/* Dynamic Online Indicator (No dark Offline pill) */}
        {online ? (
          <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-black/40 backdrop-blur-md border border-white/15 text-[10px] font-medium text-white shadow-xs">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span className="text-[10px] text-emerald-300 font-medium">Online</span>
          </div>
        ) : recentlyActive ? (
          <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-black/40 backdrop-blur-md border border-white/15 text-[10px] font-medium text-amber-200 shadow-xs">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
            <span className="text-[10px] text-amber-200">Recent</span>
          </div>
        ) : null}
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
  const [profiles, setProfiles] = useState<ProfileItem[]>([]);

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
              .select('latitude, longitude')
              .eq('id', user.id)
              .maybeSingle();
            if (userProfile?.latitude && userProfile?.longitude) {
              setCurrentUserCoords({ lat: userProfile.latitude, lon: userProfile.longitude });
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
              online: row.last_active ? (Date.now() - new Date(row.last_active).getTime() < 1000 * 60 * 15) : true,
              intent: row.intent || 'Marriage',
              bio: row.bio,
              occupation: row.occupation,
            };
          });

          // Avoid duplicating profiles that exist in remote DB
          const liveIds = new Set(liveItems.map(p => p.id));
          const filteredLiveItems = currentAuthUser ? liveItems.filter(p => p.id !== currentAuthUser.id) : liveItems;
          setProfiles(filteredLiveItems);
        }
      } catch (err) {
        console.error('Failed to load discovery profiles:', err);
      }
    }

    loadLiveProfiles();
  }, [supabase]);

  const availableCountries = Array.from(new Set(profiles.map((p) => p.country)));
  const SEA_COUNTRIES = ['Philippines', 'Thailand', 'Vietnam', 'Indonesia', 'Malaysia', 'Singapore', 'Cambodia', 'Laos'];
const SUITOR_COUNTRIES = ['United States', 'Canada', 'Australia', 'United Kingdom', 'Singapore', 'Japan', 'Philippines', 'Thailand'];

  const isUserInSEA = useMemo(() => {
    // If auth user location/country is in SEA, show suitor list first
    return false;
    return false; // Default to SEA list, dynamically switches if user country is SEA
  }, []);

  const sortedCountries = useMemo(() => {
    const list = isUserInSEA ? SUITOR_COUNTRIES : SEA_COUNTRIES;
    return ['All', ...list];
  }, [isUserInSEA]);

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
      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 pt-8 pb-32 space-y-6">
        
        {/* Top Control Bar */}
        <div className="space-y-2.5 sm:space-y-0">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 sm:gap-3">
            
            <div className="flex items-center gap-2 flex-1">
              <div className="relative flex-1">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#A8A2AB] pointer-events-none" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Find someone in Manila, Bangkok, or Cebu..."
                  className="w-full bg-white border border-[#DDD7E5] rounded-full pl-11 pr-4 py-2.5 text-xs sm:text-sm text-[#1C1924] placeholder-[#8C849B] focus:outline-none focus:border-[#9a8cc3] focus:ring-1 focus:ring-[#9a8cc3] transition"
                />
              </div>

              <button
                type="button"
                onClick={() => setFiltersOpen(true)}
                className="relative sm:hidden flex items-center justify-center p-2.5 rounded-full bg-white border border-[#DDD7E5] text-[#524B5E] active:bg-[#F3EFFC] transition shrink-0"
                aria-label="Open Filters"
              >
                <SlidersHorizontal className="w-4 h-4 text-[#b2a4d7]" />
                {activeFiltersCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 bg-[#6555b8] text-white text-[9px] font-bold rounded-full flex items-center justify-center border-2 border-white">
                    {activeFiltersCount}
                  </span>
                )}
              </button>
            </div>

            <div className="hidden sm:flex items-center gap-2">
              <button
                type="button"
                onClick={() => setFiltersOpen(true)}
                className="flex items-center gap-2 px-4 py-2.5 rounded-full bg-white border border-[#DDD7E5] text-xs font-semibold text-[#1C1924] hover:border-[#9a8cc3]/60 hover:text-white transition"
              >
                <SlidersHorizontal className="w-3.5 h-3.5 text-[#b2a4d7]" />
                <span>Filters</span>
                {activeFiltersCount > 0 && (
                  <span className="px-1.5 py-0.2 bg-[#6555b8] text-white text-[10px] rounded-full font-bold ml-0.5">
                    {activeFiltersCount}
                  </span>
                )}
              </button>
            </div>
          </div>

          {/* Quick Filter Horizontal Scrollbar */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 pt-2 sm:pt-2.5 scrollbar-none no-scrollbar">
            <div className="flex items-center bg-white p-0.5 rounded-full border border-[#DDD7E5] shrink-0 mr-1.5">
              {(['All', 'woman', 'trans', 'man']).map((gender) => {
                const label = gender === 'All' ? 'All' : gender === 'woman' ? 'Women' : gender === 'trans' ? 'Trans' : 'Men';
                const active = selectedGender === gender;
                return (
                  <button
                    key={gender}
                    type="button"
                    onClick={() => { userSelectedGenderManually.current = true; setSelectedGender(gender as any); }}
                    className={'px-3 py-1 text-[11px] font-medium rounded-full transition-all ' + (active ? 'bg-[#6555b8] text-white shadow-sm' : 'text-[#D5CEE5] hover:text-white')}
                  >
                    {label}
                  </button>
                );
              })}
            </div>

            <div className="h-4 w-[1px] bg-[#7D7E92]/30 shrink-0 mx-0.5" />

            {sortedCountries.map((c) => {
              const active = selectedCountry.toLowerCase() === c.toLowerCase();
              return (
                <button
                  key={c}
                  type="button"
                  onClick={() => setSelectedCountry(c)}
                  className={'px-3.5 py-1 rounded-full text-xs font-medium whitespace-nowrap transition-all shrink-0 border ' + (active ? 'bg-[#6555b8] text-white border-[#9a8cc3] shadow-sm' : 'bg-white text-[#D5CEE5] border-[#7D7E92]/25 hover:border-[#9a8cc3]/40 hover:text-white')}
                >
                  {c}
                </button>
              );
            })}
          </div>
        </div>

        {/* Discovery Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-5">
          {visibleProfiles.map((profile) => {
            const state = cardActions[profile.id];
            const isLiked = state === 'like';
            const isStarred = state === 'star';

            return (
              <div
                key={profile.id}
                className={'group relative rounded-2xl overflow-hidden bg-white border border-[#DDD7E5]/70 transition-all duration-300 hover:-translate-y-1.5 hover:shadow-xl hover:shadow-[#6555b8]/15 flex flex-col justify-between ' + (
                  isLiked
                    ? 'border-rose-500/60 shadow-[0_0_20px_rgba(244,63,94,0.18)]'
                    : isStarred
                    ? 'border-amber-400/60 shadow-[0_0_20px_rgba(251,191,36,0.18)]'
                    : 'border-[#7D7E92]/25 hover:border-[#9a8cc3]/50'
                )}
              >
                <DiscoverCardPhotoCarousel
                  profileId={profile.id}
                  photos={profile.photos}
                  avatarUrl={profile.avatarUrl}
                  name={profile.name}
                  repScore={profile.repScore}
                  online={profile.online}
                  recentlyActive={profile.recentlyActive}
                />

                <div className="p-3 sm:p-3.5 space-y-2 bg-[#F2EEF7]">
                  <Link href={'/profile/' + profile.id} className="block group-hover:opacity-95">
                    <div className="flex items-center justify-between gap-1.5 mb-1">
                      <h3 className="text-sm sm:text-base font-bold text-white flex items-center gap-1.5 truncate">
                        {profile.name}{profile.age ? `, ${profile.age}` : ''}
                        {profile.verified && <CheckCircle className="w-3.5 h-3.5 text-[#9a8cc3] shrink-0" />}
                      </h3>
                      
                    </div>
                    {(() => {
                        const isVerified = profile.location_source === 'gps_verified';
                        const distance = currentUserCoords
                          ? getDistanceLabel(currentUserCoords.lat, currentUserCoords.lon, profile.latitude, profile.longitude)
                          : null;
                        return (
                          <p className="text-[11px] sm:text-xs font-medium text-[#1C1924]/80 flex items-center gap-1.5 truncate mt-0.5">
                            <MapPin
                              className={`w-3 h-3 shrink-0 ${
                                isVerified ? 'text-emerald-400' : 'text-[#9a8cc3]'
                              }`}
                            />
                            <span className="truncate">{profile.location}</span>
                            {isVerified && distance && (
                              <span className="text-[10px] text-emerald-300 font-normal shrink-0">â€¢ {distance}</span>
                            )}
                          </p>
                        );
                      })()}
                  </Link>

                  <div className="flex items-center justify-between pt-2 border-t border-[#7D7E92]/20">
                    <button 
                      type="button"
                      aria-label="Pass"
                      onClick={() => triggerAction(profile.id, 'pass', profile.name)}
                      className="w-9 h-9 sm:w-10 sm:h-10 rounded-full flex items-center justify-center border transition-all duration-150 active:scale-90 bg-white border-[#DDD7E5] text-[#1C1924]/70 hover:text-white hover:border-zinc-500 hover:bg-zinc-800/80"
                    >
                      <XIcon className="w-4 h-4 sm:w-4.5 sm:h-4.5" />
                    </button>

                    <button 
                      type="button"
                      aria-label="Favorite"
                      onClick={() => triggerAction(profile.id, 'star')}
                      className={'w-9 h-9 sm:w-10 sm:h-10 rounded-full flex items-center justify-center border transition-all duration-200 active:scale-95 ' + (
                        isStarred 
                          ? 'text-amber-400 bg-amber-400/20 border-amber-400/60 shadow-[0_0_12px_rgba(251,191,36,0.35)] scale-105' 
                          : 'bg-white border-[#DDD7E5] text-[#1C1924]/70 hover:text-amber-400 hover:border-amber-400/40 hover:bg-white/80'
                      )}
                    >
                      <Star className={'w-4 h-4 sm:w-4.5 sm:h-4.5 ' + (isStarred ? 'fill-amber-400' : '')} />
                    </button>

                    <Link 
                      href={'/chat/' + profile.id}
                      aria-label="Message" 
                      className="w-9 h-9 sm:w-10 sm:h-10 rounded-full flex items-center justify-center bg-white border border-[#DDD7E5] text-[#1C1924]/70 hover:text-[#b2a4d7] hover:border-[#9a8cc3]/60 hover:bg-[#6555b8]/30 transition active:scale-90"
                    >
                      <MessageCircle className="w-4 h-4 sm:w-4.5 sm:h-4.5" />
                    </Link>

                    <button 
                      type="button"
                      aria-label="Like"
                      onClick={() => triggerAction(profile.id, 'like')}
                      className={'w-9 h-9 sm:w-10 sm:h-10 rounded-full flex items-center justify-center border transition-all duration-200 active:scale-95 ' + (
                        isLiked 
                          ? 'text-rose-400 bg-rose-500/20 border-rose-500/60 shadow-[0_0_12px_rgba(244,63,94,0.35)] scale-105' 
                          : 'bg-white border-[#DDD7E5] text-[#1C1924]/70 hover:text-rose-400 hover:border-rose-400/40 hover:bg-white/80'
                      )}
                    >
                      <Heart className={'w-4 h-4 sm:w-4.5 sm:h-4.5 ' + (isLiked ? 'fill-rose-500' : '')} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>


        {/* Empty State */}
        {filteredProfiles.length === 0 && (
          <div className="py-16 text-center space-y-3">
            <p className="text-sm text-[#D5CEE5]">No members match your current filter settings.</p>
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
            <p className="text-xs text-[#A8A2AB]/70">
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
          className={'w-full max-w-sm sm:max-w-md bg-[#1B1524] h-full border-l border-[#DDD7E5] p-5 sm:p-6 overflow-y-auto flex flex-col justify-between transform transition-transform duration-300 ease-out ' + (
            filtersOpen ? 'translate-x-0' : 'translate-x-full'
          )}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="space-y-6">
            <div className="flex items-center justify-between pb-4 border-b border-[#7D7E92]/20">
              <div className="flex items-center gap-2">
                <SlidersHorizontal className="w-5 h-5 text-[#b2a4d7]" />
                <h2 className="text-base font-bold text-white">Refine Discover Feed</h2>
              </div>
              <button 
                type="button" 
                onClick={() => setFiltersOpen(false)}
                className="p-1.5 rounded-full text-[#D5CEE5] hover:text-white hover:bg-[#2B2338] transition"
              >
                <XIcon className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3">
              <div className="flex justify-between items-center text-xs font-semibold text-[#D5CEE5]">
                <span>Age Range</span>
                <span className="text-white font-mono">{minAge} â€¢ {maxAge} yrs</span>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] text-[#A8A2AB] uppercase font-bold">Min Age</label>
                  <input 
                    type="range" 
                    min="18" 
                    max="65" 
                    value={minAge} 
                    onChange={(e) => setMinAge(Math.min(Number(e.target.value), maxAge - 1))}
                    className="w-full accent-[#9a8cc3]" 
                  />
                </div>
                <div>
                  <label className="text-[10px] text-[#A8A2AB] uppercase font-bold">Max Age</label>
                  <input 
                    type="range" 
                    min="18" 
                    max="65" 
                    value={maxAge} 
                    onChange={(e) => setMaxAge(Math.max(Number(e.target.value), minAge + 1))}
                    className="w-full accent-[#9a8cc3]" 
                  />
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <span className="text-xs font-semibold text-[#D5CEE5]">Relationship Intent</span>
              <div className="grid grid-cols-2 gap-2">
                {RELATIONSHIP_INTENTS.map((intent) => {
                  const active = selectedIntent === intent;
                  return (
                    <button
                      key={intent}
                      type="button"
                      onClick={() => setSelectedIntent(intent)}
                      className={'text-left text-xs px-3 py-2 rounded-xl border transition ' + (
                        active
                          ? 'bg-[#6555b8] border-[#9a8cc3] text-white font-semibold shadow-sm'
                          : 'bg-[#221B2E] border-[#7D7E92]/20 text-[#D5CEE5] hover:border-[#9a8cc3]/40'
                      )}
                    >
                      {intent}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="flex items-center justify-between sm:justify-start sm:gap-3 pt-2 sm:pt-6">
              <span className="text-xs font-semibold text-[#D5CEE5]">Verified Members Only</span>
              <button
                type="button"
                onClick={() => setVerifiedOnly(!verifiedOnly)}
                className={'w-11 h-6 rounded-full transition-colors flex items-center px-0.5 ' + (
                  verifiedOnly ? 'bg-[#6555b8]' : 'bg-[#2B2338]'
                )}
              >
                <div className={'w-5 h-5 rounded-full bg-white transition-transform ' + (
                  verifiedOnly ? 'translate-x-5' : 'translate-x-0'
                )} />
              </button>
            </div>

            <div className="flex items-center justify-between sm:justify-start sm:gap-3 pt-2 sm:pt-6">
              <span className="text-xs font-semibold text-[#D5CEE5]">Active Now / Today</span>
              <button
                type="button"
                onClick={() => setActiveNowOnly(!activeNowOnly)}
                className={'w-11 h-6 rounded-full transition-colors flex items-center px-0.5 ' + (
                  activeNowOnly ? 'bg-[#6555b8]' : 'bg-[#2B2338]'
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
              className="flex-1 py-2.5 rounded-full border border-[#DDD7E5] text-xs font-semibold text-[#D5CEE5] hover:text-white hover:bg-[#2B2338] transition flex items-center justify-center gap-1.5"
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

export default function DiscoverPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#FAFAFD] text-[#1C1924] p-8 text-center text-xs">Loading discover feed...</div>}>
      <DiscoverContent />
    </Suspense>
  );
}

