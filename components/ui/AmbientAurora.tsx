'use client';

import React from 'react';
import { motion } from 'framer-motion';

/**
 * Soft pastel aurora: violet upper/center-left (30%), pink center-right (28%), lilac lower-center
 * (26%). Framer Motion loops of 8-9.5 s with 20-45 px drift and 0.92-1.15 scale, so the motion
 * reads clearly through the 75-80 px blur. No CSS keyframes involved.
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
    <div aria-hidden className={`absolute inset-0 overflow-hidden pointer-events-none ${layer === 'card' ? '-z-10' : 'z-0'}`}>
      {/* Blob 1: Iris / Brand Violet (#8C71F5) - Upper / Center Left */}
      <motion.div
        animate={{ x: [0, 45, -20, 0], y: [0, -35, 25, 0], scale: [1, 1.15, 0.95, 1] }}
        transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
        className="absolute top-1/4 -left-10 sm:left-4 w-[360px] h-[360px] sm:w-[420px] sm:h-[420px] rounded-full bg-[#8C71F5]/30 blur-[75px] will-change-transform"
      />

      {/* Blob 2: Radiant Pink (#EC4899) - Mid / Center Right */}
      <motion.div
        animate={{ x: [0, -40, 20, 0], y: [0, 30, -30, 0], scale: [1, 0.92, 1.12, 1] }}
        transition={{ duration: 9.5, repeat: Infinity, ease: 'easeInOut' }}
        className="absolute top-1/2 -right-10 sm:right-4 w-[340px] h-[340px] sm:w-[400px] sm:h-[400px] rounded-full bg-[#EC4899]/28 blur-[75px] will-change-transform"
      />

      {/* Blob 3: Warm Lilac / Rose (#C084FC) - Lower Center Base */}
      <motion.div
        animate={{ x: [0, 30, -30, 0], y: [0, -28, 20, 0], scale: [1, 1.14, 0.96, 1] }}
        transition={{ duration: 8.5, repeat: Infinity, ease: 'easeInOut' }}
        className="absolute bottom-8 left-1/2 -translate-x-1/2 w-[380px] h-[320px] sm:w-[440px] sm:h-[360px] rounded-full bg-[#C084FC]/26 blur-[80px] will-change-transform"
      />
    </div>
  );
}

export default AmbientAurora;
