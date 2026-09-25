'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export function Navbar() {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const isActive = (path: string) => pathname === path;

  return (
    <header className="sticky top-0 z-50 bg-[#17131F]/90 backdrop-blur-md border-b border-[#725A7A]/30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        
        {/* Brand */}
        <Link href="/" className="flex items-center gap-2 group flex-shrink-0">
          <span className="text-xl">💜</span>
          <span className="text-lg font-black tracking-tight text-white font-[family-name:var(--font-nunito)]">
            asiansin<span className="text-[#B8AAC3]">.love</span>
          </span>
        </Link>

        {/* Desktop Navigation Links */}
        <nav className="hidden md:flex items-center gap-6">
          <Link
            href="/discover"
            className={`text-sm font-bold transition-colors ${
              isActive('/discover') ? 'text-[#E6D7FA]' : 'text-[#DDD8D4] hover:text-white'
            }`}
          >
            Discover
          </Link>
          <Link
            href="/messages"
            className={`text-sm font-bold transition-colors ${
              isActive('/messages') ? 'text-[#E6D7FA]' : 'text-[#DDD8D4] hover:text-white'
            }`}
          >
            Messages
          </Link>
          <Link
            href="/favorites"
            className={`text-sm font-bold transition-colors ${
              isActive('/favorites') ? 'text-[#E6D7FA]' : 'text-[#DDD8D4] hover:text-white'
            }`}
          >
            Saved
          </Link>
          <Link
            href="/verify"
            className={`text-sm font-bold transition-colors ${
              isActive('/verify') ? 'text-[#E6D7FA]' : 'text-[#DDD8D4] hover:text-white'
            }`}
          >
            Verification
          </Link>
        </nav>

        {/* Action Buttons & Mobile Hamburger */}
        <div className="flex items-center gap-2.5">
          <Link
            href="/notifications"
            className="h-9 w-9 rounded-xl bg-[#241E2F] border border-[#725A7A]/30 flex items-center justify-center text-white hover:border-[#978FA8] transition-all relative"
            aria-label="Notifications"
          >
            <span className="text-sm">🔔</span>
            <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-[#653C87]" />
          </Link>

          <Link
            href="/login"
            className="hidden sm:inline-flex px-4 py-2 rounded-xl bg-[#653C87] hover:bg-[#7A49A2] text-white text-xs font-bold transition-all shadow-md active:scale-95"
          >
            Sign In
          </Link>

          {/* Mobile Menu Toggle Button */}
          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden h-9 px-3 rounded-xl bg-[#241E2F] border border-[#725A7A]/30 flex items-center gap-1.5 text-xs font-bold text-white active:scale-95"
            aria-label="Toggle Navigation"
          >
            <span>{mobileMenuOpen ? '✕' : '☰'}</span>
            <span>Menu</span>
          </button>
        </div>

      </div>

      {/* Mobile Slide-Down Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-[#241E2F] border-b border-[#725A7A]/40 px-5 py-4 space-y-3 shadow-2xl animate-in slide-in-from-top-2">
          <div className="grid grid-cols-2 gap-2 text-sm font-bold">
            <Link
              href="/discover"
              onClick={() => setMobileMenuOpen(false)}
              className="p-2.5 rounded-xl bg-[#17131F] border border-[#725A7A]/25 text-white flex items-center gap-2"
            >
              <span>🧭</span> Discover
            </Link>
            <Link
              href="/messages"
              onClick={() => setMobileMenuOpen(false)}
              className="p-2.5 rounded-xl bg-[#17131F] border border-[#725A7A]/25 text-white flex items-center gap-2"
            >
              <span>💬</span> Messages
            </Link>
            <Link
              href="/favorites"
              onClick={() => setMobileMenuOpen(false)}
              className="p-2.5 rounded-xl bg-[#17131F] border border-[#725A7A]/25 text-white flex items-center gap-2"
            >
              <span>⭐</span> Saved
            </Link>
            <Link
              href="/verify"
              onClick={() => setMobileMenuOpen(false)}
              className="p-2.5 rounded-xl bg-[#17131F] border border-[#725A7A]/25 text-white flex items-center gap-2"
            >
              <span>🛡️</span> Verify
            </Link>
          </div>

          <div className="pt-2 border-t border-[#725A7A]/25 flex items-center justify-between">
            <Link
              href="/profile"
              onClick={() => setMobileMenuOpen(false)}
              className="text-xs text-[#DDD8D4] hover:text-white font-bold"
            >
              👤 My Profile
            </Link>
            <Link
              href="/login"
              onClick={() => setMobileMenuOpen(false)}
              className="px-4 py-2 rounded-xl bg-[#653C87] text-white text-xs font-bold"
            >
              Sign In / Up
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}