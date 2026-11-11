'use client';

import React, { useId } from 'react';
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

/** Spark Heart squircle (same artwork as app/icon.svg), sized to the wordmark's font size. */
function BrandMark() {
  const gradientId = `brand-mark-${useId().replace(/:/g, '')}`; // unique per instance (header + footer)
  return (
    <svg viewBox="0 0 512 512" aria-hidden="true" className="h-[1.15em] w-[1.15em] shrink-0">
      <defs>
        <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#8E7DBF" />
          <stop offset="50%" stopColor="#8574B7" />
          <stop offset="100%" stopColor="#534377" />
        </linearGradient>
      </defs>
      <rect width="512" height="512" rx="128" fill={`url(#${gradientId})`} />
      <path
        d="M256 404C252 404 248 402.6 245 400.2C196 361 104 289 104 206C104 152 145 112 196 112C222 112 243 124 256 143C269 124 290 112 316 112C367 112 408 152 408 206C408 289 316 361 267 400.2C264 402.6 260 404 256 404Z"
        fill="#FFFFFF"
      />
    </svg>
  );
}

/** Spark Heart mark + wordmark: "asiansin" in solid #413B5E, ".love" in the #8574B7 to #534377 gradient. */
export function BrandLogo({ className = '', href = '/discover', size = 'md', textSize = '', onDark = false }: BrandLogoProps) {
  const wordmark = (
    <span
      className={[
        'font-brand leading-none lowercase select-none inline-flex items-center gap-[0.3em] whitespace-nowrap',
        textSize ? `${textSize} font-bold tracking-tight` : SIZE_CLASS[size],
        className,
      ].filter(Boolean).join(' ')}
      aria-label="asiansin.love"
    >
      <BrandMark />
      <span className="inline-flex items-baseline">
        <span className={`font-bold ${onDark ? 'text-white' : 'text-[#413B5E]'}`}>asiansin</span>
        <span className="bg-gradient-to-r from-[#8574B7] to-[#534377] bg-clip-text text-transparent font-extrabold">.love</span>
      </span>
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
