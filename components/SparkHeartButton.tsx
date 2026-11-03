'use client';

import React, { useState } from 'react';
import { Heart } from 'lucide-react';

const PARTICLES = 8;

/**
 * Discover-card Spark button (Pairs / with.is model): a symmetric heart that only ever sends a
 * Spark. It never turns into a message button; chat opens only after a mutual Spark.
 *   unsparked: glass circle, purple outline heart
 *   tap:       spring bounce + 8-particle lilac/gold burst + 12 ms haptic, heart fills purple
 *   sparked:   filled heart, disabled (no un-spark from the card)
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
  // Bumping the key restarts the CSS animations on every tap.
  const [burstKey, setBurstKey] = useState(0);

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
        setBurstKey((k) => k + 1);
        try {
          navigator.vibrate?.(12);
        } catch {
          // vibration is best-effort
        }
        onSpark();
      }}
      className={`relative w-9 h-9 rounded-full flex items-center justify-center bg-white/85 backdrop-blur-md border border-white/70 shadow-[0_2px_8px_rgba(28,25,36,0.18)] cursor-pointer disabled:cursor-default transition-transform active:scale-95 ${className}`}
    >
      {burstKey > 0 && (
        <span key={`burst-${burstKey}`} aria-hidden className="absolute inset-0 pointer-events-none">
          {Array.from({ length: PARTICLES }).map((_, i) => (
            <span
              key={i}
              className="ail-spark-particle"
              style={
                {
                  '--angle': `${(360 / PARTICLES) * i}deg`,
                  backgroundColor: i % 2 === 0 ? '#9D8CFC' : '#FCD34D',
                } as React.CSSProperties
              }
            />
          ))}
        </span>
      )}
      {/* Lucide's heart is drawn slightly low in its 24px box; a 0.5px lift centers it optically. */}
      <Heart
        key={`heart-${burstKey}`}
        strokeWidth={2}
        className={`w-[18px] h-[18px] -translate-y-[0.5px] ${burstKey > 0 ? 'ail-heart-spring' : ''}`}
        stroke="#6555B8"
        fill={sparked ? '#6555B8' : 'none'}
      />
    </button>
  );
}
