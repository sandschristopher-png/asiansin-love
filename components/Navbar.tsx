'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export function Navbar() {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const isActive = (path: string) => pathname === path;

  return (
    <header className="sticky top-0 z-50 bg-[#17131F]/95 backdrop-blur-md border-b border-[#725A7A]/30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        
        {/* Original Brand Logo with Purple Heart */}
        <Link href="/" className="flex items-center gap-2 group flex-shrink-0">
          <span className="text-xl select-none">💜</span>
          <span className="text-lg font-black tracking-tight text-white font-[family-name:var(--font-nunito)]">
            asiansin.love
          </span>
        </Link>

        {/* Desktop Navigation Links */}
        <nav className="hidden md:flex items-center gap-8">
          <Link
            href="/discover"
            className={`text-sm font-bold tracking-wide transition-colors ${
              isActive('/discover') ? 'text-white border-b-2 border-[#653C87] pb-1' : 'text-[#DDD8D4] hover:text-white'
            }`}
          >
            Discover
          </Link>
          <Link
            href="/messages"
            className={`text-sm font-bold tracking-wide transition-colors ${
              isActive('/messages') ? 'text-white border-b-2 border-[#653C87] pb-1' : 'text-[#DDD8D4] hover:text-white'
            }`}
          >
            Messages
          </Link>
          <Link
            href="/favorites"
            className={`text-sm font-bold tracking-wide transition-colors ${
              isActive('/favorites') ? 'text-white border-b-2 border-[#653C87] pb-1' : 'text-[#DDD8D4] hover:text-white'
            }`}
          >
            Saved
          </Link>
          <Link
            href="/profile"
            className={`text-sm font-bold tracking-wide transition-colors ${
              isActive('/profile') ? 'text-white border-b-2 border-[#653C87] pb-1' : 'text-[#DDD8D4] hover:text-white'
            }`}
          >
            Profile
          </Link>
        </nav>

        {/* Actions */}
        <div className="flex items-center gap-2.5">
          <Link
            href="/notifications"
            className="h-9 w-9 rounded-xl bg-[#241E2F] border border-[#725A7A]/30 flex items-center justify-center text-[#DDD8D4] hover:text-white hover:border-[#978FA8] transition-all relative"
            aria-label="Notifications"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
            </svg>
            <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-[#653C87]" />
          </Link>

          <Link
            href="/login"
            className="px-4 py-2 rounded-xl bg-[#241E2F] border border-[#725A7A]/40 hover:bg-[#653C87] text-white text-xs font-bold transition-all shadow-md active:scale-95"
          >
            Sign In
          </Link>
        </div>

      </div>
    </header>
  );
}