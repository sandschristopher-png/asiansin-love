'use client';

import React from 'react';
import { MotionConfig, motion } from 'framer-motion';

/**
 * Soft pastel aurora anchored in the lower half: violet lower-mid left (32%), pink lower-mid right
 * (30%), lilac bottom center (28%). Framer Motion loops of 4.5-5.2 s with 25-50 px drift and
 * 0.90-1.15 scale, so the breathing reads immediately through the 70-75 px blur.
 *
 * Blob 3 is centered by Tailwind's -translate-x-1/2 (the CSS `translate` property) while Framer
 * animates `transform`; the two compose, so its pixel drift stays around the center.
 *
 * Layering:
 *   layer="page" (default): z-0. Put the content above it in a `relative z-10` wrapper and keep
 *     the page background transparent or translucent so the wash shows (auth screen).
 *   layer="card": -z-10 inside an `isolate` card, for modals whose children aren't positioned
 *     (Mutual Spark modal, Plus upgrade sheets).
 *
 * Never behind the Discover feed or chat threads, where photos and text need full contrast.
 */
export function AmbientAurora({ layer = 'page' }: { layer?: 'page' | 'card' }) {
  return (
    // reducedMotion="never": the OS / browser reduce-motion setting never freezes the drift.
    <MotionConfig reducedMotion="never">
    <div aria-hidden className={`absolute inset-0 overflow-hidden pointer-events-none ${layer === 'card' ? '-z-10' : 'z-0'}`}>
      {/* Blob 1: Iris / Brand Violet (#8C71F5) - Lower-Mid Left */}
      <motion.div
        animate={{ x: [0, 50, -25, 0], y: [0, -35, 25, 0], scale: [1, 1.15, 0.92, 1] }}
        transition={{ duration: 4.8, repeat: Infinity, ease: 'easeInOut' }}
        className="absolute top-[42%] -left-12 sm:left-4 w-[280px] h-[260px] sm:w-[340px] sm:h-[300px] rounded-full bg-[#8C71F5]/32 blur-[70px] will-change-transform"
      />

      {/* Blob 2: Radiant Pink (#EC4899) - Lower-Mid Right */}
      <motion.div
        animate={{ x: [0, -45, 25, 0], y: [0, 35, -30, 0], scale: [1, 0.9, 1.14, 1] }}
        transition={{ duration: 5.2, repeat: Infinity, ease: 'easeInOut' }}
        className="absolute top-[52%] -right-12 sm:right-4 w-[270px] h-[260px] sm:w-[320px] sm:h-[290px] rounded-full bg-[#EC4899]/30 blur-[70px] will-change-transform"
      />

      {/* Blob 3: Warm Lilac / Rose (#C084FC) - Bottom Center Base */}
      <motion.div
        animate={{ x: [0, 35, -35, 0], y: [0, -25, 20, 0], scale: [1, 1.15, 0.92, 1] }}
        transition={{ duration: 4.5, repeat: Infinity, ease: 'easeInOut' }}
        className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[320px] h-[240px] sm:w-[380px] sm:h-[280px] rounded-full bg-[#C084FC]/28 blur-[75px] will-change-transform"
      />
    </div>
    </MotionConfig>
  );
}

export default AmbientAurora;
