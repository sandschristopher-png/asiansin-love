'use client';

import React, { useEffect, useRef, useState } from 'react';
import { Heart } from 'lucide-react';

const POP_MS = 380; // a little longer than the 360 ms .animate-heart-pop so it always finishes

/**
 * Discover-card Spark button (Pairs / with.is model): a symmetric heart that only ever sends a
 * Spark. It never turns into a message button; chat opens only after a mutual Spark.
 *   unsparked: borderless white heart floating on the photo (drop shadow for contrast, no circle)
 *   tap:       360 ms spring pop + 12 ms haptic, heart fills rose (no particles / sparkles)
 *   sparked:   filled rose heart, disabled (no un-spark from the card)
 *
 * Position it with `className` (e.g. "absolute top-3 right-3 z-20"). The component sets no
 * `position` of its own: a built-in `relative` would override a caller's `absolute` (Tailwind
 * emits `relative` later) and push the button out of the card.
 */
export function SparkHeartButton({
  sparked,
  onSpark,
  name,
  className = '',
}: {
  sparked: boolean;
  onSpark: () => void;
  name: string;
  className?: string;
}) {
  // The parent flips `sparked` synchronously in the same click (and reverts it if the request
  // fails), so the fill lands on the same frame as the pop.
  const isSparked = sparked;
  const [isPopping, setIsPopping] = useState(false);
  const popTimer = useRef<number | null>(null);

  useEffect(
    () => () => {
      if (popTimer.current !== null) window.clearTimeout(popTimer.current);
    },
    []
  );

  return (
    <button
      type="button"
      aria-label={isSparked ? `Spark sent to ${name}` : `Send Spark to ${name}`}
      aria-pressed={isSparked}
      disabled={isSparked && !isPopping}
      onClick={(e) => {
        e.stopPropagation();
        e.preventDefault();
        if (isSparked) return;
        setIsPopping(true);
        if (popTimer.current !== null) window.clearTimeout(popTimer.current);
        popTimer.current = window.setTimeout(() => setIsPopping(false), POP_MS);
        if (typeof window !== 'undefined' && 'vibrate' in navigator) {
          try {
            navigator.vibrate(12);
          } catch {
            // vibration is best-effort
          }
        }
        onSpark();
      }}
      className={`p-1 transition-transform duration-150 active:scale-125 drop-shadow-[0_2px_5px_rgba(0,0,0,0.45)] cursor-pointer disabled:cursor-default ${
        isSparked ? 'text-[#EC4899]' : 'text-white hover:text-[#EC4899]'
      } ${className}`}
    >
      <span className={`inline-flex ${isPopping ? 'animate-heart-pop' : ''}`}>
        <Heart
          className={`w-7 h-7 stroke-[2.2] transition-colors duration-200 ${
            isSparked ? 'fill-[#EC4899]' : 'fill-white/20 hover:fill-[#EC4899]'
          }`}
        />
      </span>
    </button>
  );
}
