'use client';

import React from 'react';
import Link from 'next/link';
import { useFavorites } from '@/lib/favoritesContext';
import { ProfileCard } from '@/components/ProfileCard';

export default function FavoritesPage() {
  const { favorites } = useFavorites();

  return (
    <main className="max-w-6xl mx-auto w-full px-4 sm:px-6 py-6 pb-28 space-y-6">
      
      {/* Clean Uncluttered Header */}
      <div className="flex items-center justify-between gap-4 pb-4 border-b border-[#9A79BA]/30">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            Saved Profiles ({favorites.length})
          </h1>
          <p className="text-sm text-[#E6D7FA] mt-1">
            Members bookmarked for sincere courtship and deeper conversation.
          </p>
        </div>

        <Link
          href="/discover"
          className="px-3.5 py-2 rounded-xl bg-[#261F33] hover:bg-[#2F2540] border border-[#9A79BA]/40 text-[#E6D7FA] hover:text-white text-xs font-bold whitespace-nowrap transition-all active:scale-95 flex-shrink-0"
        >
          ← Browse
        </Link>
      </div>

      {/* Grid or Empty State */}
      {favorites.length > 0 ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-6">
          {favorites.map((profile) => (
            <ProfileCard key={profile.id} profile={profile} />
          ))}
        </div>
      ) : (
        <div className="max-w-md mx-auto py-16 px-4 text-center space-y-5">
          <div className="h-16 w-16 mx-auto rounded-3xl bg-[#241E2F] border border-[#725A7A]/40 flex items-center justify-center text-[#B8AAC3] shadow-inner">
            <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
            </svg>
          </div>

          <div className="space-y-1.5">
            <h2 className="text-xl font-black text-white">No Saved Profiles Yet</h2>
            <p className="text-sm text-[#E6D7FA] leading-relaxed">
              When someone matches your values and relationship goals, tap the star on their card to bookmark them here.
            </p>
          </div>

          <Link
            href="/discover"
            className="inline-block px-6 py-3 rounded-2xl bg-[#653C87] hover:bg-[#7A49A2] text-white text-xs font-extrabold tracking-wide uppercase shadow-lg shadow-[#653C87]/40 active:scale-95 transition-all"
          >
            Explore Profiles
          </Link>
        </div>
      )}

    </main>
  );
}