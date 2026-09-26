'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { 
  Search, Heart, X as XIcon, Star, MessageCircle, 
  MapPin, ShieldCheck, CheckCircle 
} from 'lucide-react';
import { Footer } from '@/components/Footer';

const PRIORITY_ORDER = ['Philippines', 'Thailand', 'Cambodia', 'Vietnam', 'Indonesia', 'Laos'];

const DEMO_PROFILES = [
  {
    id: 'dummy-1',
    name: 'Siriporn',
    age: 25,
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
    location: 'Taguig City, Philippines',
    country: 'Philippines',
    avatarUrl: '/dummy-7.jpg',
    repScore: 95,
    verified: true,
    online: false,
  },
];

export default function DiscoverPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCountry, setSelectedCountry] = useState('All');

  // Compute prioritized countries dynamically based on active profiles
  const availableCountries = Array.from(new Set(DEMO_PROFILES.map((p) => p.country)));
  const sortedCountries = ['All', ...availableCountries.sort((a, b) => {
    const idxA = PRIORITY_ORDER.indexOf(a);
    const idxB = PRIORITY_ORDER.indexOf(b);
    if (idxA !== -1 && idxB !== -1) return idxA - idxB;
    if (idxA !== -1) return -1;
    if (idxB !== -1) return 1;
    return a.localeCompare(b);
  })];

  const filteredProfiles = DEMO_PROFILES.filter((profile) => {
    const matchesCountry = selectedCountry === 'All' || profile.country.toLowerCase() === selectedCountry.toLowerCase();
    const matchesQuery = 
      profile.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      profile.location.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCountry && matchesQuery;
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

        {/* Prioritized Dynamic Country Filters */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
          {sortedCountries.map((country) => {
            const isActive = selectedCountry === country;
            return (
              <button
                key={country}
                onClick={() => setSelectedCountry(country)}
                className={`px-3.5 py-1.5 rounded-full text-xs font-medium transition whitespace-nowrap ${
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
          {filteredProfiles.map((profile) => (
            <div
              key={profile.id}
              className="group relative rounded-3xl overflow-hidden bg-[#1D1726] border border-[#7D7E92]/25 flex flex-col justify-between shadow-lg hover:border-[#9A79BA]/50 transition duration-200"
            >
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

                <div className="flex items-center justify-between pt-1 border-t border-[#9A79BA]/20">
                  <button 
                    aria-label="Pass" 
                    className="p-1.5 rounded-full text-[#E6D7FA]/80 hover:text-white hover:bg-[#241E2F] transition active:scale-90"
                  >
                    <XIcon className="w-3.5 h-3.5" />
                  </button>
                  <button 
                    aria-label="Like" 
                    className="p-1.5 rounded-full text-[#E6D7FA]/80 hover:text-rose-400 hover:bg-[#241E2F] transition active:scale-90"
                  >
                    <Heart className="w-3.5 h-3.5" />
                  </button>
                  <button 
                    aria-label="Favorite" 
                    className="p-1.5 rounded-full text-[#E6D7FA]/80 hover:text-amber-400 hover:bg-[#241E2F] transition active:scale-90"
                  >
                    <Star className="w-3.5 h-3.5" />
                  </button>
                  <Link 
                    href={`/profile/${profile.id}`}
                    aria-label="Message" 
                    className="p-1.5 rounded-full text-[#E6D7FA] hover:text-white hover:bg-[#653C87]/30 transition active:scale-90"
                  >
                    <MessageCircle className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>

      </main>

      {/* Persistent Bottom Footer */}
      <Footer />
    </div>
  );
}