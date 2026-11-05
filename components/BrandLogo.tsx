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

/** Typographic wordmark: clean "asiansin.love" in deep muted purple, Plus Jakarta Sans (font-brand). */
export function BrandLogo({ className = '', href = '/discover', size = 'md', textSize = '', onDark = false }: BrandLogoProps) {
  const wordmark = (
    <span
      className={[
        'font-brand leading-none lowercase select-none inline-flex items-baseline whitespace-nowrap',
        textSize ? `${textSize} font-bold tracking-tight` : SIZE_CLASS[size],
        className,
      ].filter(Boolean).join(' ')}
      aria-label="asiansin.love"
    >
      <span className={onDark ? 'text-white' : 'text-[#51376D]'}>asiansin.love</span>
    </span>
  );

  if (href) {
    return (
      <Link href={href} aria-label="asiansin.love home" className="inline-flex items-center focus:outline-none">
        {wordmark}
      </Link>
    );
  }

  return wordmark;
}

export default BrandLogo;
