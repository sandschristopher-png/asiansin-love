'use client';

import React, { useState, useRef, useEffect } from 'react';
import { ProfileCard, ProfileSummary } from '@/components/ProfileCard';

const DISCOVER_PROFILES: ProfileSummary[] = [
  {
    id: 'demo-1',
    fullName: 'Camille',
    age: 26,
    city: 'Makati',
    country: 'Philippines',
    avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=800&auto=format&fit=crop',
    isVerified: true,
    relationshipIntent: 'Long-Term Relationship',
    jobTitle: 'Software QA Lead',
    isOnline: true,
  },
  {
    id: 'demo-2',
    fullName: 'Siriporn',
    age: 28,
    city: 'Bangkok',
    country: 'Thailand',
    avatarUrl: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?q=80&w=800&auto=format&fit=crop',
    isVerified: true,
    relationshipIntent: 'Committed Relationship',
    jobTitle: 'Hospitality Manager',
    isOnline: true,
  },
  {
    id: 'demo-3',
    fullName: 'Lian',
    age: 25,
    city: 'Cebu City',
    country: 'Philippines',
    avatarUrl: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?q=80&w=800&auto=format&fit=crop',
    isVerified: true,
    relationshipIntent: 'Meaningful Connection',
    jobTitle: 'Registered Nurse',
    isOnline: false,
  },
  {
    id: 'demo-4',
    fullName: 'Ananya',
    age: 27,
    city: 'Chiang Mai',
    country: 'Thailand',
    avatarUrl: 'https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?q=80&w=800&auto=format&fit=crop',
    isVerified: true,
    relationshipIntent: 'Long-Term Relationship',
    jobTitle: 'Graphic Designer',
    isOnline: false,
  },
  {
    id: 'demo-5',
    fullName: 'Maricel',
    age: 29,
    city: 'Davao City',
    country: 'Philippines',
    avatarUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=800&auto=format&fit=crop',
    isVerified: true,
    relationshipIntent: 'Meaningful Connection',
    jobTitle: 'Executive Assistant',
    isOnline: true,
  },
  {
    id: 'demo-6',
    fullName: 'Thi Mai',
    age: 24,
    city: 'Da Nang',
    country: 'Vietnam',
    avatarUrl: 'https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?q=80&w=800&auto=format&fit=crop',
    isVerified: true,
    relationshipIntent: 'Committed Relationship',
    jobTitle: 'Tourism Coordinator',
    isOnline: false,
  },
  {
    id: 'demo-7',
    fullName: 'Jasmine',
    age: 26,
    city: 'Quezon City',
    country: 'Philippines',
    avatarUrl: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?q=80&w=800&auto=format&fit=crop',
    isVerified: true,
    relationshipIntent: 'Long-Term Relationship',
    jobTitle: 'Financial Analyst',
    isOnline: true,
  },
  {
    id: 'demo-8',
    fullName: 'Ploy',
    age: 25,
    city: 'Phuket',
    country: 'Thailand',
    avatarUrl: 'https://images.unsplash.com/photo-1508214751196-bcfd4ca60f91?q=80&w=800&auto=format&fit=crop',
    isVerified: true,
    relationshipIntent: 'Meaningful Connection',
    jobTitle: 'Boutique Owner',
    isOnline: false,
  },
  {
    id: 'demo-9',
    fullName: 'Danica',
    age: 27,
    city: 'Taguig',
    country: 'Philippines',
    avatarUrl: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?q=80&w=800&auto=format&fit=crop',
    isVerified: true,
    relationshipIntent: 'Long-Term Relationship',
    jobTitle: 'Account Manager',
    isOnline: true,
  },
  {
    id: 'demo-10',
    fullName: 'Kanya',
    age: 26,
    city: 'Pattaya',
    country: 'Thailand',
    avatarUrl: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?q=80&w=800&auto=format&fit=crop',
    isVerified: true,
    relationshipIntent: 'Committed Relationship',
    jobTitle: 'Hotel Front Desk',
    isOnline: false,
  }
];

const MORE_REGIONS = ['Singapore', 'Malaysia', 'Cambodia', 'Indonesia', 'Laos'];

