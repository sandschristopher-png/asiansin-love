'use client';

import React from 'react';
import Link from 'next/link';

export default function HomePage() {
  return (
    <main className="max-w-4xl mx-auto px-4 sm:px-6 py-10 sm:py-16 space-y-10">
      
      {/* Hero */}
      <div className="text-center space-y-4">
        <h1 className="text-3xl sm:text-5xl font-black text-white tracking-tight leading-tight">
          Genuine Courtship with Sincere Southeast Asian Singles.
        </h1>
        <p className="text-sm sm:text-base text-[#DDD8D4] max-w-xl mx-auto leading-relaxed font-medium">
          A welcoming, dignified community connecting international gentlemen with verified singles across the Philippines, Thailand, and Southeast Asia.
        </p>
        
        <div className="pt-2">
          <Link
            href="/discover"
            className="inline-block px-8 py-4 rounded-2xl bg-[#653C87] hover:bg-[#7A49A2] text-white font-extrabold text-sm sm:text-base shadow-xl shadow-[#653C87]/40 active:scale-95 transition-all"
          >
            Explore Profiles
          </Link>
        </div>
      </div>

      {/* Value Pillars */}
      <div className="rounded-3xl bg-[#241E2F] border border-[#725A7A]/35 p-6 sm:p-8 space-y-4 shadow-xl">
        <h2 className="text-lg font-extrabold text-white">What We Do</h2>
        <p className="text-sm sm:text-base text-[#DDD8D4] leading-relaxed font-medium">
          asiansin.love is a direct, verified dating platform built for sincere cross-border relationships. We offer clear direct messaging, automatic safeguards against financial requests, and instant gesture photo verification so you can connect with real women seeking lifelong companionship.
        </p>
        <p className="text-sm sm:text-base text-[#DDD8D4] leading-relaxed font-medium">
          While most sites in this space feel frozen in 2001 with clunky tables and pay-per-letter gimmicks, we keep it clean, modern, and respectful for everyone.
        </p>
      </div>

    </main>
  );
}