import React from 'react';

/**
 * "ail+" member badge: Playwrite IT Moderna script (font-logo) in the amethyst-to-rose gradient.
 *   dark: deep velvet pill (profile header)
 *   soft: subtle violet pill (menus, light lists)
 */
export function AilBadge({ variant = 'dark', className = '' }: { variant?: 'dark' | 'soft'; className?: string }) {
  const pill =
    variant === 'soft'
      ? 'bg-[#F3EFFC] border border-[#E2DBF0]'
      : 'bg-[#2D264B] text-white shadow-xs border border-white/10';
  return (
    <span role="img" aria-label="ail+ member" className={`inline-flex items-center px-2 py-0.5 rounded-full ${pill} ${className}`}>
      <span
        className={`font-logo font-bold text-[13px] tracking-tight bg-gradient-to-r text-transparent bg-clip-text pr-[0.1em] ${
          variant === 'soft' ? 'from-[#8C71F5] to-[#EC4899]' : 'from-[#C084FC] to-[#EC4899]'
        }`}
      >
        ail+
      </span>
    </span>
  );
}

export default AilBadge;
