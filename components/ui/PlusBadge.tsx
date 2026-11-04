import React from 'react';

/**
 * The one subscriber badge: uppercase "PLUS" in the liquid amethyst-to-rose gradient on a soft
 * tinted pill (Plus Jakarta Sans). Badge text is always uppercase, never mixed case.
 *   size "header":  featherweight micro-pill beside the header wordmark (components/Navbar.tsx)
 *   size "profile": beside a member's name (My Profile, side menu) and on Plus feature locks
 */
export function PlusBadge({ size = 'profile', className = '' }: { size?: 'header' | 'profile'; className?: string }) {
  const header = size === 'header';
  return (
    <span
      role="img"
      aria-label="Plus member"
      className={`inline-flex items-center justify-center shrink-0 self-center bg-gradient-to-r ${
        header
          ? 'h-3.5 px-1.5 py-0 rounded-[4px] from-[#8C71F5]/8 to-[#EC4899]/8 border border-[#8C71F5]/20'
          : 'h-4.5 px-2 py-0.5 rounded-[5px] from-[#8C71F5]/10 to-[#EC4899]/10 border border-[#8C71F5]/25'
      } ${className}`}
    >
      <span
        className={`font-sans font-extrabold tracking-widest uppercase leading-none bg-gradient-to-r from-[#8C71F5] to-[#EC4899] bg-clip-text text-transparent ${
          header ? 'text-[8px]' : 'text-[9.5px]'
        }`}
      >
        PLUS
      </span>
    </span>
  );
}

export default PlusBadge;
