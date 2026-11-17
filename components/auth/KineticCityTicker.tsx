'use client';

import React, { useEffect, useState } from 'react';
import { heroRoster, type HeroAudience } from '@/lib/geoCities';
import { useLocale } from '@/components/i18n/LocaleProvider';

const CYCLE_MS = 3200;

/**
 * "Meet someone in {city}" / "Meet someone from {country}" auth hero (login and signup). Visitors from
 * Southeast Asia read "from" with Western countries; everyone else reads "in" with Southeast Asian cities
 * (lib/geoCities.ts). The name changes with a short fade-and-rise: it is always a real city or country, never
 * a half-decoded string of random letters (the old letter-scramble could freeze on frames like "Coxx" and
 * read as a bug). Layout never moves: a fixed-height line, and an invisible copy of the longest name
 * reserves the width. Reduced motion: the name just swaps.
 */
export function KineticCityTicker({ audience = 'western' }: { audience?: HeroAudience }) {
  const pool = heroRoster(audience);
  const { t } = useLocale();
  // Only the label is translated: city and country names stay as they are written.
  const prefix = audience === 'asian' ? t('auth.prefixFrom') : t('auth.prefixIn');
  const [index, setIndex] = useState(0);

  useEffect(() => {
    // The pool is fixed for the page's lifetime (audience comes from the server).
    if (pool.length < 2) return;
    const cycle = window.setInterval(() => setIndex((i) => (i + 1) % pool.length), CYCLE_MS);
    return () => window.clearInterval(cycle);
  }, [pool]);

  const current = pool[index % pool.length];
  const longest = pool.reduce((a, b) => (a.length >= b.length ? a : b), '');
  const word = 'text-2xl sm:text-3xl font-semibold tracking-tight leading-tight whitespace-nowrap';

  return (
    <div className="flex flex-col items-center justify-center text-center mt-6 mb-8 select-none">
      <p className="text-[11px] font-semibold tracking-[0.2em] uppercase text-slate-600 mb-1.5">{prefix}</p>
      <div className="relative h-12 flex items-center justify-center max-w-full">
        <span aria-hidden="true" className={`invisible ${word}`}>
          {longest}
        </span>
        {/* Screen readers get the name once per change, with no live announcements. */}
        <span className="sr-only">{current}</span>
        <span key={current} aria-hidden="true" className={`ail-ticker-in absolute inset-0 flex items-center justify-center text-[#8574B7] ${word}`}>
          {current}
        </span>
      </div>
    </div>
  );
}

export default KineticCityTicker;
