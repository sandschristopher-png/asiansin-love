'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { 
  Search, Heart, X as XIcon, Star, MessageCircle, 
  MapPin, ShieldCheck, CheckCircle 
} from 'lucide-react';
import { Footer } from '@/components/Footer';
import { createClient } from '@/lib/supabase/client';

const PRIORITY_ORDER = ['Philippines', 'Thailand', 'Cambodia', 'Vietnam', 'Indonesia', 'Laos'];

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
  },
  {
    id: 'dummy-3',
    name: 'Maricel',
    age: 28,
    gender: 'woman',
    location: 'Caayaan, Samar',
    country: 'Philippines',
    avatarUrl: '/dummy-3.jpg',
    repScore: 97,
    verified: true,
    online: false,
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
  },
];

type ActionType = 'pass' | 'star' | 'like';

export default function DiscoverPage() {
  const [supabase] = useState(() => createClient());
  const [profiles, setProfiles] = useState<ProfileItem[]>(DEMO_PROFILES);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCountry, setSelectedCountry] = useState('All');
  const [selectedGender, setSelectedGender] = useState<'All' | 'woman' | 'man' | 'trans'>('All');
  const [cardActions, setCardActions] = useState<Record<string, ActionType>>({});

  const triggerAction = (id: string, action: ActionType) => {
    setCardActions((prev) => ({
      ...prev,
      [id]: prev[id] === action ? (null as any) : action,
    }));
  };

  useEffect(() => {
    async function loadLiveProfiles() {
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('id, display_name, full_name, username, age, gender, city, country, avatar_url, is_verified, reputation_score, last_active')
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
    return matchesCountry && matchesGender && matchesQuery;
  });

  return (
    <div className="min-h-screen flex flex-col bg-[#130f18] text-[#E6D7FA]">
      <main className="flex-1 max-w-6xl mx-auto w-full px-4 sm:px-6 pt-5 pb-16 space-y-4">
        
        {/* Search Bar */}
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#A8A2AB]" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by name, city, or interests..."
            className="w-full pl-11 pr-4 py-2.5 rounded-2xl bg-[#261F33] border border-[#9A79BA]/40 text-sm text-white placeholder-[#9A79BA]/70 shadow-lg focus:outline-none focus:border-[#9A79BA] transition"
          />
        </div>

        {/* Gender Filter Tabs */}
        <div className="flex items-center gap-2">
          {(['All', 'woman', 'man', 'trans'] as const).map((genderOption) => {
            const isActive = selectedGender === genderOption;
            const label = genderOption === 'All' ? 'All' : genderOption === 'woman' ? 'Women' : genderOption === 'man' ? 'Men' : 'Trans';
            return (
              <button
                key={genderOption}
                onClick={() => setSelectedGender(genderOption)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition ${
                  isActive
                    ? 'bg-[#653C87] text-white shadow-md shadow-[#653C87]/40'
                    : 'bg-[#261F33] border border-[#9A79BA]/25 text-[#E6D7FA]/80 hover:text-white hover:border-[#9A79BA]/60'
                }`}
              >
                {label}
              </button>
            );
          })}
        </div>

        {/* Prioritized Dynamic Country Filters */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
          {sortedCountries.map((country) => {
            const isActive = selectedCountry === country;
            return (
              <button
                key={country}
                onClick={() => setSelectedCountry(country)}
                className={`px-3.5 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition ${
                  isActive
                    ? 'bg-[#653C87] text-white font-bold shadow-md shadow-[#653C87]/40'
                    : 'bg-[#261F33] border border-[#9A79BA]/35 text-[#E6D7FA] hover:text-white hover:border-[#9A79BA] hover:bg-[#653C87]/20 shadow-sm'
                }`}
              >
                {country}
              </button>
            );
          })}
        </div>

        {/* Catalog Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 gap-3 sm:gap-4 pt-1">
          {filteredProfiles.map((profile) => {
            const state = cardActions[profile.id];
            const isPassed = state === 'pass';
            const isLiked = state === 'like';
            const isStarred = state === 'star';

            return (
              <div
                key={profile.id}
                className={`group relative rounded-3xl overflow-hidden bg-[#1D1726] border flex flex-col justify-between shadow-lg transition-all duration-300 ${
                  isPassed
                    ? 'opacity-40 grayscale border-zinc-800 scale-[0.98]'
                    : isLiked
                    ? 'border-rose-500/50 shadow-rose-950/20 shadow-xl'
                    : isStarred
                    ? 'border-amber-400/50 shadow-amber-950/20 shadow-xl'
                    : 'border-[#7D7E92]/25 hover:border-[#9A79BA]/50'
                }`}
              >
                {/* Passed Badge Overlay */}
                {isPassed && (
                  <div className="absolute inset-0 z-30 flex items-center justify-center bg-black/60 backdrop-blur-[2px] pointer-events-none transition-all">
                    <span className="px-3.5 py-1 rounded-full text-[11px] font-bold tracking-widest uppercase bg-zinc-900/90 text-zinc-300 border border-zinc-700/80 shadow-2xl">
                      Passed
                    </span>
                  </div>
                )}

                {/* Photo Area */}
                <Link href={`/profile/${profile.id}`} className="block relative aspect-[4/5] w-full overflow-hidden">
                  <Image
                    src={profile.avatarUrl}
                    alt={profile.name}
                    fill
                    sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw"
                    className="object-cover group-hover:scale-105 transition duration-300"
                  />

                  {profile.online && (
                    <div className="absolute top-2.5 left-2.5 flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-black/60 backdrop-blur-md text-[10px] font-medium text-white">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                      Online
                    </div>
                  )}

                  <div className="absolute top-2.5 right-2.5 flex items-center gap-1 px-2 py-0.5 rounded-full bg-black/60 backdrop-blur-md text-[10px] font-medium text-[#E6D7FA]">
                    <ShieldCheck className="w-3 h-3 text-[#C9A4E8]" />
                    <span>{profile.repScore}%</span>
                  </div>

                  <div className="absolute inset-0 bg-gradient-to-t from-[#1D1726] via-transparent to-transparent opacity-80" />
                </Link>

                {/* Profile Details & Quick Actions */}
                <div className="p-3.5 space-y-2 bg-[#261F33]">
                  <Link href={`/profile/${profile.id}`} className="block">
                    <h3 className="text-base font-bold text-white flex items-center gap-1.5 truncate">
                      {profile.name}, {profile.age}
                      {profile.verified && <CheckCircle className="w-3.5 h-3.5 text-[#9A79BA] shrink-0" />}
                    </h3>
                    <p className="text-xs font-semibold text-[#E6D7FA] flex items-center gap-1.5 truncate mt-1">
                      <MapPin className="w-3 h-3 shrink-0" />
                      {profile.location}
                    </p>
                  </Link>

                  {/* Option 2 Action Bar: [ X ] [ Star ] [ Chat ] [ Heart ] */}
                  <div className="flex items-center justify-between pt-1 border-t border-[#9A79BA]/20">
                    {/* Pass (X) */}
                    <button 
                      type="button"
                      aria-label="Pass"
                      onClick={() => triggerAction(profile.id, 'pass')}
                      className={`p-2 rounded-full transition-all duration-150 active:scale-75 ${
                        isPassed 
                          ? 'text-zinc-500 bg-zinc-800/80 scale-95' 
                          : 'text-[#E6D7FA]/80 hover:text-white hover:bg-[#1D1726]'
                      }`}
                    >
                      <XIcon className="w-5 h-5 transition-transform" />
                    </button>

                    {/* Star / Super Like */}
                    <button 
                      type="button"
                      aria-label="Favorite"
                      onClick={() => triggerAction(profile.id, 'star')}
                      className={`p-2 rounded-full transition-all duration-200 active:scale-125 ${
                        isStarred 
                          ? 'text-amber-400 bg-amber-400/10 scale-110 drop-shadow-[0_0_8px_rgba(251,191,36,0.6)]' 
                          : 'text-[#E6D7FA]/80 hover:text-amber-400 hover:bg-[#1D1726]'
                      }`}
                    >
                      <Star className={`w-5 h-5 transition-transform ${isStarred ? 'fill-amber-400' : ''}`} />
                    </button>

                    {/* Message / Chat */}
                    <Link 
                      href={`/profile/${profile.id}`}
                      aria-label="Message" 
                      className="p-2 rounded-full text-[#E6D7FA] hover:text-white hover:bg-[#653C87]/40 transition active:scale-75"
                    >
                      <MessageCircle className="w-5 h-5" />
                    </Link>

                    {/* Like (Heart) */}
                    <button 
                      type="button"
                      aria-label="Like"
                      onClick={() => triggerAction(profile.id, 'like')}
                      className={`p-2 rounded-full transition-all duration-200 active:scale-125 ${
                        isLiked 
                          ? 'text-rose-500 bg-rose-500/10 scale-110 drop-shadow-[0_0_8px_rgba(244,63,94,0.6)]' 
                          : 'text-[#E6D7FA]/80 hover:text-rose-400 hover:bg-[#1D1726]'
                      }`}
                    >
                      <Heart className={`w-5 h-5 transition-transform ${isLiked ? 'fill-rose-500' : ''}`} />
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
