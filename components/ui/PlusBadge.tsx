import React from 'react';

/**
 * The one subscriber badge, identical everywhere (header, side menu, profiles, settings, Plus
 * locks, upgrade sheets): compact uppercase "PLUS" on the softest lavender wash with a hairline
 * border. whitespace-nowrap + shrink-0 so it never wraps or squeezes the row it sits in.
 * Label is brand-700 #8574B7 (4.8:1 on the wash) so 10px text stays readable.
 * `size` is accepted for older call sites; every badge renders the same.
 */
export function PlusBadge({ className = '' }: { size?: 'header' | 'profile'; className?: string }) {
  return (
    <span
      role="img"
      aria-label="Plus member"
      className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold tracking-wide uppercase bg-[#E8E6F1] text-[#8574B7] border border-[#D0CDE1] leading-none whitespace-nowrap shrink-0 self-center ${className}`}
    >
      PLUS
    </span>
  );
}

export default PlusBadge;
