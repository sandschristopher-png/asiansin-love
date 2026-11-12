'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useLocale } from '@/components/i18n/LocaleProvider';

/**
 * The landing page is one centred phone-width column on every screen: no breakpoints change its
 * structure or type sizes. Shared with components/HeroLanding.tsx.
 */
export const LANDING_SHELL = 'mx-auto w-full max-w-md px-5';

/** "Already a member? Sign in": muted lead-in, only "Sign in" is the link. */
export function SignInPrompt() {
  const { m } = useLocale();
  return (
    <p className="text-sm text-slate-600">
      {m.auth.memberPrompt}{' '}
      <Link href="/login" className="font-medium text-[#8574B7] hover:text-[#534377] underline-offset-4 hover:underline transition-colors">
        {m.auth.signIn}
      </Link>
    </p>
  );
}

/**
 * Hero stack, top to bottom: photo, headline and copy, then the CTA block (Join for Free, one
 * verification / Sparks text row, "Already a member? Sign in"). Text comes from the active
 * dictionary (messages/<locale>.json). Rendered inside LANDING_SHELL.
 */
export default function Hero() {
  const { m } = useLocale();
  return (
    <section className="w-full bg-white pt-2 pb-10">
      <div className="flex flex-col items-center text-center">
        {/* Full-bleed photo in a rounded mask, 3:2 landscape (source is 1024x687). */}
        <div className="relative w-full aspect-[3/2] overflow-hidden rounded-2xl bg-[#E8E6F1]/50">
          <Image
            src="/Landing-Woman.png"
            alt={m.hero.imageAlt}
            fill
            priority
            quality={95}
            sizes="448px"
            className="object-cover select-none pointer-events-none"
          />
        </div>

        <h1 className="mt-8 text-[28px] font-semibold tracking-tight leading-tight text-[#413B5E]">
          <span className="block">{m.hero.line1}</span>
          <span className="block text-[#8574B7]">{m.hero.line2}</span>
          <span className="block">{m.hero.line3}</span>
        </h1>

        <p className="mt-3 text-[15px] leading-relaxed text-slate-600">{m.hero.subtitle}</p>

        {/* CTA block: one item per row */}
        <div className="mt-7 w-full flex flex-col items-center gap-4">
          <Link
            href="/signup"
            className="w-full h-12 inline-flex items-center justify-center rounded-full bg-[#8574B7] hover:bg-[#534377] text-white font-medium text-sm active:scale-95 transition-all"
          >
            {m.hero.join}
          </Link>

          {/* One plain text row, no containers. */}
          <p className="text-[13px] font-medium text-slate-600">
            {m.hero.factVerified}
            <span className="mx-2" aria-hidden="true">•</span>
            {m.hero.factSparks}
          </p>

          <SignInPrompt />
        </div>
      </div>
    </section>
  );
}