export default function DiscoverPage() {
  const [selectedRegion, setSelectedRegion] = useState('All');
  const [verifiedOnly, setVerifiedOnly] = useState(false);
  const [moreDropdownOpen, setMoreDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setMoreDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filteredProfiles = DISCOVER_PROFILES.filter((p) => {
    const matchesRegion =
      selectedRegion === 'All' ||
      p.city.toLowerCase().includes(selectedRegion.toLowerCase()) ||
      p.country.toLowerCase().includes(selectedRegion.toLowerCase());

    const matchesVerified = !verifiedOnly || p.isVerified;
    return matchesRegion && matchesVerified;
  });

  const isMoreRegionActive = MORE_REGIONS.includes(selectedRegion);

  return (
    <main className="max-w-7xl mx-auto w-full px-3 sm:px-6 lg:px-8 py-5 flex-1">
      {/* Streamlined Top Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-[#725A7A]/25 pb-3.5 mb-5">
        <div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight font-[family-name:var(--font-nunito)]">
            Explore Singles
          </h1>
          <p className="text-xs sm:text-sm text-[#DDD8D4] mt-0.5 font-normal">
            Verified members seeking genuine, long-term connections.
          </p>
        </div>

        {/* Themed Filter Pills */}
        <div className="flex flex-wrap items-center gap-2">
          {['All', 'Philippines', 'Thailand', 'Vietnam'].map((region) => (
            <button
              key={region}
              type="button"
              onClick={() => {
                setSelectedRegion(region);
                setMoreDropdownOpen(false);
              }}
              className={`px-3 py-1.5 rounded-xl text-xs sm:text-sm font-bold transition-all ${
                selectedRegion === region
                  ? 'bg-[#653C87] text-white shadow-sm'
                  : 'bg-[#241E2F] border border-[#725A7A]/35 text-[#DDD8D4] hover:text-white hover:border-[#978FA8]'
              }`}
            >
              {region}
            </button>
          ))}

          {/* Custom Styled "More Regions" Dropdown */}
          <div className="relative" ref={dropdownRef}>
            <button
              type="button"
              onClick={() => setMoreDropdownOpen(!moreDropdownOpen)}
              className={`px-3 py-1.5 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center gap-1.5 ${
                isMoreRegionActive
                  ? 'bg-[#653C87] text-white shadow-sm'
                  : 'bg-[#241E2F] border border-[#725A7A]/35 text-[#DDD8D4] hover:text-white hover:border-[#978FA8]'
              }`}
            >
              <span>{isMoreRegionActive ? selectedRegion : 'More Regions'}</span>
              <span className="text-[9px] transition-transform duration-200">
                {moreDropdownOpen ? '▲' : '▼'}
              </span>
            </button>

            {/* Dropdown Menu adhering strictly to the Master Theme */}
            {moreDropdownOpen && (
              <div className="absolute left-0 sm:right-0 sm:left-auto top-full mt-2 w-44 rounded-2xl bg-[#241E2F] border border-[#725A7A]/40 shadow-2xl py-1.5 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                <div className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-[#978FA8] border-b border-[#725A7A]/20">
                  Select Country
                </div>
                {MORE_REGIONS.map((country) => (
                  <button
                    key={country}
                    type="button"
                    onClick={() => {
                      setSelectedRegion(country);
                      setMoreDropdownOpen(false);
                    }}
                    className={`w-full text-left px-3.5 py-2 text-xs font-bold transition-colors flex items-center justify-between ${
                      selectedRegion === country
                        ? 'bg-[#653C87] text-white'
                        : 'text-[#DDD8D4] hover:bg-[#17131F] hover:text-white'
                    }`}
                  >
                    <span>{country}</span>
                    {selectedRegion === country && <span className="text-[10px]">✓</span>}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Verified Only Toggle */}
          <button
            type="button"
            onClick={() => setVerifiedOnly(!verifiedOnly)}
            className={`px-3 py-1.5 rounded-xl text-xs sm:text-sm font-bold border transition-all ${
              verifiedOnly
                ? 'bg-emerald-950 border-emerald-500 text-emerald-300'
                : 'bg-[#241E2F] border-[#725A7A]/35 text-[#DDD8D4] hover:text-white hover:border-[#978FA8]'
            }`}
          >
            {verifiedOnly ? '✓ Verified Only' : 'All Profiles'}
          </button>
        </div>
      </div>

      {/* 5-Column Grid */}
      {filteredProfiles.length === 0 ? (
        <div className="py-16 text-center text-sm text-[#DDD8D4]">
          No profiles found for this region yet. Check back soon!
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 sm:gap-4">
          {filteredProfiles.map((p) => (
            <ProfileCard key={p.id} profile={p} />
          ))}
        </div>
      )}
    </main>
  );
}
