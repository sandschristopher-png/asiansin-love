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
 * Hero stack, top to bottom: photo, headline and copy, then the CTA block in this order: Join for
 * Free (/signup), the Selfie-Verified trust line, the Sparks stat, "Already a member? Sign in" (/login). Text comes from the active
 * dictionary (messages/<locale>.json). Rendered inside LANDING_SHELL.
 */
export default function Hero() {
  const { m } = useLocale();
  return (
    <section className="w-full bg-white pt-2 pb-10">
      <div className="flex flex-col items-center text-center">
        {/* Photo in a rounded card at its own 1024x687 ratio with object-contain, so it is never cropped. */}
        <div className="relative w-full aspect-[1024/687] overflow-hidden rounded-3xl bg-[#E8E6F1]/50">
          <Image
            src="/Landing-Woman.png"
            alt={m.hero.imageAlt}
            fill
            preload
            quality={95}
            sizes="(max-width: 448px) 100vw, 448px"
            className="object-contain select-none pointer-events-none"
          />
        </div>

        <h1 className="mt-8 w-full text-[28px] font-semibold tracking-tight leading-tight text-[#413B5E] break-words">
          <span className="block">{m.hero.line1}</span>
          <span className="block text-[#8574B7]">{m.hero.line2}</span>
          <span className="block">{m.hero.line3}</span>
        </h1>

        <p className="mt-3 w-full text-[15px] leading-relaxed text-slate-600 break-words">{m.hero.subtitle}</p>

        {/* CTA block: one item per row */}
        <div className="mt-7 w-full flex flex-col items-center gap-4">
          <Link
            href="/signup"
            className="w-full h-12 inline-flex items-center justify-center rounded-full bg-[#8574B7] hover:bg-[#534377] text-white font-medium text-sm active:scale-95 transition-all"
          >
            {m.hero.join}
          </Link>

          {/* Trust line, then the Sparks social-proof stat: one row each. */}
          <div className="flex flex-col items-center gap-1">
            <p className="text-[13px] font-semibold text-[#8574B7]">{m.hero.factVerified}</p>
            <p className="text-[13px] font-medium text-slate-600">{m.hero.factSparks}</p>
          </div>

          <SignInPrompt />
        </div>
      </div>
    </section>
  );
}
