'use client';

import React, { useEffect, useRef, useState } from 'react';

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
 * "Meet someone in {city}" auth hero: the city slides up and fades every 2.4 s (300 ms), inside a
 * fixed-height slot so nothing below ever moves. The pill row underneath follows the current
 * city; tapping a pill jumps to it and restarts the timer.
 */
export function CityRotator() {
  const [idx, setIdx] = useState(0);
  const [prev, setPrev] = useState<number | null>(null);
  const pillsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const t = window.setTimeout(() => {
      setPrev(idx);
      setIdx((idx + 1) % SOUTHEAST_ASIAN_CITIES.length);
    }, ROTATE_MS);
    return () => window.clearTimeout(t);
  }, [idx]);

  // Keep the active pill centered by scrolling the row only (never the page).
  useEffect(() => {
    const row = pillsRef.current;
    const pill = row?.querySelector<HTMLElement>('[aria-pressed="true"]');
    if (!row || !pill) return;
    row.scrollTo({ left: pill.offsetLeft - (row.clientWidth - pill.offsetWidth) / 2, behavior: 'smooth' });
  }, [idx]);

  const jump = (i: number) => {
    if (i === idx) return;
    setPrev(idx);
    setIdx(i);
  };

  const cityClass =
    'absolute inset-x-0 font-black text-3xl sm:text-4xl tracking-tight leading-tight bg-gradient-to-r from-[#8C71F5] to-[#EC4899] bg-clip-text text-transparent whitespace-nowrap';

  return (
    <div className="flex flex-col items-center justify-center text-center my-6 select-none">
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
      <div
        ref={pillsRef}
        className="w-[calc(100%+3rem)] -mx-6 mt-2 flex gap-2 overflow-x-auto no-scrollbar [scrollbar-width:none] [&::-webkit-scrollbar]:hidden py-2 px-6"
      >
        {SOUTHEAST_ASIAN_CITIES.map((city, i) => {
          const active = i === idx;
          return (
            <button
              key={city}
              type="button"
              aria-pressed={active}
              onClick={() => jump(i)}
              className={`shrink-0 h-7 px-3 rounded-full border text-xs font-semibold transition-colors duration-300 ${
                active ? 'bg-[#2D264B] text-white border-[#2D264B]' : 'bg-white/70 text-neutral-500 border-[#ECE8F4]'
              }`}
            >
              {city}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export default CityRotator;
