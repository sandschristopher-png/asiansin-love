'use client';

import React from 'react';
import Link from 'next/link';

type BrandLogoSize = 'header' | 'sm' | 'md' | 'lg';

interface BrandLogoProps {
  className?: string;
  href?: string;
  size?: BrandLogoSize;
  /** Overrides `size` with any text-* class. */
  textSize?: string;
  /** White "asiansin" for dark surfaces. */
  onDark?: boolean;
}

const SIZE_CLASS: Record<BrandLogoSize, string> = {
  header: 'text-[22px] font-bold tracking-[-0.03em]',
  sm: 'text-lg font-bold tracking-tight',
  md: 'text-2xl font-bold tracking-tight',
  lg: 'text-3xl font-extrabold tracking-tight',
};

/** Typographic wordmark: "asiansin" + gradient "love" in Plus Jakarta Sans (font-brand). */
export function BrandLogo({ className = '', href = '/discover', size = 'md', textSize = '', onDark = false }: BrandLogoProps) {
  const wordmark = (
    <span
      className={[
        'font-brand leading-none lowercase select-none inline-flex items-baseline whitespace-nowrap',
        textSize ? `${textSize} font-bold tracking-tight` : SIZE_CLASS[size],
        className,
      ].filter(Boolean).join(' ')}
      aria-label="asiansinlove"
    >
      <span className={onDark ? 'text-white' : 'text-[#2D264B]'}>asiansin</span>
      <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#8C71F5] via-[#C084FC] to-[#EC4899]">love</span>
    </span>
  );

  if (href) {
    return (
      <Link href={href} aria-label="asiansinlove home" className="inline-flex items-center focus:outline-none">
        {wordmark}
      </Link>
    );
  }

  return wordmark;
}

export default BrandLogo;
