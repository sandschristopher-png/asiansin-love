'use client';

import React, { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { SEA_CITIES } from '@/lib/geoCities';

/**
 * "Meet someone in {city}" auth hero (login and signup). `cities` is the geo-picked roster from the
 * page (lib/geoCities.ts). Every 2.4 s the city wipes horizontally: AnimatePresence mode="wait"
 * lets the old city finish exiting left before the next one enters from the right, and keying
 * the span by city name makes React remount it (no in-place patch).
 */
export function CityRotator({ cities = SEA_CITIES }: { cities?: readonly string[] }) {
  const [cityIndex, setCityIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCityIndex((prev) => (prev + 1) % cities.length);
    }, 2400);
    return () => clearInterval(timer);
  }, [cities.length]);

  const city = cities[cityIndex % cities.length];

  return (
    <div className="flex flex-col items-center justify-center text-center mt-6 mb-8 select-none">
      <p className="text-[11px] font-bold tracking-[0.2em] uppercase text-[#51376D]/65 mb-1.5 select-none">Meet someone in</p>
      <div className="h-12 overflow-hidden flex items-center justify-center relative w-full" aria-live="polite" aria-atomic="true">
        <AnimatePresence mode="wait">
          <motion.span
            key={city}
            initial={{ opacity: 0, x: 28 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -28 }}
            transition={{ duration: 0.32, ease: [0.16, 1, 0.3, 1] }}
            className="inline-block text-2xl sm:text-3xl font-extrabold tracking-tight bg-gradient-to-r from-[#72519A] via-[#9474C3] to-[#72519A] bg-clip-text text-transparent leading-tight text-center"
          >
            {city}
          </motion.span>
        </AnimatePresence>
      </div>
    </div>
  );
}

export default CityRotator;
