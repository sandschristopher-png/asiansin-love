'use client';

import React, { useState, useEffect } from 'react';
import ProfileCard from '@/components/ProfileCard';
import { getLocalInteractions, toggleInteraction, undoPass } from '@/lib/interactions';

const DEMO_PROFILES = [
  {
    id: 'camille-1',
    name: 'Camille',
    age: 28,
    city: 'Makati',
    country: 'Philippines',
    avatarUrl: '/dummy-1.jpg',
    repScore: 98,
    headline: 'Kind-hearted creative exploring the world, passionate about family.',
    isVerified: true,
    isOnline: true,
  },
  {
    id: 'sothea-2',
    name: 'Sothea',
    age: 26,
    city: 'Phnom Penh',
    country: 'Cambodia',
    avatarUrl: '/dummy-2.jpg',
    repScore: 95,
    headline: 'Architectural assistant who loves cafe hopping and watercolor.',
    isVerified: true,
    isOnline: false,
  },
  {
    id: 'linh-3',
    name: 'Thao Linh',
    age: 27,
    city: 'Da Nang',
    country: 'Vietnam',
    avatarUrl: '/dummy-3.jpg',
    repScore: 99,
    headline: 'Hospitality professional dreaming of cross-border adventures.',
    isVerified: true,
    isOnline: true,
  }
];

export default function DiscoverPage() {
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

  const handleToggle = async (id: string, type: 'like' | 'save' | 'pass') => {
    await toggleInteraction(id, type);
    setInteractions(getLocalInteractions());
  };

  const handleUndo = async (id: string) => {
    await undoPass(id);
    setInteractions(getLocalInteractions());
  };

  const filtered = activeCountry === 'All' 
    ? DEMO_PROFILES 
    : DEMO_PROFILES.filter(p => p.country.toLowerCase().includes(activeCountry.toLowerCase()));

  return (
    <main className="min-h-screen bg-[#15101C] text-[#E6D7FA] pb-24 px-4 pt-4 max-w-lg mx-auto">
      {/* Country Filter Bar */}
      <div className="flex items-center gap-2 overflow-x-auto pb-3 scrollbar-none">
        {['All', 'Philippines', 'Cambodia', 'Vietnam', 'Thailand'].map(country => (
          <button
            key={country}
            onClick={() => setActiveCountry(country)}
            className={`px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition ${
              activeCountry === country
                ? 'bg-[#653C87] text-[#E6D7FA] shadow-md'
                : 'bg-[#241E2F] text-[#7D7E92] hover:text-[#E6D7FA]'
            }`}
          >
            {country}
          </button>
        ))}
      </div>

      {/* Discovery Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 mt-2">
        {filtered.map(profile => (
          <ProfileCard
            key={profile.id}
            profile={profile}
            isPassed={interactions.passed.includes(profile.id)}
            isLiked={interactions.liked.includes(profile.id)}
            isSaved={interactions.saved.includes(profile.id)}
            onPass={(id) => handleToggle(id, 'pass')}
            onUndoPass={handleUndo}
            onLike={(id) => handleToggle(id, 'like')}
            onSave={(id) => handleToggle(id, 'save')}
          />
        ))}
      </div>
    </main>
  );
}