import React from 'react';

/**
 * The one subscriber badge, identical everywhere (header, side menu, profiles, settings, Plus
 * locks, upgrade sheets): a compact title-case "Plus" micro-badge in a soft rounded rectangle on a
 * light brand-purple tint. whitespace-nowrap + shrink-0 so it never wraps or squeezes the row it
 * sits in; self-center keeps it vertically centred next to the wordmark or a username.
 * `size` is accepted for older call sites; every badge renders the same.
 */
export function PlusBadge({ className = '' }: { size?: 'header' | 'profile'; className?: string }) {
  return (
    <span
      role="img"
      aria-label="Plus member"
      className={`inline-flex items-center px-1.5 py-0.5 rounded-md text-[10px] font-semibold leading-none bg-[#8574B7]/15 text-[#8574B7] whitespace-nowrap shrink-0 self-center ${className}`}
    >
      Plus
    </span>
  );
}

export default PlusBadge;
