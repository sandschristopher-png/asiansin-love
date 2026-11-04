'use client';

import React from 'react';
import { motion } from 'framer-motion';

/**
 * Soft pastel aurora pooled behind the middle and lower canvas: violet center-left (24%), pink
 * center-right (22%), lilac lower-center (20%). Framer Motion drives the drift, so it runs
 * without any global or embedded CSS keyframes.
 *
 * Blob 3 is centered by Framer's x: '-50%' only. Tailwind v4's -translate-x-1/2 sets the separate
 * CSS `translate` property, which would stack with Framer's transform and push the blob a full
 * half-width further left.
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
      {/* Blob 1: Iris/Violet - Center Left */}
      <motion.div
        animate={{ x: [0, 24, 0], y: [0, -20, 0], scale: [1, 1.08, 1] }}
        transition={{ duration: 14, repeat: Infinity, ease: 'easeInOut' }}
        className="absolute top-1/3 -left-12 sm:left-4 w-[340px] h-[340px] sm:w-[400px] sm:h-[400px] rounded-full bg-[#8C71F5]/24 blur-[80px] will-change-transform"
      />

      {/* Blob 2: Radiant Pink - Center Right */}
      <motion.div
        animate={{ x: [0, -22, 0], y: [0, 24, 0], scale: [1, 0.94, 1] }}
        transition={{ duration: 18, repeat: Infinity, ease: 'easeInOut' }}
        className="absolute top-1/2 -right-12 sm:right-4 w-[320px] h-[320px] sm:w-[380px] sm:h-[380px] rounded-full bg-[#EC4899]/22 blur-[80px] will-change-transform"
      />

      {/* Blob 3: Warm Lilac / Rose - Lower Center */}
      <motion.div
        initial={{ x: '-50%' }}
        animate={{ x: ['-50%', '-50%', '-50%'], y: [0, -18, 0], scale: [1, 1.06, 1] }}
        transition={{ duration: 16, repeat: Infinity, ease: 'easeInOut' }}
        className="absolute bottom-12 left-1/2 w-[360px] h-[300px] sm:w-[420px] sm:h-[340px] rounded-full bg-[#C084FC]/20 blur-[90px] will-change-transform"
      />
    </div>
  );
}

export default AmbientAurora;
