'use client';

import React from 'react';

interface PlusBadgeProps {
  size?: 'xs' | 'sm' | 'md';
  className?: string;
}

export function PlusBadge({
  size = 'sm',
  className = '',
}: PlusBadgeProps) {
  const sizeClasses = {
    xs: 'text-[9px] px-1.5 py-0.5',
    sm: 'text-[10px] px-2 py-0.5',
    md: 'text-[11px] px-2.5 py-0.5',
  }[size] || 'text-[10px] px-2 py-0.5';

  return (
    <span
      className={`inline-flex items-center justify-center font-bold tracking-wider uppercase select-none rounded-full bg-[#6555B8] text-white ${sizeClasses} ${className}`}
      style={{ letterSpacing: '0.04em' }}
    >
      <span className="leading-none">Plus</span>
    </span>
  );
}
export { PlusBadge as default };
