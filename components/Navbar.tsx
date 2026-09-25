'use client';

import React from 'react';
import Link from 'next/link';

export function Navbar() {
  return (
    <header className="sticky top-0 z-50 bg-[#17131F]/95 backdrop-blur-md border-b border-[#725A7A]/30">
      <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between relative">
        
        {/* Left Action: Notifications Button */}
        <div className="flex items-center z-10">
          <Link
            href="/notifications"
            className="h-10 w-10 rounded-2xl bg-[#241E2F] border border-[#725A7A]/35 flex items-center justify-center text-[#DDD8D4] hover:text-white hover:border-[#978FA8] transition-all relative active:scale-95 shadow-md"
            aria-label="Notifications"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
            </svg>
            <span className="absolute top-2 right-2 h-2 w-2 rounded-full bg-[#653C87]" />
          </Link>
        </div>

        {/* Center: Exact ail-logo.png Anchored Mathematically at True Center */}
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-auto">
          <Link href="/" className="flex items-center justify-center select-none active:scale-95 transition-transform">
            <img
              src="/ail-logo.png"
              alt="asiansin.love"
              className="h-[28px] sm:h-[32px] w-auto max-w-[200px] sm:max-w-[240px] object-contain block"
            />
          </Link>
        </div>

        {/* Right Action: Sign In Button */}
        <div className="flex items-center z-10">
          <Link
            href="/login"
            className="px-4 py-2 rounded-xl bg-[#241E2F] border border-[#725A7A]/40 hover:bg-[#653C87] text-white text-xs font-black tracking-wide transition-all shadow-md active:scale-95"
          >
            Sign In
          </Link>
        </div>

      </div>
    </header>
  );
}