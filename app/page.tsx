'use client';

import React from 'react';
import Link from 'next/link';

export default function HomePage() {
  return (
    <main className="max-w-5xl mx-auto w-full px-4 sm:px-6 py-6 sm:py-10 flex-1 flex flex-col justify-center text-center">
      
      {/* Hero Header */}
      <div className="space-y-3 max-w-3xl mx-auto">
        <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-white tracking-tight leading-tight font-[family-name:var(--font-nunito)]">
          Genuine Courtship with Sincere Southeast Asian Singles.
        </h1>
        <p className="text-xs sm:text-sm md:text-base text-[#DDD8D4] max-w-2xl mx-auto font-normal leading-relaxed">
          A dignified, safe dating community connecting international men with verified women across Southeast Asia. Every profile verified through dynamic gesture selfies.
        </p>
      </div>

      {/* Primary Action Buttons */}
      <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
        <Link
          href="/discover"
          className="px-6 py-2.5 sm:py-3 rounded-2xl bg-[#653C87] hover:bg-[#7A49A2] text-white font-bold text-xs sm:text-sm md:text-base shadow-lg shadow-[#41384E]/50 transition-all active:scale-[0.98]"
        >
          Explore Verified Profiles
        </Link>
        <Link
          href="/standards"
          className="px-5 py-2.5 sm:py-3 rounded-2xl bg-[#241E2F] hover:bg-[#2E263B] border border-[#725A7A]/35 text-[#DDD8D4] hover:text-white font-bold text-xs sm:text-sm md:text-base transition-colors"
        >
          Community Standards
        </Link>
      </div>

      {/* Streamlined, Compact Trust Features (No Emojis, Clean SVGs) */}
      <div className="mt-8 sm:mt-10 grid grid-cols-1 md:grid-cols-3 gap-3 text-left">
        
        {/* Card 1: Verification */}
        <div className="p-4 rounded-xl bg-[#241E2F]/80 border border-[#725A7A]/30 hover:border-[#978FA8]/50 transition-all space-y-1.5">
          <div className="flex items-center gap-2 text-[#E6D7FA]">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="w-4 h-4 text-[#978FA8]"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
              <path d="m9 12 2 2 4-4" />
            </svg>
            <h2 className="text-xs sm:text-sm font-bold text-white">Live Gesture Verification</h2>
          </div>
          <p className="text-[11px] sm:text-xs text-[#DDD8D4] leading-relaxed">
            Every member is cross-referenced with randomized selfie poses to prevent fakes and catfishing.
          </p>
        </div>

        {/* Card 2: Safe Environment */}
        <div className="p-4 rounded-xl bg-[#241E2F]/80 border border-[#725A7A]/30 hover:border-[#978FA8]/50 transition-all space-y-1.5">
          <div className="flex items-center gap-2 text-[#E6D7FA]">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="w-4 h-4 text-[#978FA8]"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <rect width="18" height="11" x="3" y="11" rx="2" ry="2" />
              <path d="M7 11V7a5 5 0 0 1 10 0v4" />
            </svg>
            <h2 className="text-xs sm:text-sm font-bold text-white">Zero Solicitation Safeguards</h2>
          </div>
          <p className="text-[11px] sm:text-xs text-[#DDD8D4] leading-relaxed">
            Automated detection intercepts financial or remittance requests to keep conversations authentic.
          </p>
        </div>

        {/* Card 3: Dignified Connections */}
        <div className="p-4 rounded-xl bg-[#241E2F]/80 border border-[#725A7A]/30 hover:border-[#978FA8]/50 transition-all space-y-1.5">
          <div className="flex items-center gap-2 text-[#E6D7FA]">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="w-4 h-4 text-[#978FA8]"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" />
            </svg>
            <h2 className="text-xs sm:text-sm font-bold text-white">Sincere Courtship Only</h2>
          </div>
          <p className="text-[11px] sm:text-xs text-[#DDD8D4] leading-relaxed">
            Designed exclusively for respectful individuals seeking genuine companionship and lasting partnership.
          </p>
        </div>

      </div>

    </main>
  );
}
