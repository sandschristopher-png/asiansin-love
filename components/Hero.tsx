'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useLocale } from '@/components/i18n/LocaleProvider';
import { FadeIn, TapButton } from '@/components/landing/Motion';

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
 * Hero stack, top to bottom: a compact photo, headline and copy (the subtext carries the soft-launch
 * message), then the CTA block: Join for Free (/signup), the Sparks stat,
 * "Already a member? Sign in" (/login). Sized so Join for Free and Sign in are visible on first load
 * on a phone without scrolling. Text comes from the active dictionary (messages/<locale>.json).
 * Rendered inside LANDING_SHELL.
 */
export default function Hero() {
  const { m } = useLocale();
  return (
    <section className="w-full bg-white pb-8">
      <div className="flex flex-col items-center text-center">
        {/* Brand portrait (Camille_Hero.png, unchanged) in a 4:3 card, cropped from the top so the cafe, the iced
            coffee and her smile stay in frame while the empty table in the foreground is trimmed. Nothing is
            drawn over her face, and no name, age or profile badge, so it can never read as a real member. */}
        <FadeIn className="relative aspect-[4/3] w-full overflow-hidden rounded-3xl bg-[#E8E6F1]/50 shadow-[0_8px_30px_rgba(65,59,94,0.12)]">
          <Image
            src="/Camille_Hero.png"
            alt={m.hero.imageAlt}
            fill
            preload
            quality={90}
            sizes="(max-width: 448px) 100vw, 448px"
            className="object-cover object-[50%_22%] select-none pointer-events-none"
          />
        </FadeIn>

        <h1 className="mt-4 w-full text-[26px] font-semibold tracking-tight leading-tight text-[#413B5E] break-words">
          <span className="block">{m.hero.line1}</span>
          <span className="block text-[#8574B7]">{m.hero.line2}</span>
          <span className="block">{m.hero.line3}</span>
        </h1>

        <p className="mt-2 w-full text-sm leading-relaxed text-slate-600 break-words">{m.hero.subtitle}</p>

        {/* CTA block: one item per row */}
        <FadeIn delay={0.08} className="mt-4 w-full flex flex-col items-center gap-3">
          <TapButton>
            <Link
              href="/signup"
              className="w-full h-12 inline-flex items-center justify-center rounded-full bg-[#8574B7] hover:bg-[#534377] text-white font-medium text-sm transition-colors duration-200"
            >
              {m.hero.join}
            </Link>
          </TapButton>

          <p className="text-[13px] font-medium text-slate-600">{m.hero.factSparks}</p>

          <SignInPrompt />
        </FadeIn>
      </div>
    </section>
  );
}
