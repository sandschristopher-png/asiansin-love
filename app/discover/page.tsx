'use client';

import React, { useState, useEffect, useMemo, Suspense } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { 
  Search, Heart, X as XIcon, Star, MessageCircle, 
  MapPin, ShieldCheck, CheckCircle, SlidersHorizontal, 
  RotateCcw, Check
} from 'lucide-react';
import { Footer } from '@/components/Footer';
import { createClient } from '@/lib/supabase/client';
import { ActionType, getLocalCardActions, persistCardAction } from '@/lib/interactions';

const PRIORITY_ORDER = ['Philippines', 'Thailand', 'Cambodia', 'Vietnam', 'Indonesia', 'Laos'];

const RELATIONSHIP_INTENTS = [
  'All',
  'Marriage',
  'Long-term Relationship',
  'Serious Dating',
  'Casual Dating',
  'Friendship'
];

interface ProfileItem {
  id: string;
  name: string;
  age: number;
  gender: 'woman' | 'man' | 'trans';
  location: string;
  country: string;
  avatarUrl: string;
  repScore: number;
  verified: boolean;
  online: boolean;
  intent?: string;
}

const DEMO_PROFILES: ProfileItem[] = [
  {
    id: 'dummy-1',
    name: 'Siriporn',
    age: 25,
    gender: 'woman',
    location: 'Bangkok, Thailand',
    country: 'Thailand',
    avatarUrl: '/dummy-1.jpg',
    repScore: 98,
    verified: true,
    online: true,
    intent: 'Marriage',
  },
  {
    id: 'dummy-2',
    name: 'Camille',
    age: 26,
    gender: 'woman',
    location: 'Makati, Philippines',
    country: 'Philippines',
    avatarUrl: '/dummy-2.jpg',
    repScore: 100,
    verified: true,
    online: true,
    intent: 'Long-term Relationship',
  },
  {
    id: 'dummy-3',
    name: 'Maricel',
    age: 28,
    gender: 'woman',
    location: 'Calbayog, Samar',
    country: 'Philippines',
    avatarUrl: '/dummy-3.jpg',
    repScore: 97,
    verified: true,
    online: false,
    intent: 'Serious Dating',
  },
  {
    id: 'dummy-4',
    name: 'Sreyneang',
    age: 24,
    gender: 'woman',
    location: 'Kampot, Cambodia',
    country: 'Cambodia',
    avatarUrl: '/dummy-4.jpg',
    repScore: 99,
    verified: true,
    online: true,
    intent: 'Marriage',
  },
  {
    id: 'dummy-5',
    name: 'Danica',
    age: 27,
    gender: 'woman',
    location: 'Tandag, Philippines',
    country: 'Philippines',
    avatarUrl: '/dummy-5.jpg',
    repScore: 96,
    verified: true,
    online: false,
    intent: 'Long-term Relationship',
  },
  {
    id: 'dummy-6',
    name: 'Bianca',
    age: 25,
    gender: 'trans',
    location: 'Taguig City, Philippines',
    country: 'Philippines',
    avatarUrl: '/dummy-6.jpg',
    repScore: 98,
    verified: true,
    online: true,
    intent: 'Serious Dating',
  },
  {
    id: 'dummy-7',
    name: 'Jasmine',
    age: 29,
    gender: 'woman',
    location: 'Taguig City, Philippines',
    country: 'Philippines',
    avatarUrl: '/dummy-7.jpg',
    repScore: 95,
    verified: true,
    online: false,
    intent: 'Marriage',
  },
];

