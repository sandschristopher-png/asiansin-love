'use client';

import React from 'react';
import Link from 'next/link';

export default function HomePage() {
  return (
    <main className="max-w-4xl mx-auto w-full px-4 sm:px-6 py-12 sm:py-20 flex-1 flex flex-col justify-center text-center">
      
      {/* Hero Headline & Subtitle */}
      <div className="space-y-4 max-w-3xl mx-auto">
        <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-white tracking-tight leading-tight font-[family-name:var(--font-nunito)]">
          Genuine Courtship with Sincere Southeast Asian Singles.
        </h1>
        <p className="text-sm sm:text-base md:text-lg text-[#DDD8D4] max-w-2xl mx-auto font-normal leading-relaxed">
          A welcoming, dignified community connecting international gentlemen with verified singles across the Philippines, Thailand, and Southeast Asia.
        </p>
      </div>

      {/* Single Focused Action Button */}
      <div className="mt-8 flex justify-center">
        <Link
          href="/discover"
          className="px-8 py-3.5 rounded-2xl bg-[#653C87] hover:bg-[#7A49A2] text-white font-bold text-sm sm:text-base shadow-lg shadow-[#41384E]/50 transition-all active:scale-[0.98]"
        >
          Explore Profiles
        </Link>
      </div>

      {/* Grounded Mission */}
      <div className="mt-14 pt-8 border-t border-[#725A7A]/20 max-w-2xl mx-auto text-left sm:text-center space-y-3">
        <h2 className="text-base sm:text-lg font-bold text-white text-center">
          Modern Dating, Sincere Intentions
        </h2>
        <p className="text-xs sm:text-sm text-[#DDD8D4] leading-relaxed">
          Most international dating sites look like they haven’t been updated since 2005—cluttered interfaces, hidden paywalls, and endless fakes. We built <span className="text-white font-semibold">asiansin.love</span> to feel like a modern, welcoming home: clean design, mutual respect, and real humans. Whether you're in Las Vegas, Manila, Bangkok, or Cebu, everyone deserves a safe, pressure-free space to build a lifelong connection.
        </p>
      </div>

    </main>
  );
}
