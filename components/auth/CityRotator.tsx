'use client';

import React, { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';

export const CITIES = [
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
];

/**
 * "Meet someone in {city}" auth hero (login and signup). Every 2.4 s the city wipes horizontally:
 * AnimatePresence mode="wait" lets the old city finish exiting left before the next one enters
 * from the right, and keying the span by city name makes React remount it (no in-place patch).
 */
export function CityRotator() {
  const [cityIndex, setCityIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCityIndex((prev) => (prev + 1) % CITIES.length);
    }, 2400);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="flex flex-col items-center justify-center text-center mt-6 mb-8 select-none">
      <p className="text-[11px] font-bold tracking-[0.2em] uppercase text-[#2D264B]/65 mb-1.5 select-none">Meet someone in</p>
      <div className="h-12 overflow-hidden flex items-center justify-center relative w-full" aria-live="polite" aria-atomic="true">
        <AnimatePresence mode="wait">
          <motion.span
            key={CITIES[cityIndex]}
            initial={{ opacity: 0, x: 28 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -28 }}
            transition={{ duration: 0.32, ease: [0.16, 1, 0.3, 1] }}
            className="inline-block font-black text-3xl sm:text-4xl tracking-tight bg-gradient-to-r from-[#8C71F5] via-[#B855F6] to-[#EC4899] bg-clip-text text-transparent leading-tight text-center"
          >
            {CITIES[cityIndex]}
          </motion.span>
        </AnimatePresence>
      </div>
    </div>
  );
}

export default CityRotator;
