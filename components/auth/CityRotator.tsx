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

const HOLD_MS = 2400;
const OUT_MS = 200;

/**
 * "Meet someone in {city}" auth hero. Only one city is ever on screen: after a 2.4 s hold the
 * current city slides left and fades out (200 ms), and only then does the next one slide in from
 * the right (250 ms). The span shrink-wraps the word, so the violet-to-pink gradient spans every
 * name, short or long. The fixed-height, overflow-hidden slot keeps the page from moving.
 */
export function CityRotator() {
  const [idx, setIdx] = useState(0);
  const [phase, setPhase] = useState<'idle' | 'out' | 'in'>('idle');

  useEffect(() => {
    if (phase === 'out') {
      const t = window.setTimeout(() => {
        setIdx((i) => (i + 1) % SOUTHEAST_ASIAN_CITIES.length);
        setPhase('in');
      }, OUT_MS);
      return () => window.clearTimeout(t);
    }
    const t = window.setTimeout(() => setPhase('out'), HOLD_MS);
    return () => window.clearTimeout(t);
  }, [phase, idx]);

  return (
    <div className="flex flex-col items-center justify-center text-center mt-6 mb-8 select-none">
      <p className="text-[11px] font-bold tracking-[0.2em] uppercase select-none mb-1.5 text-[#2D264B]/65">Meet someone in</p>
      <div className="w-full h-12 overflow-hidden flex items-center justify-center" aria-live="polite" aria-atomic="true">
        <span
          key={idx}
          className={`inline-block font-black text-3xl sm:text-4xl tracking-tight bg-gradient-to-r from-[#8C71F5] via-[#B855F6] to-[#EC4899] bg-clip-text text-transparent leading-tight text-center whitespace-nowrap ${
            phase === 'out' ? 'ail-city-out' : phase === 'in' ? 'ail-city-in' : ''
          }`}
        >
          {SOUTHEAST_ASIAN_CITIES[idx]}
        </span>
      </div>
    </div>
  );
}

export default CityRotator;
