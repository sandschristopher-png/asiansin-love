'use client';

import React from 'react';
import Link from 'next/link';

export default function HomePage() {
  return (
    <main className="max-w-4xl mx-auto w-full px-4 sm:px-6 py-10 sm:py-16 flex-1 flex flex-col justify-center text-center">
      
      {/* Hero Headline & Subtitle */}
      <div className="space-y-4 max-w-3xl mx-auto">
        <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-white tracking-tight leading-tight font-[family-name:var(--font-nunito)]">
          Genuine Courtship with Sincere Southeast Asian Singles.
        </h1>
        <p className="text-sm sm:text-base md:text-lg text-[#DDD8D4] max-w-2xl mx-auto font-normal leading-relaxed">
          A welcoming, dignified community connecting international gentlemen with verified singles across the Philippines, Thailand, and Southeast Asia.
        </p>
      </div>

      {/* Action Button */}
      <div className="mt-8 flex justify-center">
        <Link
          href="/discover"
          className="px-8 py-3.5 rounded-2xl bg-[#653C87] hover:bg-[#7A49A2] text-white font-bold text-sm sm:text-base shadow-lg shadow-[#41384E]/50 transition-all active:scale-[0.98]"
        >
          Explore Profiles
        </Link>
      </div>

      {/* Styled Modern Card for Platform Overview */}
      <div className="mt-14 max-w-2xl mx-auto p-6 sm:p-7 rounded-3xl bg-[#241E2F]/80 border border-[#725A7A]/35 shadow-xl text-left sm:text-center space-y-2.5">
        <h2 className="text-base sm:text-lg font-bold text-white tracking-wide">
          What We Do
        </h2>
        <p className="text-xs sm:text-sm text-[#DDD8D4] leading-relaxed">
          <span className="text-white font-semibold">asiansin.love</span> is a direct, verified dating platform built for sincere cross-border relationships. We offer clear direct messaging, automatic safeguards against financial requests[cite: 2], and instant gesture photo verification so you can connect with real women seeking lifelong companionship.
        </p>
        <p className="text-xs sm:text-sm text-[#B8AAC3] leading-relaxed italic pt-1 border-t border-[#725A7A]/20">
          While most sites in this space feel frozen in 2001 with clunky tables and pay-per-letter gimmicks, we keep it clean, modern, and respectful for everyone.
        </p>
      </div>

    </main>
  );
}
