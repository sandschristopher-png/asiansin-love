'use client';

import React from 'react';
import Link from 'next/link';
import { ShieldCheck } from 'lucide-react';

export function Footer() {
  return (
    <footer className="w-full shrink-0 bg-gradient-to-b from-[#564592] to-[#3d2e6b] text-white pt-12 pb-24 px-6 select-none">
      <div className="max-w-md mx-auto flex flex-col items-center text-center space-y-6">
        
        {/* Brand Header */}
        <div className="space-y-1">
          <div className="flex items-center justify-center gap-2">
            <span className="w-2 h-2 rounded-full bg-white shadow-xs" />
            <h2 className="text-lg font-bold tracking-tight text-white">
              asians in love
            </h2>
          </div>
          <p className="text-xs text-[#E1D9F7] font-normal">
            Intentional courtship for marriage and lifelong commitment.
          </p>
        </div>

        {/* Trust & Safety Pill */}
        <div className="inline-flex items-center gap-2 text-[11px] font-medium px-4 py-1.5 rounded-full bg-white/10 backdrop-blur-xs border border-white/20 text-[#FAF8FF]">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-300" />
          <span>Verified Profiles • Zero Microtransactions • High Intent</span>
        </div>

        {/* Navigation & Legal Links */}
        <nav aria-label="Footer Navigation" className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-xs font-medium text-[#F1EDFD]">
          <Link href="/pricing" className="hover:text-white transition-colors">
            Pricing
          </Link>
          <span className="text-white/40">•</span>
          <Link href="/standards" className="hover:text-white transition-colors">
            Community Standards
          </Link>
          <span className="text-white/40">•</span>
          <Link href="/terms" className="hover:text-white transition-colors">
            Terms of Use
          </Link>
          <span className="text-white/40">•</span>
          <Link href="/privacy" className="hover:text-white transition-colors">
            Privacy Policy
          </Link>
        </nav>

        {/* Divider */}
        <div className="w-12 h-px bg-white/20" />

        {/* Copyright */}
        <p className="text-[11px] text-[#D0C4EB]">
          © 2026 Asians in Love. All rights reserved.
        </p>

      </div>
    </footer>
  );
}

export default Footer;
