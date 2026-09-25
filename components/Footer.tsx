'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export function Footer() {
  const pathname = usePathname();

  // Hide footer completely inside active chat conversation
  if (pathname.startsWith('/chat/')) return null;

  return (
    <footer className="border-t border-[#725A7A]/25 bg-[#17131F] py-8 pb-28 md:pb-10 px-4 text-center">
      <div className="max-w-4xl mx-auto space-y-4">
        
        {/* Subtle Brand & Mission Tag */}
        <p className="text-xs text-[#DDD8D4]/80 font-medium max-w-md mx-auto leading-relaxed">
          <strong className="text-white font-extrabold">asiansin.love</strong> — A sincere, verified courtship community connecting intentional international men with Southeast Asian women.
        </p>

        {/* Legal & Standards Links */}
        <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-xs font-bold text-[#B8AAC3]">
          <Link href="/standards" className="hover:text-white transition-colors">
            Community Standards
          </Link>
          <span className="text-[#725A7A]">•</span>
          <Link href="/privacy" className="hover:text-white transition-colors">
            Privacy Policy
          </Link>
          <span className="text-[#725A7A]">•</span>
          <Link href="/terms" className="hover:text-white transition-colors">
            Terms of Use
          </Link>
        </div>

        {/* Copyright */}
        <p className="text-[11px] text-[#725A7A] font-semibold">
          © 2026 asiansin.love. All rights reserved. Financial solicitations strictly prohibited.
        </p>

      </div>
    </footer>
  );
}