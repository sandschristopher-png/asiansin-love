'use client';

import React from 'react';
import { motion } from 'framer-motion';

interface WaveformProps {
  isPlaying: boolean;
  progress: number; // 0 to 1
  barCount?: number;
}

// Fixed resting fingerprint heights (normalized between 0.2 and 1.0)
const RESTING_HEIGHTS = [
  0.25, 0.4, 0.7, 0.5, 0.85, 0.6, 0.95, 0.75, 0.45, 0.8,
  1.0, 0.65, 0.9, 0.55, 0.75, 0.85, 0.6, 0.95, 0.7, 0.4,
  0.8, 0.6, 0.45, 0.3,
];

/**
 * Voice waveform: rests at a fixed fingerprint; while playing, each bar loops through staggered
 * bounce heights (Framer Motion, so it runs regardless of CSS keyframes) and settles back to its
 * resting height in 250 ms on pause. Bars before the playback position fill with the brand
 * gradient; the rest stay #D5C6EC. Heights are percentages of the fixed h-7 row, so nothing
 * around it moves.
 */
export function AnimatedWaveform({ isPlaying, progress, barCount = 24 }: WaveformProps) {
  const bars = RESTING_HEIGHTS.slice(0, barCount);

  return (
    <div className="flex items-center gap-[3px] h-7 px-1">
      {bars.map((restingHeight, i) => {
        const isPlayed = progress > 0 && i / barCount <= progress;
        // Staggered rhythmic bounce heights when playing
        const bounceHeight = Math.max(0.2, restingHeight * 0.5 + (i % 3) * 0.25);

        return (
          <motion.span
            key={i}
            aria-hidden
            className={`w-[3px] rounded-full transition-colors duration-200 ${
              isPlayed ? 'bg-[#72519A]' : 'bg-[#D5C6EC]'
            }`}
            initial={false}
            animate={
              isPlaying
                ? {
                    height: [
                      `${restingHeight * 100}%`,
                      `${bounceHeight * 100}%`,
                      `${Math.min(1, restingHeight * 1.25) * 100}%`,
                      `${restingHeight * 100}%`,
                    ],
                  }
                : { height: `${restingHeight * 100}%` }
            }
            transition={
              isPlaying
                ? {
                    duration: 0.65 + (i % 4) * 0.12,
                    repeat: Infinity,
                    repeatType: 'reverse',
                    ease: 'easeInOut',
                    delay: (i * 0.04) % 0.3,
                  }
                : { duration: 0.25, ease: 'easeOut' }
            }
            style={{ minHeight: '4px' }}
          />
        );
      })}
    </div>
  );
}

export default AnimatedWaveform;
