'use client';

import React from 'react';
import Link from 'next/link';

export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="w-full border-t border-[#725A7A]/25 bg-[#17131F]/90 py-5 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-10 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-[#B8AAC3]">
        <div className="flex items-center gap-2">
          <span className="font-bold text-white">asiansin.love</span>
          <span>© {currentYear} All rights reserved.</span>
        </div>

        <nav className="flex items-center gap-4 sm:gap-6 font-semibold">
          <Link href="/standards" className="hover:text-white transition-colors focus:outline-none">
            Community Standards
          </Link>
          <Link href="/privacy" className="hover:text-white transition-colors focus:outline-none">
            Privacy Policy
          </Link>
          <Link href="/terms" className="hover:text-white transition-colors focus:outline-none">
            Terms of Use
          </Link>
          <Link href="/verify" className="hover:text-white transition-colors focus:outline-none">
            Gesture Verification
          </Link>
        </nav>
      </div>
    </footer>
  );
}
