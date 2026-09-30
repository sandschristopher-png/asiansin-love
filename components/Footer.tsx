'use client';

import React from 'react';
import Link from 'next/link';

export function Footer() {
  return (
    <footer className="w-full border-t border-[#2D2F4C] bg-[#2D2F4C]/80 backdrop-blur-md mt-auto">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-[#756D82]">
        
        {/* Left: Brand & Copyright */}
        <div className="flex items-center gap-2">
          <span>&copy; 2026 asiansin.love. All rights reserved.</span>
        </div>

        {/* Right: All Legal, Trust, & Support Links */}
        <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 font-medium">
          <Link href="/terms" className="hover:text-[#1C1924] transition">
            Terms of Service
          </Link>
          <Link href="/privacy" className="hover:text-[#1C1924] transition">
            Privacy Policy
          </Link>
          <Link href="/safety" className="hover:text-[#1C1924] transition">
            Safety & Verification
          </Link>
          <Link href="/guidelines" className="hover:text-[#1C1924] transition">
            Community Guidelines
          </Link>
          <Link href="/anti-scam" className="hover:text-[#1C1924] transition">
            Anti-Scam Policy
          </Link>
          <Link href="/support" className="hover:text-[#1C1924] transition">
            Contact Support
          </Link>
        </div>

      </div>
    </footer>
  );
}

export default Footer;