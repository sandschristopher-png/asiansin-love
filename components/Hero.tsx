'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Heart, ShieldCheck } from 'lucide-react';
import { InstallAppCard } from '@/components/InstallAppCard';

/** One centred mobile column on every screen (shared with components/HeroLanding.tsx). */
export const LANDING_SHELL = 'mx-auto w-full max-w-[440px] sm:max-w-[480px] px-4';

/**
 * Landing hero as a single vertical app column: photo card with two floating badges, then the
 * headline, one line of copy and two full-width pill buttons.
 */
export default function Hero() {
  return (
    <section className="relative w-full overflow-hidden bg-white pt-6 pb-10">
      {/* Background glow - constrained to prevent mobile horizontal scroll */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -top-24 left-1/2 -z-10 h-72 w-72 -translate-x-1/2 rounded-full bg-[#E8E6F1]/70 blur-3xl"
      />

      <div className={`${LANDING_SHELL} text-center`}>
        {/* Photo card: overflow-visible so the badges can overlap its edges */}
        <div className="relative w-full max-w-[380px] sm:max-w-[420px] mx-auto">
          <div className="relative aspect-[16/11] w-full overflow-hidden rounded-3xl border border-[#D0CDE1] bg-[#E8E6F1] shadow-sm">
            {/* 1024 x 572 source shown at or below native size (no upscaling, so no blur), served as
                WebP at quality 95 (allowed in next.config.ts images.qualities). */}
            <Image
              src="/images/hero-pinay.png"
              alt="Woman smiling while using her phone on a sofa"
              fill
              priority
              quality={95}
              sizes="(max-width: 480px) 100vw, 440px"
              className="object-cover object-center"
            />
          </div>

          {/* Top-right: Spark badge with the mascot */}
          <div className="absolute -top-4 -right-2 flex items-center gap-2 bg-white/90 backdrop-blur-md rounded-2xl border border-white/80 p-2 shadow-md">
            <div className="relative h-9 w-9 shrink-0 overflow-hidden rounded-full border border-[#D0CDE1] bg-white">
              <Image src="/korean-finger-heart.png" alt="" fill sizes="36px" className="object-cover object-top" />
            </div>
            <div className="text-left">
              <p className="flex items-center gap-1 text-[11px] font-bold text-[#413B5E] whitespace-nowrap">
                <Heart className="h-3 w-3 fill-[#8574B7] text-[#8574B7]" aria-hidden />
                Spark
              </p>
              <p className="text-[10px] font-medium text-[#413B5E]/70 whitespace-nowrap">3 things in common</p>
            </div>
          </div>

          {/* Bottom-left: verification badge */}
          <div className="absolute -bottom-4 -left-2 flex items-center gap-2 bg-white/95 backdrop-blur-md rounded-2xl border border-[#D0CDE1] px-3 py-2 shadow-md">
            <ShieldCheck className="h-5 w-5 shrink-0 text-emerald-600" aria-hidden />
            <div className="text-left">
              <p className="text-[11px] font-bold text-[#413B5E] whitespace-nowrap">Verified</p>
              <p className="text-[10px] font-medium text-[#413B5E]/70 whitespace-nowrap">Anti-scam checks</p>
            </div>
          </div>
        </div>

        {/* Headline */}
        <h1 className="mt-10 text-[28px] sm:text-[32px] font-black tracking-tight leading-tight text-[#413B5E]">
          <span className="block">Real connections.</span>
          <span className="block text-[#8574B7]">Selfie-Verified Profiles.</span>
          <span className="block">Free to Match &amp; Connect.</span>
        </h1>

        {/* Supporting Copy */}
        <p className="mt-3 text-sm sm:text-base leading-relaxed text-[#413B5E]/75">
          Asians in Love is a lightweight, verified platform built for genuine cross-border relationships.
        </p>

        {/* Full-width app buttons */}
        <div className="mt-6 flex flex-col gap-3">
          <Link
            href="/signup"
            className="w-full h-12 inline-flex items-center justify-center rounded-full bg-[#8574B7] hover:bg-[#534377] text-white font-bold text-sm shadow-xs active:scale-95 transition-all"
          >
            Join Free in 30 Seconds
          </Link>
          <Link
            href="/discover"
            className="w-full h-12 inline-flex items-center justify-center rounded-full border border-[#D0CDE1] bg-white hover:bg-[#8574B7]/5 text-[#413B5E] font-semibold text-sm active:scale-95 transition-all"
          >
            Explore Profiles
          </Link>
        </div>

        <p className="mt-3 text-xs text-[#413B5E]/65">
          Free to join. By joining you agree to our Terms &amp; Privacy Policy.
        </p>
        {/* Phone install instructions mean nothing on a desktop browser. */}
        <div className="flex justify-center md:hidden">
          <InstallAppCard variant="hero" />
        </div>
      </div>
    </section>
  );
}
