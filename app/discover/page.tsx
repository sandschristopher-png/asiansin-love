'use client';

import React, { useState, useEffect } from 'react';
import { Search } from 'lucide-react';
import ProfileCard from '@/components/ProfileCard';
import { getLocalInteractions, toggleInteraction, undoPass } from '@/lib/interactions';

const DEMO_PROFILES = [
  {
    id: 'camille-1',
    name: 'Camille',
    age: 26,
    city: 'Makati',
    country: 'Philippines',
    avatarUrl: '/dummy-1.jpg',
    repScore: 100,
    isVerified: true,
    isOnline: true,
  },
  {
    id: 'maricel-2',
    name: 'Maricel',
    age: 33,
    city: 'Cebu',
    country: 'Philippines',
    avatarUrl: '/dummy-2.jpg',
    repScore: 100,
    isVerified: true,
    isOnline: false,
  },
  {
    id: 'sothea-3',
    name: 'Sothea',
    age: 27,
    city: 'Phnom Penh',
    country: 'Cambodia',
    avatarUrl: '/dummy-3.jpg',
    repScore: 98,
    isVerified: true,
    isOnline: false,
  },
  {
    id: 'chhay-4',
    name: 'Chhay',
    age: 29,
    city: 'Siem Reap',
    country: 'Cambodia',
    avatarUrl: '/dummy-1.jpg',
    repScore: 96,
    isVerified: true,
    isOnline: false,
  }
];

export default function DiscoverPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCountry, setActiveCountry] = useState('All');
  const [interactions, setInteractions] = useState<{ liked: string[]; saved: string[]; passed: string[] }>({
    liked: [],
    saved: [],
    passed: [],
  });

  useEffect(() => {
    setInteractions(getLocalInteractions());
    const handleSync = () => setInteractions(getLocalInteractions());
    window.addEventListener('ail-interaction-sync', handleSync);
    return () => window.removeEventListener('ail-interaction-sync', handleSync);
  }, []);

  const handleToggle = async (id: string, type: 'like' | 'pass') => {
    await toggleInteraction(id, type);
    setInteractions(getLocalInteractions());
  };

  const handleUndo = async (id: string) => {
    await undoPass(id);
    setInteractions(getLocalInteractions());
  };

  const filtered = DEMO_PROFILES.filter((p) => {
    const matchesCountry =
      activeCountry === 'All' || p.country.toLowerCase() === activeCountry.toLowerCase();
    const matchesSearch =
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.city.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.country.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCountry && matchesSearch;
  });

  return (
    <main className="min-h-screen bg-[#130f18] text-[#E6D7FA] pb-24 px-4 pt-3 max-w-md mx-auto">
      {/* Search Input */}
      <div className="relative mb-3">
        <Search className="w-4 h-4 text-[#8e849c] absolute left-3.5 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search by name, city, or interests..."
          className="w-full bg-[#1d1625] border border-[#2b2236] focus:border-[#653C87] rounded-full pl-10 pr-4 py-2 text-xs text-[#E6D7FA] placeholder-[#8e849c] outline-none transition"
        />
      </div>

      {/* Country Filter Chips */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-3 scrollbar-none">
        {['All', 'Philippines', 'Thailand', 'Cambodia', 'Laos'].map((country) => (
          <button
            key={country}
            onClick={() => setActiveCountry(country)}
            className={`px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap transition ${
              activeCountry === country
                ? 'bg-[#653C87] text-white shadow-sm'
                : 'bg-[#1d1625] text-[#8e849c] hover:text-[#E6D7FA]'
            }`}
          >
            {country}
          </button>
        ))}
      </div>

      {/* Compact 2-Column Grid */}
      <div className="grid grid-cols-2 gap-3 mt-1">
        {filtered.map((profile) => (
          <ProfileCard
            key={profile.id}
            profile={profile}
            isPassed={interactions.passed.includes(profile.id)}
            isLiked={interactions.liked.includes(profile.id)}
            onPass={(id) => handleToggle(id, 'pass')}
            onUndoPass={handleUndo}
            onLike={(id) => handleToggle(id, 'like')}
          />
        ))}
      </div>
    </main>
  );
}