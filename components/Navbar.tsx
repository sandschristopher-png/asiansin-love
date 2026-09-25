'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export function Navbar() {
  const pathname = usePathname();
  const isActive = (path: string) => pathname === path;

  return (
    <header className="sticky top-0 z-40 bg-[#17131F]/95 backdrop-blur-md border-b border-[#725A7A]/30">
      <div className="max-w-7xl mx-auto px-4 h-16 relative flex items-center justify-between">
        
        {/* Left: Desktop Nav / Mobile Quick Utility */}
        <div className="flex items-center gap-6">
          <Link
            href="/notifications"
            className="h-10 w-10 rounded-xl bg-[#241E2F] border border-[#725A7A]/35 flex items-center justify-center text-[#DDD8D4] hover:text-white active:scale-90 transition-all relative"
            aria-label="Notifications"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
            </svg>
            <span className="absolute top-2 right-2 h-2 w-2 rounded-full bg-[#653C87]" />
          </Link>

          {/* Desktop-Only Links */}
          <nav className="hidden md:flex items-center gap-6 text-sm font-bold">
            <Link
              href="/discover"
              className={`transition-colors ${isActive('/discover') ? 'text-white' : 'text-[#DDD8D4] hover:text-white'}`}
            >
              Discover
            </Link>
            <Link
              href="/messages"
              className={`transition-colors ${isActive('/messages') ? 'text-white' : 'text-[#DDD8D4] hover:text-white'}`}
            >
              Messages
            </Link>
            <Link
              href="/favorites"
              className={`transition-colors ${isActive('/favorites') ? 'text-white' : 'text-[#DDD8D4] hover:text-white'}`}
            >
              Saved
            </Link>
          </nav>
        </div>

        {/* Center: Perfectly Centered Brand Logo */}
        <div className="absolute left-1/2 -translate-x-1/2">
          <Link href="/" className="flex items-center gap-1.5 active:scale-95 transition-transform">
            <span className="text-xl">💜</span>
            <span className="text-lg font-black tracking-tight text-white font-[family-name:var(--font-nunito)]">
              asiansin<span className="text-[#B8AAC3]">.love</span>
            </span>
          </Link>
        </div>

        {/* Right: Profile Shortcut on Desktop / Mobile Indicator */}
        <div className="flex items-center gap-2">
          <Link
            href="/profile"
            className="hidden sm:inline-flex px-4 py-2 rounded-xl bg-[#653C87] hover:bg-[#7A49A2] text-white text-xs font-black shadow-md active:scale-95 transition-all"
          >
            My Profile
          </Link>

          <Link
            href="/login"
            className="sm:hidden px-3 py-1.5 rounded-xl bg-[#241E2F] border border-[#725A7A]/35 text-[#DDD8D4] hover:text-white text-xs font-bold active:scale-95"
          >
            Sign In
          </Link>
        </div>

      </div>
    </header>
  );
}