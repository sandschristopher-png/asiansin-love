'use client';

import React from 'react';
import Link from 'next/link';

export default function HomePage() {
  return (
    <main className="max-w-4xl mx-auto w-full px-4 sm:px-6 py-12 sm:py-20 flex-1 flex flex-col justify-center text-center">
      
      {/* Playful Eyebrow Badge */}
      <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-[#241E2F] border border-[#725A7A]/35 text-[#E6D7FA] text-xs font-bold mx-auto mb-3 shadow-md">
        <span>✨</span> Dating designed for real people (not 2005)
      </div>

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

      {/* Friendly Legacy Jab & Mission */}
      <div className="mt-14 pt-8 border-t border-[#725A7A]/20 max-w-2xl mx-auto text-left sm:text-center space-y-3">
        <h2 className="text-base sm:text-lg font-bold text-white text-center">
          Leaving the 2000s in the Past
        </h2>
        <p className="text-xs sm:text-sm text-[#DDD8D4] leading-relaxed">
          Most international dating sites were built in the early 2000s—and from the look of them, they haven’t updated their code since the days of iPods and flip phones. You shouldn't have to wade through twenty-year-old table layouts, sidebar ads, and clunky pay-per-letter paywalls just to say hello.
        </p>
        <p className="text-xs sm:text-sm text-[#DDD8D4] leading-relaxed">
          We built <span className="text-white font-semibold">asiansin.love</span> because mature, dignified courtship deserves modern technology: clean typography, zero spam, and instant gesture selfie verification so you know you’re always chatting with real people.
        </p>
      </div>

    </main>
  );
}
