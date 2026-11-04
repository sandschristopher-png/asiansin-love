import React from 'react';

/**
 * Soft pastel aurora pooled behind the middle and lower canvas: violet center-left (24%), pink
 * center-right (22%), lilac lower-center (20%), each drifting on its own 15-19 s loop.
 * Keyframes are embedded so the drift never depends on the global stylesheet. Transform-only
 * (compositor); held still under prefers-reduced-motion.
 *
 * Blob 3 is centered by its keyframes (translate(-50%, ...)), not by a Tailwind translate class:
 * Tailwind v4's translate utilities set the separate `translate` property, which would stack with
 * the animated transform and push the blob a full width off-center.
 *
 * Layering:
 *   layer="page" (default): z-0. Put the content above it in a `relative z-10` wrapper and keep
 *     the page background transparent or translucent so the wash shows (auth screen).
 *   layer="card": -z-10 inside an `isolate` card, for modals whose children aren't positioned
 *     (Mutual Spark modal, Plus upgrade sheets).
 *
 * Never behind the Discover feed or chat threads, where photos and text need full contrast.
 */
const KEYFRAMES = `
  @keyframes aurora-drift-1 {
    0%, 100% { transform: translate(0px, 0px) scale(1); }
    50% { transform: translate(28px, -24px) scale(1.08); }
  }
  @keyframes aurora-drift-2 {
    0%, 100% { transform: translate(0px, 0px) scale(1); }
    50% { transform: translate(-24px, 28px) scale(0.95); }
  }
  @keyframes aurora-drift-3 {
    0%, 100% { transform: translate(-50%, 0px) scale(1); }
    50% { transform: translate(-50%, -22px) scale(1.06); }
  }
  .animate-aurora-1 {
    animation: aurora-drift-1 15s ease-in-out infinite;
    will-change: transform;
  }
  .animate-aurora-2 {
    animation: aurora-drift-2 19s ease-in-out infinite;
    will-change: transform;
  }
  .animate-aurora-3 {
    transform: translate(-50%, 0px);
    animation: aurora-drift-3 17s ease-in-out infinite;
    will-change: transform;
  }
  @media (prefers-reduced-motion: reduce) {
    .animate-aurora-1, .animate-aurora-2, .animate-aurora-3 { animation: none; }
  }
`;

export function AmbientAurora({ layer = 'page' }: { layer?: 'page' | 'card' }) {
  return (
    <div aria-hidden className={`absolute inset-0 overflow-hidden pointer-events-none ${layer === 'card' ? '-z-10' : 'z-0'}`}>
      <style dangerouslySetInnerHTML={{ __html: KEYFRAMES }} />
      <span className="animate-aurora-1 absolute top-1/3 -left-12 sm:left-2 w-[320px] h-[320px] sm:w-[380px] sm:h-[380px] rounded-full bg-[#8C71F5]/[0.24] blur-[80px] pointer-events-none" />
      <span className="animate-aurora-2 absolute top-1/2 -right-12 sm:right-2 w-[300px] h-[300px] sm:w-[360px] sm:h-[360px] rounded-full bg-[#EC4899]/[0.22] blur-[80px] pointer-events-none" />
      <span className="animate-aurora-3 absolute bottom-16 left-1/2 w-[360px] h-[280px] sm:w-[420px] sm:h-[320px] rounded-full bg-[#C084FC]/[0.20] blur-[90px] pointer-events-none" />
    </div>
  );
}

export default AmbientAurora;
