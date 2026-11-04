import React from 'react';

/**
 * Soft pastel aurora behind a surface: three blurred radial blobs (violet, pink, lilac) drifting
 * on slow 16-20 s loops. Purely decorative. The parent needs `relative isolate` (so -z-10 stays
 * inside it) and its own background (#FAF8FD or white).
 *
 * Used on the auth screen, the Mutual Spark modal and the Plus upgrade sheets only. Never behind
 * the Discover feed or chat threads, where photos and text need full contrast.
 * Animations are transform-only (compositor) and stop under prefers-reduced-motion.
 */
export function AmbientAurora({ className = '' }: { className?: string }) {
  return (
    <div aria-hidden className={`absolute inset-0 overflow-hidden pointer-events-none -z-10 ${className}`}>
      <span className="ail-aurora-blob ail-aurora-1 absolute -top-[18%] -left-[22%] w-[75%] aspect-square rounded-full bg-[#8C71F5]/[0.11] blur-3xl" />
      <span className="ail-aurora-blob ail-aurora-2 absolute top-[22%] -right-[26%] w-[70%] aspect-square rounded-full bg-[#EC4899]/[0.08] blur-3xl" />
      <span className="ail-aurora-blob ail-aurora-3 absolute -bottom-[20%] left-[8%] w-[65%] aspect-square rounded-full bg-[#C084FC]/[0.07] blur-3xl" />
    </div>
  );
}

export default AmbientAurora;
