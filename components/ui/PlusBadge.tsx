import React from 'react';

/**
 * The one "Plus" badge: Plus Jakarta Sans, liquid amethyst-to-rose gradient text on a soft tinted
 * pill. Used for the member badge (profile, side menu) and for Plus feature locks.
 *   size "sm": inline feature-lock tags;  "md": next to a member's name
 * (The header uses its own featherweight PLUS micro-pill in components/Navbar.tsx.)
 */
export function PlusBadge({ size = 'md', className = '' }: { size?: 'sm' | 'md'; className?: string }) {
  return (
    <span
      role="img"
      aria-label="Plus member"
      className={`inline-flex items-center shrink-0 rounded-full bg-gradient-to-r from-[#8C71F5]/10 to-[#EC4899]/10 border border-[#8C71F5]/25 ${
        size === 'sm' ? 'px-1.5 py-px' : 'px-2 py-0.5'
      } ${className}`}
    >
      <span
        className={`font-sans font-bold normal-case tracking-normal leading-none bg-gradient-to-r from-[#8C71F5] to-[#EC4899] bg-clip-text text-transparent ${
          size === 'sm' ? 'text-[10px]' : 'text-xs'
        }`}
      >
        Plus
      </span>
    </span>
  );
}

export default PlusBadge;
