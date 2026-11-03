'use client';

import React from 'react';
import Link from 'next/link';

interface BrandLogoProps {
  className?: string;
  href?: string;
  /** sm 24px, md 36px, lg 48px */
  size?: 'sm' | 'md' | 'lg';
  /** Overrides `size` with any text-* class (header / footer / drawer sizes). */
  textSize?: string;
  /** White "asiansin" for dark surfaces. */
  onDark?: boolean;
}

const SIZE_CLASS: Record<'sm' | 'md' | 'lg', string> = {
  sm: 'text-[24px]',
  md: 'text-[36px]',
  lg: 'text-[48px]',
};

export function BrandLogo({ className = '', href = '/discover', size = 'md', textSize = '', onDark = false }: BrandLogoProps) {
  // "asiansin.love" in Playwrite IT Moderna: deep velvet "asiansin" + liquid gradient ".love".
  const wordmark = (
    <span
      className={[
        textSize || SIZE_CLASS[size],
        // Script glyphs overhang their box: generous line-height so nothing is clipped.
        'font-logo leading-[1.3] lowercase select-none inline-flex items-baseline whitespace-nowrap',
        className,
      ].filter(Boolean).join(' ')}
      aria-label="asiansin.love"
    >
      <span className={onDark ? 'text-white' : 'text-[#2D264B]'}>asiansin</span>
      {/* background-clip:text only paints inside the box: pad it so the flourishes keep their gradient. */}
      <span className="text-brand-gradient pr-[0.12em] -mr-[0.12em] pb-[0.08em]">.love</span>
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
