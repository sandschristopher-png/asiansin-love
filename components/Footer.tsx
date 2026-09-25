'use client';

import React from 'react';
import Link from 'next/link';

export function Footer() {
  return (
    <footer className="w-full bg-[#17131F] border-t border-[#725A7A]/20 py-6 px-4 text-center select-none">
      <div className="max-w-md mx-auto space-y-2">
        
        {/* Brand & Copyright */}
        <p className="text-xs text-[#725A7A] font-semibold">
          <strong className="text-[#DDD8D4] font-black">asiansin.love</strong> &copy; 2026 All rights reserved.
        </p>

        {/* Clean Inline Links */}
        <div className="flex items-center justify-center gap-2.5 text-[11px] font-bold text-[#B8AAC3]">
          <Link href="/standards" className="hover:text-white transition-colors">
            Standards
          </Link>
          <span className="text-[#725A7A]">•</span>
          <Link href="/privacy" className="hover:text-white transition-colors">
            Privacy
          </Link>
          <span className="text-[#725A7A]">•</span>
          <Link href="/terms" className="hover:text-white transition-colors">
            Terms
          </Link>
        </div>

      </div>
    </footer>
  );
}