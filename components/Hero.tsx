'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Heart, ShieldCheck } from 'lucide-react';

/**
 * The landing page is one centred phone-width column on every screen: no breakpoints change its
 * structure or type sizes. Shared with components/HeroLanding.tsx.
 */
export const LANDING_SHELL = 'mx-auto w-full max-w-md px-5';

/**
 * Hero stack, top to bottom: illustration, headline and one line of copy, then the CTA block
 * (Join for Free, a bordered verification / Sparks metadata strip, Sign In link).
 * Rendered inside LANDING_SHELL.
 */
export default function Hero() {
  return (
    <section className="w-full bg-white pt-2 pb-10">
      <div className="flex flex-col items-center text-center">
        {/* Rounded mask with side and top padding: the chest-up illustration sits on the bottom
            edge and the corners never clip a shoulder. */}
        <div className="relative w-full aspect-[900/636] overflow-hidden rounded-[2rem] bg-[#E8E6F1]/50 px-6 pt-6">
          <div className="relative h-full w-full">
            <Image
              src="/hero-couple.webp"
              alt="Illustrated couple smiling together"
              fill
              priority
              sizes="448px"
              className="object-contain object-bottom select-none pointer-events-none"
            />
          </div>
        </div>

        <h1 className="mt-8 text-[28px] font-semibold tracking-tight leading-tight text-[#413B5E]">
          <span className="block">Real connections.</span>
          <span className="block text-[#8574B7]">Selfie-Verified Profiles.</span>
          <span className="block">Free to Match &amp; Connect.</span>
        </h1>

        <p className="mt-3 text-[15px] leading-relaxed text-slate-600">
          Meet in Asia is a lightweight, verified platform built for genuine cross-border relationships.
        </p>

        {/* CTA block: one item per row */}
        <div className="mt-7 w-full flex flex-col items-center gap-4">
          <Link
            href="/signup"
            className="w-full h-12 inline-flex items-center justify-center rounded-full bg-[#8574B7] hover:bg-[#534377] text-white font-medium text-sm active:scale-95 transition-all"
          >
            Join for Free
          </Link>

          {/* Plain metadata, not badges: two labelled facts in one bordered strip. */}
          <dl className="w-full grid grid-cols-2 divide-x divide-slate-200 rounded-xl border border-slate-200 text-left">
            <div className="px-4 py-3">
              <dt className="flex items-center gap-1.5 text-xs font-medium text-slate-600">
                <ShieldCheck className="w-3.5 h-3.5 text-[#8574B7]" aria-hidden />
                Verification
              </dt>
              <dd className="mt-0.5 text-sm font-medium text-[#413B5E]">Live selfie, team-reviewed</dd>
            </div>
            <div className="px-4 py-3">
              <dt className="flex items-center gap-1.5 text-xs font-medium text-slate-600">
                <Heart className="w-3.5 h-3.5 text-[#8574B7]" aria-hidden />
                Sparks
              </dt>
              <dd className="mt-0.5 text-sm font-medium text-[#413B5E]">30 free per day</dd>
            </div>
          </dl>

          <Link href="/login" className="text-sm font-medium text-[#8574B7] hover:text-[#534377] transition-colors">
            Sign In
          </Link>
        </div>
      </div>
    </section>
  );
}
