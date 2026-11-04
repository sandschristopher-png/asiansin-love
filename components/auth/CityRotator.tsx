'use client';

import React, { useEffect, useState } from 'react';

export const SOUTHEAST_ASIAN_CITIES = [
  'Bangkok',
  'Manila',
  'Singapore',
  'Saigon',
  'Cebu',
  'Kuala Lumpur',
  'Phnom Penh',
  'Hanoi',
  'Chiang Mai',
  'Da Nang',
  'Jakarta',
  'Phuket',
] as const;

const ROTATE_MS = 2400;

/**
 * "Meet someone in {city}" auth hero: every 2.4 s the next city glides in from the right while the
 * current one glides out to the left (320 ms, horizontal only). The fixed-height, overflow-hidden
 * slot keeps the slide from moving the page or adding horizontal scroll.
 */
export function CityRotator() {
  const [idx, setIdx] = useState(0);
  const [prev, setPrev] = useState<number | null>(null);

  useEffect(() => {
    const t = window.setTimeout(() => {
      setPrev(idx);
      setIdx((idx + 1) % SOUTHEAST_ASIAN_CITIES.length);
    }, ROTATE_MS);
    return () => window.clearTimeout(t);
  }, [idx]);

  const cityClass =
    'absolute inset-x-0 font-black text-3xl sm:text-4xl tracking-tight bg-gradient-to-r from-[#8C71F5] to-[#EC4899] bg-clip-text text-transparent leading-tight text-center whitespace-nowrap';

  return (
    <div className="flex flex-col items-center justify-center text-center mt-6 mb-8 select-none">
      <p className="text-sm font-semibold tracking-wider uppercase text-neutral-400 mb-1">Meet someone in</p>
      <div className="relative w-full h-12 overflow-hidden flex items-center justify-center" aria-live="polite" aria-atomic="true">
        {prev !== null && (
          <span key={`out-${prev}-${idx}`} aria-hidden className={`${cityClass} ail-city-out`}>
            {SOUTHEAST_ASIAN_CITIES[prev]}
          </span>
        )}
        <span key={`in-${idx}`} className={`${cityClass} ${prev !== null ? 'ail-city-in' : ''}`}>
          {SOUTHEAST_ASIAN_CITIES[idx]}
        </span>
      </div>
    </div>
  );
}

export default CityRotator;
