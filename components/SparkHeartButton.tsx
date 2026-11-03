'use client';

import React, { useState } from 'react';
import { Heart } from 'lucide-react';

/**
 * Discover-card Spark button (Pairs / with.is model): a symmetric heart that only ever sends a
 * Spark. It never turns into a message button; chat opens only after a mutual Spark.
 *   unsparked: white glass circle, purple outline heart
 *   tap:       340 ms spring pop + 12 ms haptic, heart fills purple (no particles / sparkles)
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
  // Bumping the key remounts the icon so the spring replays on every tap.
  const [popKey, setPopKey] = useState(0);

  return (
    <button
      type="button"
      aria-label={sparked ? `Spark sent to ${name}` : `Send Spark to ${name}`}
      aria-pressed={sparked}
      disabled={sparked}
      onClick={(e) => {
        e.stopPropagation();
        e.preventDefault();
        if (sparked) return;
        setPopKey((k) => k + 1);
        try {
          navigator.vibrate?.(12);
        } catch {
          // vibration is best-effort
        }
        onSpark();
      }}
      className={`w-10 h-10 rounded-full bg-white/80 backdrop-blur-md shadow-md flex items-center justify-center transition-transform active:scale-95 cursor-pointer disabled:cursor-default ${className}`}
    >
      <Heart
        key={popKey}
        strokeWidth={2}
        className={`w-5 h-5 ${popKey > 0 ? 'ail-heart-spring' : ''}`}
        stroke="#6555B8"
        fill={sparked ? '#6555B8' : 'none'}
      />
    </button>
  );
}