function DiscoverContent() {
  const searchParams = useSearchParams();
  const [supabase] = useState(() => createClient());
  const [profiles, setProfiles] = useState<ProfileItem[]>(DEMO_PROFILES);

  // Initialize filter states from URL search parameters if available
  const [searchQuery, setSearchQuery] = useState(() => searchParams.get('q') || '');
  const [selectedCountry, setSelectedCountry] = useState(() => searchParams.get('country') || 'All');
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

  // Sync state back to URL query parameters smoothly
  useEffect(() => {
    const params = new URLSearchParams();

    if (searchQuery.trim()) params.set('q', searchQuery.trim());
    if (selectedCountry !== 'All') params.set('country', selectedCountry);
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
    setMinAge(18);
    setMaxAge(65);
    setSelectedIntent('All');
    setVerifiedOnly(false);
    setActiveNowOnly(false);
  };

  // Hydrate card actions from local storage and Supabase favorites
  useEffect(() => {
    const local = getLocalCardActions();
    setCardActions(local);

    async function hydrateRemoteFavorites() {
      try {
        const { data: { user } } = await supabase.auth.getUser();
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

  const triggerAction = (id: string, action: ActionType) => {
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

    persistCardAction(supabase, id, action, isCurrentlyActive);
  };

  useEffect(() => {
    async function loadLiveProfiles() {
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('id, display_name, full_name, username, age, gender, city, country, avatar_url, is_verified, reputation_score, last_active, relationship_intent')
          .order('created_at', { ascending: false })
          .limit(40);

        if (error) {
          console.error('Error fetching live profiles:', error);
          return;
        }

        if (data && data.length > 0) {
          const liveItems: ProfileItem[] = data.map((row: any) => {
            const countryVal = row.country || 'Philippines';
            const cityVal = row.city ? `${row.city}, ${countryVal}` : countryVal;
            const normGender = (row.gender?.toLowerCase() || 'woman') as 'woman' | 'man' | 'trans';
            return {
              id: row.id,
              name: row.display_name || row.full_name || row.username || 'Member',
              age: row.age || 24,
              gender: ['woman', 'man', 'trans'].includes(normGender) ? normGender : 'woman',
              location: cityVal,
              country: countryVal,
              avatarUrl: row.avatar_url || '/dummy-1.jpg',
              repScore: row.reputation_score || 100,
              verified: Boolean(row.is_verified),
              online: row.last_active ? (Date.now() - new Date(row.last_active).getTime() < 1000 * 60 * 15) : true,
              intent: row.relationship_intent || 'Marriage',
            };
          });

          setProfiles([...liveItems, ...DEMO_PROFILES]);
        }
      } catch (err) {
        console.error('Failed to load discovery profiles:', err);
      }
    }

    loadLiveProfiles();
  }, [supabase]);

  const availableCountries = Array.from(new Set(profiles.map((p) => p.country)));
  const sortedCountries = ['All', ...availableCountries.sort((a, b) => {
    const idxA = PRIORITY_ORDER.indexOf(a);
    const idxB = PRIORITY_ORDER.indexOf(b);
    if (idxA !== -1 && idxB !== -1) return idxA - idxB;
    if (idxA !== -1) return -1;
    if (idxB !== -1) return 1;
    return a.localeCompare(b);
  })];

  const filteredProfiles = profiles.filter((profile) => {
    const matchesCountry = selectedCountry === 'All' || profile.country.toLowerCase() === selectedCountry.toLowerCase();
    const matchesGender = selectedGender === 'All' || profile.gender.toLowerCase() === selectedGender.toLowerCase();
    const matchesQuery = 
      profile.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      profile.location.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesAge = profile.age >= minAge && profile.age <= maxAge;
    const matchesIntent = selectedIntent === 'All' || !profile.intent || profile.intent === selectedIntent;
    const matchesVerified = !verifiedOnly || profile.verified;
    const matchesOnline = !activeNowOnly || profile.online;

    return matchesCountry && matchesGender && matchesQuery && matchesAge && matchesIntent && matchesVerified && matchesOnline;
  });

  return (
    <div className="min-h-screen flex flex-col bg-[#130f18] text-[#E6D7FA]">
      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 pt-5 pb-16 space-y-4">
        
        {/* Streamlined Top Control Bar */}
        <div className="space-y-2.5 sm:space-y-0">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 sm:gap-3">
            
            {/* Search Input + Mobile Filter Button Row */}
            <div className="flex items-center gap-2 flex-1">
              <div className="relative flex-1">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#A8A2AB]" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search by name, city, or interests..."
                  className="w-full bg-[#1D1726] border border-[#7D7E92]/30 rounded-xl pl-10 pr-4 py-2 sm:py-2.5 text-xs sm:text-sm text-white placeholder-[#7D7E92] focus:outline-none focus:border-[#9A79BA] focus:ring-1 focus:ring-[#9A79BA] transition"
                />
              </div>

              {/* Mobile Filter Button */}
              <button
                type="button"
                onClick={() => setFiltersOpen(true)}
                className="relative sm:hidden flex items-center justify-center p-2.5 rounded-xl bg-[#1D1726] border border-[#7D7E92]/30 text-[#E6D7FA] active:bg-[#2B2338] transition shrink-0"
                aria-label="Open Filters"
              >
                <SlidersHorizontal className="w-4 h-4 text-[#C9A4E8]" />
                {activeFiltersCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 bg-[#653C87] text-white text-[9px] font-bold rounded-full flex items-center justify-center border-2 border-[#130f18]">
                    {activeFiltersCount}
                  </span>
                )}
              </button>
            </div>

            {/* Desktop Filters Trigger */}
            <div className="hidden sm:flex items-center gap-2">
              <button
                type="button"
                onClick={() => setFiltersOpen(true)}
                className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-[#1D1726] border border-[#7D7E92]/30 text-xs font-semibold text-[#E6D7FA] hover:border-[#9A79BA]/60 hover:text-white transition"
              >
                <SlidersHorizontal className="w-3.5 h-3.5 text-[#C9A4E8]" />
                <span>Filters</span>
                {activeFiltersCount > 0 && (
                  <span className="px-1.5 py-0.2 bg-[#653C87] text-white text-[10px] rounded-full font-bold ml-0.5">
                    {activeFiltersCount}
                  </span>
                )}
              </button>
            </div>
          </div>

          {/* Quick Filter Horizontal Scrollbar: Gender + Countries */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 pt-2 sm:pt-2.5 scrollbar-none no-scrollbar">
            {/* Gender Segmented Switch */}
            <div className="flex items-center bg-[#1D1726] p-0.5 rounded-lg border border-[#7D7E92]/30 shrink-0 mr-1.5">
              {(['All', 'woman', 'trans', 'man'] as const).map((gender) => {
                const label = gender === 'All' ? 'All' : gender === 'woman' ? 'Women' : gender === 'trans' ? 'Trans' : 'Men';
                const active = selectedGender === gender;
                return (
                  <button
                    key={gender}
                    type="button"
                    onClick={() => setSelectedGender(gender)}
                    className={`px-2.5 py-1 text-[11px] font-medium rounded-md transition-all ${
                      active
                        ? 'bg-[#653C87] text-white shadow-sm'
                        : 'text-[#D5CEE5] hover:text-white'
                    }`}
                  >
                    {label}
                  </button>
                );
              })}
            </div>

            <div className="h-4 w-[1px] bg-[#7D7E92]/30 shrink-0 mx-0.5" />

            {/* Country Pills */}
            {sortedCountries.map((c) => {
              const active = selectedCountry.toLowerCase() === c.toLowerCase();
              return (
                <button
                  key={c}
                  type="button"
                  onClick={() => setSelectedCountry(c)}
                  className={`px-3 py-1 rounded-lg text-xs font-medium whitespace-nowrap transition-all shrink-0 border ${
                    active
                      ? 'bg-[#653C87] text-white border-[#9A79BA] shadow-sm'
                      : 'bg-[#1D1726] text-[#D5CEE5] border-[#7D7E92]/25 hover:border-[#9A79BA]/40 hover:text-white'
                  }`}
                >
                  {c}
                </button>
              );
            })}
          </div>
        </div>

        {/* Filter Drawer / Modal Backdrop */}
        {filtersOpen && (
          <div 
            className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex justify-end"
            onClick={() => setFiltersOpen(false)}
          >
            <div 
              className="w-full max-w-sm sm:max-w-md bg-[#1B1524] h-full border-l border-[#7D7E92]/30 p-5 sm:p-6 overflow-y-auto flex flex-col justify-between"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="space-y-6">
                <div className="flex items-center justify-between pb-4 border-b border-[#7D7E92]/20">
                  <div className="flex items-center gap-2">
                    <SlidersHorizontal className="w-5 h-5 text-[#C9A4E8]" />
                    <h2 className="text-base font-bold text-white">Refine Discover Feed</h2>
                  </div>
                  <button 
                    type="button" 
                    onClick={() => setFiltersOpen(false)}
                    className="p-1.5 rounded-lg text-[#D5CEE5] hover:text-white hover:bg-[#2B2338] transition"
                  >
                    <XIcon className="w-5 h-5" />
                  </button>
                </div>

                {/* Age Slider Range */}
                <div className="space-y-3">
                  <div className="flex justify-between items-center text-xs font-semibold text-[#D5CEE5]">
                    <span>Age Range</span>
                    <span className="text-white font-mono">{minAge} – {maxAge} yrs</span>
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
                        className="w-full accent-[#9A79BA]" 
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
                        className="w-full accent-[#9A79BA]" 
                      />
                    </div>
                  </div>
                </div>

                {/* Intent Filter */}
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
                          className={`text-left text-xs px-3 py-2 rounded-lg border transition ${
                            active
                              ? 'bg-[#653C87] border-[#9A79BA] text-white font-semibold'
                              : 'bg-[#221B2E] border-[#7D7E92]/20 text-[#D5CEE5] hover:border-[#9A79BA]/40'
                          }`}
                        >
                          {intent}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Verified Only Toggle */}
                <div className="flex items-center justify-between sm:justify-start sm:gap-3 pt-2 sm:pt-6">
                  <span className="text-xs font-semibold text-[#D5CEE5]">Verified Members Only</span>
                  <button
                    type="button"
                    onClick={() => setVerifiedOnly(!verifiedOnly)}
                    className={`w-11 h-6 rounded-full transition-colors flex items-center px-0.5 ${
                      verifiedOnly ? 'bg-[#653C87]' : 'bg-[#2B2338]'
                    }`}
                  >
                    <div className={`w-5 h-5 rounded-full bg-white transition-transform ${
                      verifiedOnly ? 'translate-x-5' : 'translate-x-0'
                    }`} />
                  </button>
                </div>

                {/* Active Today Toggle */}
                <div className="flex items-center justify-between sm:justify-start sm:gap-3 pt-2 sm:pt-6">
                  <span className="text-xs font-semibold text-[#D5CEE5]">Active Now / Today</span>
                  <button
                    type="button"
                    onClick={() => setActiveNowOnly(!activeNowOnly)}
                    className={`w-11 h-6 rounded-full transition-colors flex items-center px-0.5 ${
                      activeNowOnly ? 'bg-[#653C87]' : 'bg-[#2B2338]'
                    }`}
                  >
                    <div className={`w-5 h-5 rounded-full bg-white transition-transform ${
                      activeNowOnly ? 'translate-x-5' : 'translate-x-0'
                    }`} />
                  </button>
                </div>
              </div>

              {/* Drawer Bottom Actions */}
              <div className="pt-6 border-t border-[#7D7E92]/20 flex items-center gap-3">
                <button
                  type="button"
                  onClick={resetFilters}
                  className="flex-1 py-2.5 rounded-xl border border-[#7D7E92]/30 text-xs font-semibold text-[#D5CEE5] hover:text-white hover:bg-[#2B2338] transition flex items-center justify-center gap-1.5"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  Reset
                </button>
                <button
                  type="button"
                  onClick={() => setFiltersOpen(false)}
                  className="flex-1 py-2.5 rounded-xl bg-[#653C87] text-white text-xs font-semibold hover:bg-[#7D4B9F] transition shadow-md flex items-center justify-center gap-1.5"
                >
                  <Check className="w-3.5 h-3.5" />
                  Apply
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Discovery Feed Profile Card Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4.5 pt-1">
          {filteredProfiles.map((profile) => {
            const state = cardActions[profile.id];
            const isPassed = state === 'pass';
            const isLiked = state === 'like';
            const isStarred = state === 'star';

            return (
              <div
                key={profile.id}
                className={`group relative rounded-2xl overflow-hidden bg-[#1E1727] border transition-all duration-300 flex flex-col justify-between ${
                  isPassed
                    ? 'opacity-40 grayscale border-zinc-700'
                    : isLiked
                    ? 'border-rose-500/50 shadow-rose-950/20 shadow-xl'
                    : isStarred
                    ? 'border-amber-400/50 shadow-amber-950/20 shadow-xl'
                    : 'border-[#7D7E92]/25 hover:border-[#9A79BA]/50'
                }`}
              >
                {/* Visual Media Header */}
                <Link href={`/profile/${profile.id}`} className="relative block aspect-[4/5] w-full overflow-hidden bg-[#261F33]">
                  <Image
                    src={profile.avatarUrl}
                    alt={profile.name}
                    fill
                    sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                    className="object-cover group-hover:scale-105 transition-transform duration-300"
                    priority={false}
                  />

                  {/* Top Badges Overlay */}
                  <div className="absolute top-2 left-2 right-2 flex items-center justify-between z-10">
                    <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-black/60 backdrop-blur-md border border-white/10 text-[10px] font-bold text-emerald-400">
                      <ShieldCheck className="w-3 h-3 text-emerald-400" />
                      <span>{profile.repScore}%</span>
                    </div>

                    {profile.online && (
                      <div className="flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-black/60 backdrop-blur-md border border-white/10 text-[9px] font-medium text-emerald-400">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                        <span className="hidden sm:inline">Active</span>
                      </div>
                    )}
                  </div>

                  {/* Intent Tag Overlay */}
                  <div className="absolute bottom-2.5 left-2 z-10">
                    <span className="px-2 py-0.5 rounded-md bg-[#653C87]/80 backdrop-blur-md text-[10px] font-semibold text-white tracking-wide border border-white/10">
                      {profile.intent}
                    </span>
                  </div>

                  <div className="absolute inset-0 bg-gradient-to-t from-[#1D1726] via-transparent to-transparent opacity-80" />
                </Link>

                {/* Profile Details & Tactile Circular Button Pods */}
                <div className="p-3 sm:p-3.5 space-y-2.5 bg-[#261F33]">
                  <Link href={`/profile/${profile.id}`} className="block">
                    <h3 className="text-sm sm:text-base font-bold text-white flex items-center gap-1.5 truncate">
                      {profile.name}, {profile.age}
                      {profile.verified && <CheckCircle className="w-3.5 h-3.5 text-[#9A79BA] shrink-0" />}
                    </h3>
                    <p className="text-[11px] sm:text-xs font-medium text-[#E6D7FA]/80 flex items-center gap-1.5 truncate mt-0.5">
                      <MapPin className="w-3 h-3 text-[#9A79BA] shrink-0" />
                      {profile.location}
                    </p>
                  </Link>

                  {/* Action Bar */}
                  <div className="flex items-center justify-between pt-2 border-t border-[#7D7E92]/20">
                    
                    {/* Pass (X) */}
                    <button 
                      type="button"
                      aria-label="Pass"
                      onClick={() => triggerAction(profile.id, 'pass')}
                      className={`w-9 h-9 sm:w-10 sm:h-10 rounded-full flex items-center justify-center border transition-all duration-150 active:scale-90 ${
                        isPassed 
                          ? 'text-zinc-500 bg-zinc-800/90 border-zinc-700' 
                          : 'bg-[#1D1726] border-[#7D7E92]/30 text-[#E6D7FA]/70 hover:text-white hover:border-[#9A79BA]/60 hover:bg-[#1D1726]/80'
                      }`}
                    >
                      <XIcon className="w-4 h-4 sm:w-4.5 sm:h-4.5" />
                    </button>

                    {/* Star / Super Like */}
                    <button 
                      type="button"
                      aria-label="Favorite"
                      onClick={() => triggerAction(profile.id, 'star')}
                      className={`w-9 h-9 sm:w-10 sm:h-10 rounded-full flex items-center justify-center border transition-all duration-200 active:scale-95 ${
                        isStarred 
                          ? 'text-amber-400 bg-amber-400/20 border-amber-400/60 shadow-[0_0_12px_rgba(251,191,36,0.3)]' 
                          : 'bg-[#1D1726] border-[#7D7E92]/30 text-[#E6D7FA]/70 hover:text-amber-400 hover:border-amber-400/40 hover:bg-[#1D1726]/80'
                      }`}
                    >
                      <Star className={`w-4 h-4 sm:w-4.5 sm:h-4.5 ${isStarred ? 'fill-amber-400' : ''}`} />
                    </button>

                    {/* Message / Chat */}
                    <Link 
                      href={`/chat/${profile.id}`}
                      aria-label="Message" 
                      className="w-9 h-9 sm:w-10 sm:h-10 rounded-full flex items-center justify-center bg-[#1D1726] border border-[#7D7E92]/30 text-[#E6D7FA]/70 hover:text-[#C9A4E8] hover:border-[#9A79BA]/60 hover:bg-[#653C87]/30 transition active:scale-90"
                    >
                      <MessageCircle className="w-4 h-4 sm:w-4.5 sm:h-4.5" />
                    </Link>

                    {/* Like (Heart) */}
                    <button 
                      type="button"
                      aria-label="Like"
                      onClick={() => triggerAction(profile.id, 'like')}
                      className={`w-9 h-9 sm:w-10 sm:h-10 rounded-full flex items-center justify-center border transition-all duration-200 active:scale-95 ${
                        isLiked 
                          ? 'text-rose-400 bg-rose-500/20 border-rose-500/60 shadow-[0_0_12px_rgba(244,63,94,0.3)]' 
                          : 'bg-[#1D1726] border-[#7D7E92]/30 text-[#E6D7FA]/70 hover:text-rose-400 hover:border-rose-400/40 hover:bg-[#1D1726]/80'
                      }`}
                    >
                      <Heart className={`w-4 h-4 sm:w-4.5 sm:h-4.5 ${isLiked ? 'fill-rose-500' : ''}`} />
                    </button>

                  </div>
                </div>
              </div>
            );
          })}
        </div>

      </main>

      {/* Persistent Bottom Footer */}
      <Footer />
    </div>
  );
}

export default function DiscoverPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#130f18] text-[#E6D7FA] p-8 text-center text-xs">Loading discover feed...</div>}>
      <DiscoverContent />
    </Suspense>
  );
}
