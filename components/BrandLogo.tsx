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
  /** White wordmark for dark surfaces. */
  onDark?: boolean;
}

const SIZE_CLASS: Record<BrandLogoSize, string> = {
  header: 'text-lg sm:text-xl font-semibold tracking-tight',
  sm: 'text-lg font-semibold tracking-tight',
  md: 'text-2xl font-semibold tracking-tight',
  lg: 'text-3xl font-semibold tracking-tight',
};

/**
 * Typographic logo only, two-tone: "Meet in" in ink #413B5E, "Asia" in brand purple #8574B7,
 * Plus Jakarta Sans (font-brand) 600. White on dark surfaces. No icon, box, gradient or shadow.
 */
export function BrandLogo({ className = '', href = '/discover', size = 'md', textSize = '', onDark = false }: BrandLogoProps) {
  const wordmark = (
    <span
      className={[
        'font-brand leading-none select-none inline-flex items-baseline whitespace-nowrap',
        onDark ? 'text-white' : 'text-[#413B5E]',
        textSize ? `${textSize} font-semibold tracking-tight` : SIZE_CLASS[size],
        className,
      ].filter(Boolean).join(' ')}
      aria-label="Meet in Asia"
    >
      <span>Meet in&nbsp;</span>
      <span className={onDark ? undefined : 'text-[#8574B7]'}>Asia</span>
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
        aria-label="Meet in Asia home"
        className="inline-flex items-center focus:outline-none"
      >
        {wordmark}
      </Link>
    );
  }

  return wordmark;
}

export default BrandLogo;
