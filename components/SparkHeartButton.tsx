'use client';

import React, { useEffect, useRef, useState } from 'react';
import { Heart } from 'lucide-react';

const POP_MS = 380; // a little longer than the 360 ms .animate-heart-pop so it always finishes

/**
 * Discover-card Spark button (Pairs / with.is model): a symmetric heart that only ever sends a
 * Spark. It never turns into a message button; chat opens only after a mutual Spark.
 *   unsparked: white glass circle, purple outline heart
 *   tap:       360 ms spring pop + 12 ms haptic, heart fills purple (no particles / sparkles)
 *   sparked:   filled heart, disabled (no un-spark from the card)
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
      className={`w-10 h-10 rounded-full bg-white/80 backdrop-blur-md shadow-md flex items-center justify-center transition-transform active:scale-95 cursor-pointer disabled:cursor-default ${className}`}
    >
      <span className={`inline-flex ${isPopping ? 'animate-heart-pop' : ''}`}>
        <Heart
          strokeWidth={2}
          className="w-5 h-5 transition-colors duration-200"
          stroke="#6555B8"
          fill={isSparked ? '#6555B8' : 'none'}
        />
      </span>
    </button>
  );
}
