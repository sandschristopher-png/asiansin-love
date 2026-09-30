'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Bookmark, Heart, ArrowRight } from 'lucide-react';

export default function FavoritesPage() {
  const [favorites, setFavorites] = useState<any[]>([]);

  return (
    <main className="flex-1 max-w-4xl mx-auto w-full px-4 sm:px-6 lg:px-8 pt-6 pb-32 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-[#1C1924]">Saved Profiles</h1>
          <p className="text-xs sm:text-sm text-[#756D82] mt-1">
            Members bookmarked for sincere courtship and intentional conversation.
          </p>
        </div>

        <Link
          href="/discover"
          className="hidden sm:inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-white border border-[#DDD7E5] text-xs font-semibold text-[#524B5E] hover:text-[#1C1924] hover:bg-[#F3EFFC] transition shadow-xs"
        >
          <span>Browse</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      {/* Empty or Populated List */}
      <div className="bg-white rounded-3xl border border-[#DDD7E5] p-8 sm:p-12 shadow-xs text-center">
        {favorites.length === 0 ? (
          <div className="space-y-4 max-w-sm mx-auto">
            <div className="w-14 h-14 rounded-full bg-[#F3EFFC] text-[#6555b8] flex items-center justify-center mx-auto shadow-xs">
              <Bookmark className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <h2 className="text-base sm:text-lg font-bold text-[#1C1924]">No Saved Profiles Yet</h2>
              <p className="text-xs sm:text-sm text-[#756D82] leading-relaxed">
                When someone matches your values and relationship goals, bookmark them to keep their profile accessible here.
              </p>
            </div>
            <div className="pt-2">
              <Link
                href="/discover"
                className="inline-flex px-6 py-2.5 rounded-full bg-[#6555b8] hover:bg-[#52449e] text-xs sm:text-sm font-semibold text-white transition active:scale-95 shadow-md"
              >
                Explore Profiles
              </Link>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            {/* Populated items if present */}
          </div>
        )}
      </div>
    </main>
  );
}