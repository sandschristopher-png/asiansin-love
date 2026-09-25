'use client';

import React, { useState } from 'react';
import { ProfileCard } from '@/components/ProfileCard';
import { DUMMY_PROFILES } from '@/lib/dummyProfiles';

const REGIONS = ['All', 'Philippines', 'Thailand', 'Cambodia', 'Laos'];

export default function DiscoverPage() {
  const [selectedRegion, setSelectedRegion] = useState('All');
  const [verifiedOnly, setVerifiedOnly] = useState(false);

  const filteredProfiles = DUMMY_PROFILES.filter((profile) => {
    const matchesRegion =
      selectedRegion === 'All' || profile.country.toLowerCase() === selectedRegion.toLowerCase();
    const matchesVerified = verifiedOnly ? profile.isVerified : true;
    return matchesRegion && matchesVerified;
  });

  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-10 space-y-6">
      
      {/* Header Block */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            Explore Singles
          </h1>
          <p className="text-xs sm:text-sm text-[#DDD8D4] mt-1">
            Verified members seeking genuine, long-term connections across Southeast Asia.
          </p>
        </div>

        {/* Verified Only Toggle */}
        <button
          type="button"
          onClick={() => setVerifiedOnly(!verifiedOnly)}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all border self-start sm:self-auto ${
            verifiedOnly
              ? 'bg-[#653C87] border-[#978FA8] text-white shadow-md'
              : 'bg-[#241E2F] border-[#725A7A]/35 text-[#DDD8D4] hover:text-white'
          }`}
        >
          <span>{verifiedOnly ? '✓' : '○'}</span>
          <span>Verified Only</span>
        </button>
      </div>

      {/* Region Filter Pills */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
        {REGIONS.map((region) => {
          const active = selectedRegion === region;
          return (
            <button
              key={region}
              onClick={() => setSelectedRegion(region)}
              className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all border ${
                active
                  ? 'bg-[#653C87] border-[#978FA8]/40 text-white shadow-md'
                  : 'bg-[#241E2F] border-[#725A7A]/30 text-[#DDD8D4] hover:text-white hover:border-[#725A7A]/60'
              }`}
            >
              {region}
            </button>
          );
        })}
      </div>

      {/* Profile Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-6">
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
            }}
          />
        ))}
      </div>

      {filteredProfiles.length === 0 && (
        <div className="text-center py-16 text-[#B8AAC3] space-y-2">
          <p className="text-base font-bold text-white">No profiles match your criteria.</p>
          <p className="text-xs">Try switching regions or turning off the verified filter.</p>
        </div>
      )}

    </main>
  );
}