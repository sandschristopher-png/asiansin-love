import React from 'react';

/**
 * The one subscriber badge: a delicate uppercase "PLUS" in soft purple on a light lavender pill
 * with a hairline border (Plus Jakarta Sans). Badge text is always uppercase, never mixed case.
 *   size "header":  beside the header wordmark (components/Navbar.tsx)
 *   size "profile": beside a member's name (My Profile, side menu), settings rows and Plus locks
 */
export function PlusBadge({ size = 'profile', className = '' }: { size?: 'header' | 'profile'; className?: string }) {
  const header = size === 'header';
  return (
    <span
      role="img"
      aria-label="Plus member"
      className={`inline-flex items-center justify-center shrink-0 self-center leading-none uppercase font-sans font-medium tracking-wider text-[#72519A] bg-[#E8DFF5]/60 border border-[#D5C6EC] px-1.5 py-0.5 rounded-md ${
        header ? 'text-[9px]' : 'text-[10px]'
      } ${className}`}
    >
      PLUS
    </span>
  );
}

export default PlusBadge;
