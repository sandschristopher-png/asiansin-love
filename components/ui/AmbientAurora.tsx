import React from 'react';

/**
 * Soft pastel aurora: three blurred radial blobs (violet 26%, pink 22%, lilac 20%) drifting on
 * slow 16-20 s loops. Purely decorative and transform-only (compositor); stops under
 * prefers-reduced-motion.
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
      <span className="ail-aurora-blob ail-aurora-1 absolute -top-20 -left-24 w-[340px] h-[340px] rounded-full bg-[#8C71F5]/[0.26] blur-3xl" />
      <span className="ail-aurora-blob ail-aurora-2 absolute top-10 -right-28 w-[320px] h-[320px] rounded-full bg-[#EC4899]/[0.22] blur-3xl" />
      <span className="ail-aurora-blob ail-aurora-3 absolute -bottom-24 left-1/2 -ml-[150px] w-[300px] h-[300px] rounded-full bg-[#C084FC]/[0.20] blur-3xl" />
    </div>
  );
}

export default AmbientAurora;
