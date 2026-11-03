import React from 'react';

/**
 * "ail+" member badge: Playwrite IT Moderna script (font-logo) in the amethyst-to-rose gradient
 * on a deep velvet pill. Use it everywhere AIL+ membership is shown (menu, profile).
 */
export function AilBadge({ className = '' }: { className?: string }) {
  return (
    <span
      role="img"
      aria-label="ail+ member"
      className={`inline-flex items-center px-2 py-0.5 rounded-full bg-[#2D264B] text-white shadow-xs border border-white/10 ${className}`}
    >
      <span className="font-logo font-bold text-[13px] tracking-tight bg-gradient-to-r from-[#C084FC] to-[#EC4899] text-transparent bg-clip-text pr-[0.1em]">
        ail+
      </span>
    </span>
  );
}

export default AilBadge;
