'use client';

import React, { useState } from 'react';
import { ProfileCard } from '@/components/ProfileCard';
import { DUMMY_PROFILES } from '@/lib/dummyProfiles';

// Ordered by online dating activity & adoption priority
const REGIONS = ['All', 'Philippines', 'Thailand', 'Vietnam', 'Cambodia', 'Laos'];

export default function DiscoverPage() {
  const [selectedRegion, setSelectedRegion] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [verifiedOnly, setVerifiedOnly] = useState(false);

  const filteredProfiles = DUMMY_PROFILES.filter((profile) => {
    const matchesRegion =
      selectedRegion === 'All' || profile.country.toLowerCase() === selectedRegion.toLowerCase();
    const matchesVerified = verifiedOnly ? profile.isVerified : true;
    const matchesSearch =
      profile.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      profile.city.toLowerCase().includes(searchQuery.toLowerCase()) ||
      profile.country.toLowerCase().includes(searchQuery.toLowerCase());

    return matchesRegion && matchesVerified && matchesSearch;
  });

  return (
    <main className="max-w-7xl mx-auto px-3 sm:px-6 py-4 sm:py-8 space-y-4">
      
      {/* Search Bar */}
      <div className="relative w-full">
        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#725A7A]">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search by name, city, or interests..."
          className="w-full pl-10 pr-4 py-3 rounded-2xl bg-[#241E2F] border border-[#725A7A]/35 text-white placeholder-[#725A7A] text-sm focus:outline-none focus:border-[#978FA8] shadow-sm"
        />
      </div>

      {/* Country Filters - Priority Ordered with Smooth Mobile Scroll */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none select-none">
        {REGIONS.map((region) => {
          const active = selectedRegion === region;
          return (
            <button
              key={region}
              type="button"
              onClick={() => setSelectedRegion(region)}
              className={`px-4 py-2 rounded-xl text-xs font-extrabold whitespace-nowrap transition-all border active:scale-95 ${
                active
                  ? 'bg-[#653C87] border-[#978FA8]/40 text-white shadow-md'
                  : 'bg-[#241E2F] border-[#725A7A]/30 text-[#DDD8D4] hover:text-white hover:border-[#9A79BA]/40'
              }`}
            >
              {region}
            </button>
          );
        })}
      </div>

      {/* Profile Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2.5 sm:gap-6 pt-1">
        {filteredProfiles.map((profile) => (
          <ProfileCard
            key={profile.id}
            profile={{
              id: profile.id,
              fullName: profile.fullName,
              age: profile.age,
              city: profile.city,
              country: profile.country,
              avatarUrl: profile.avatarUrl,
              isVerified: profile.isVerified,
              relationshipIntent: profile.relationshipGoal,
              jobTitle: profile.profession,
              isOnline: profile.isOnline,
              reputationScore: profile.reputationScore,
            }}
          />
        ))}
      </div>

      {filteredProfiles.length === 0 && (
        <div className="text-center py-16 text-[#B8AAC3] space-y-2">
          <p className="text-base font-bold text-white">No profiles match your search.</p>
          <p className="text-xs">Try clearing the search query or switching regions.</p>
        </div>
      )}

    </main>
  );
}