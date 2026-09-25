'use client';

import React from 'react';
import Link from 'next/link';
import { ProfileCard } from '@/components/ProfileCard';
import { useFavorites } from '@/lib/favoritesContext';

export default function FavoritesPage() {
  const { favorites } = useFavorites();

  return (
    <main className="max-w-7xl mx-auto w-full px-3 sm:px-6 lg:px-8 py-5 flex-1">
      <div className="flex items-center justify-between border-b border-[#725A7A]/25 pb-3.5 mb-5">
        <div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight font-[family-name:var(--font-nunito)]">
            Saved Profiles ({favorites.length})
          </h1>
          <p className="text-xs sm:text-sm text-[#DDD8D4] mt-0.5 font-normal">
            Members you have bookmarked for genuine courtship.
          </p>
        </div>

        <Link
          href="/discover"
          className="px-3 py-1.5 rounded-xl bg-[#241E2F] border border-[#725A7A]/35 text-xs sm:text-sm font-bold text-[#DDD8D4] hover:text-white transition-colors"
        >
          ← Browse Directory
        </Link>
      </div>

      {favorites.length === 0 ? (
        <div className="max-w-md mx-auto py-16 text-center space-y-4">
          <div className="h-16 w-16 mx-auto rounded-full bg-[#241E2F] border border-[#725A7A]/30 flex items-center justify-center text-2xl">
            ⭐
          </div>
          <h2 className="text-lg font-bold text-white">No Saved Profiles Yet</h2>
          <p className="text-xs sm:text-sm text-[#DDD8D4] leading-relaxed">
            When you see someone who matches your values and relationship goals, tap the star on their photo to save them here.
          </p>
          <Link
            href="/discover"
            className="inline-block px-6 py-2.5 rounded-xl bg-[#653C87] hover:bg-[#7A49A2] text-white font-bold text-xs sm:text-sm shadow-md transition-all"
          >
            Explore Profiles
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 sm:gap-4">
          {favorites.map((p) => (
            <ProfileCard key={p.id} profile={p} />
          ))}
        </div>
      )}
    </main>
  );
}
