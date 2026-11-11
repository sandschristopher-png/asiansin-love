'use client';

import React, { useEffect, useState } from 'react';
import { DESTINATION_CITIES } from '@/lib/geoCities';

const INTERVAL_MS = 2500;
const FADE_MS = 500;

/**
 * "Meet someone in {place}" auth hero (login and signup). `cities` is the geo-picked roster from
 * the page (lib/geoCities.ts). Every 2.5 s the place fades out (500 ms ease-in-out), swaps, and
 * fades back in. The line has a fixed height and never wraps, and it is centred in a full-width
 * box, so names of any length cause no vertical or horizontal layout shift.
 * Not announced to screen readers on every change (that would interrupt every 2.5 s); they hear
 * the first place once.
 */
export function CityRotator({ cities = DESTINATION_CITIES }: { cities?: readonly string[] }) {
  const [index, setIndex] = useState(0);
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    if (cities.length < 2) return;
    let swap: number | undefined;
    const timer = window.setInterval(() => {
      setVisible(false);
      swap = window.setTimeout(() => {
        setIndex((i) => (i + 1) % cities.length);
        setVisible(true);
      }, FADE_MS);
    }, INTERVAL_MS);
    return () => {
      window.clearInterval(timer);
      if (swap) window.clearTimeout(swap);
    };
  }, [cities.length]);

  const place = cities[index % cities.length];

  return (
    <div className="flex flex-col items-center justify-center text-center mt-6 mb-8 select-none">
      <p className="text-[11px] font-semibold tracking-[0.2em] uppercase text-slate-600 mb-1.5">Meet someone in</p>
      <div className="h-12 w-full overflow-hidden flex items-center justify-center">
        <span
          style={{ transitionDuration: `${FADE_MS}ms` }}
          className={`block max-w-full truncate whitespace-nowrap text-2xl sm:text-3xl font-semibold tracking-tight leading-tight text-[#8574B7] transition-opacity ease-in-out motion-reduce:transition-none ${
            visible ? 'opacity-100' : 'opacity-0'
          }`}
        >
          {place}
        </span>
      </div>
    </div>
  );
}

export default CityRotator;
