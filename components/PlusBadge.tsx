'use client';

import React from 'react';

type PlusBadgeSize = 'xs' | 'sm' | 'md' | 'lg';
type PlusBadgeVariant = 'glass' | 'dark' | 'light';

interface PlusBadgeProps {
  size?: PlusBadgeSize;
  /** glass: on photos / gradients, dark: deep velvet pill, light: lilac pill */
  variant?: PlusBadgeVariant;
  className?: string;
}

const SIZE: Record<PlusBadgeSize, string> = {
  xs: 'text-[11px] h-4 px-1.5',
  sm: 'text-[13px] h-5 px-2',
  md: 'text-[16px] h-7 px-2.5',
  lg: 'text-[22px] h-9 px-3.5',
};

const VARIANT: Record<PlusBadgeVariant, { pill: string; ail: string }> = {
  glass: { pill: 'bg-white/15 border border-white/25 backdrop-blur-md', ail: 'text-white' },
  dark: { pill: 'bg-[#2D264B] border border-[#2D264B]', ail: 'text-white' },
  light: { pill: 'bg-[#F3EFFC] border border-[#ECE8F4]', ail: 'text-[#2D264B]' },
};

/** "ail+" membership mark: Playwrite IT Moderna "ail" + liquid-gradient "+". */
export function PlusBadge({ size = 'sm', variant = 'dark', className = '' }: PlusBadgeProps) {
  const v = VARIANT[variant] ?? VARIANT.dark;
  return (
    <span
      role="img"
      aria-label="ail+ member"
      className={`inline-flex items-center justify-center rounded-full font-logo leading-none select-none whitespace-nowrap ${v.pill} ${SIZE[size] ?? SIZE.sm} ${className}`}
    >
      <span className={v.ail}>ail</span>
      <span className="text-brand-gradient font-sans font-extrabold pl-[0.05em] pr-[0.05em]">+</span>
    </span>
  );
}

export { PlusBadge as default };
