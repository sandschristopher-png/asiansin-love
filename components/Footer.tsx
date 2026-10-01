'use client';

import React from 'react';
import Link from 'next/link';

export function Footer() {
  return (
    <footer className="w-full border-t border-[#DDD7E5] bg-[#F8F7FA] mt-auto py-8">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-[#6B627A]">
        
        {/* Left: Brand & Purpose */}
        <div className="flex flex-col sm:flex-row items-center gap-2 text-center sm:text-left">
          <span className="font-bold text-[#1C1924]">Asians in Love</span>
          <span className="hidden sm:inline text-[#DDD7E5]">•</span>
          <span>Serious Courtship &amp; Marriage</span>
          <span className="hidden sm:inline text-[#DDD7E5]">•</span>
          <span>&copy; 2026</span>
        </div>

        {/* Right: Working Legal & Trust Links */}
        <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 font-medium">
          <Link href="/terms" className="hover:text-[#6555B8] transition">
            Terms of Use
          </Link>
          <Link href="/privacy" className="hover:text-[#6555B8] transition">
            Privacy Policy
          </Link>
          <Link href="/terms#safety" className="hover:text-[#6555B8] transition">
            Safety &amp; Anti-Scam
          </Link>
          <a href="mailto:support@asiansin.love" className="hover:text-[#6555B8] transition">
            Contact Support
          </a>
        </div>

      </div>
    </footer>
  );
}

export default Footer;
