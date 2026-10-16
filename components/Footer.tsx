'use client';

import React from 'react';
import Link from 'next/link';
import { ShieldCheck } from 'lucide-react';

export function Footer() {
  return (
    <footer className="w-full shrink-0 bg-white text-[#564F66] pt-10 pb-8 px-4 border-t border-[#EDE8F5] select-none">
      <div className="max-w-md mx-auto flex flex-col items-center text-center space-y-5">
        
        {/* Brand Header */}
        <div className="space-y-1">
          <div className="flex items-center justify-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#6555b8]" />
            <h2 className="font-logo text-base font-bold tracking-tight text-[#181126]"><span className="text-[20px] leading-none font-black tracking-[-0.035em] lowercase select-none inline-flex items-baseline" style={{ fontFamily: 'var(--font-brand)', fontWeight: 900 }}><span className="text-[#1C1924]">asians</span><span className="text-[#6555B8]">inlove</span></span></h2>
          </div>
          <p className="text-[11.5px] text-[#6E677F]">
            Intentional dating for lasting relationships.
          </p>
        </div>

        {/* Trust & Safety Pill */}
        <div className="inline-flex items-center gap-1.5 text-[10.5px] font-semibold px-3 py-1 rounded-full bg-[#F3EFFC] text-[#6555b8]">
          <ShieldCheck className="w-3.5 h-3.5 text-[#6555b8]" />
          <span>Verified Profiles • Zero Microtransactions • High Intent</span>
        </div>

        {/* Navigation & Legal Links */}
        <nav aria-label="Footer Navigation" className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2 text-xs font-semibold text-[#564F66]">
          <Link href="/pricing" className="hover:text-[#6555b8] transition-colors">
            Pricing
          </Link>
          <span className="text-[#CBC4DA]">•</span>
          <Link href="/standards" className="hover:text-[#6555b8] transition-colors">
            Community Standards
          </Link>
          <span className="text-[#CBC4DA]">•</span>
          <Link href="/terms" className="hover:text-[#6555b8] transition-colors">
            Terms of Use
          </Link>
          <span className="text-[#CBC4DA]">•</span>
          <Link href="/privacy" className="hover:text-[#6555b8] transition-colors">
            Privacy Policy
          </Link>
        </nav>

        {/* Divider */}
        <div className="w-10 h-px bg-[#EDE8F5]" />

        {/* Copyright */}
        <p className="text-[10.5px] text-[#8E869E]">
          © 2026 Asians in Love. All rights reserved.
        </p>

      </div>
    </footer>
  );
}

export default Footer;
