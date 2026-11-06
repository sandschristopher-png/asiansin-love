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

/** Typographic wordmark: bold aubergine "asiansin." + 3-stop liquid purple "love" (Plus Jakarta Sans). */
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
      <span className={`font-bold ${onDark ? 'text-white' : 'text-[#413B5E]'}`}>asiansin.</span>
      <span className="bg-gradient-to-r from-[#665D96] via-[#9A93BC] to-[#B8B3D1] bg-clip-text text-transparent font-extrabold">love</span>
    </span>
  );

  if (href) {
    return (
      // Never prefetch "/": the middleware redirects it (returning visitors to /login, members to
      // /discover), and a redirected prefetch of the page you are on makes the router re-prefetch
      // in a loop (150+ requests/s on the hero for every first-time visitor).
      <Link
        href={href}
        prefetch={href === '/' ? false : undefined}
        aria-label="asiansin.love home"
        className="inline-flex items-center focus:outline-none"
      >
        {wordmark}
      </Link>
    );
  }

  return wordmark;
}

export default BrandLogo;
