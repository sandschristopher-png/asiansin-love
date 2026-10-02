import React from 'react';
import { Sparkles } from 'lucide-react';

interface PlusBadgeProps {
  size?: 'sm' | 'md';
  className?: string;
}

export function PlusBadge({ size = 'sm', className = '' }: PlusBadgeProps) {
  const isSmall = size === 'sm';
  return (
    <span
      className={`inline-flex items-center gap-1 font-extrabold uppercase tracking-wider rounded-full shadow-sm select-none ${
        isSmall
          ? 'px-2 py-0.5 text-[9px] sm:text-[10px] bg-gradient-to-r from-[#7A69D6] to-[#6555B8] text-white border border-white/20'
          : 'px-2.5 py-1 text-xs bg-gradient-to-r from-[#7A69D6] to-[#6555B8] text-white border border-white/20'
      } ${className}`}
    >
      <Sparkles className={isSmall ? "w-2.5 h-2.5 fill-white text-white" : "w-3 h-3 fill-white text-white"} />
      <span>Plus</span>
    </span>
  );
}
