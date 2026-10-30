'use client';

import React from 'react';
import Link from 'next/link';

interface BrandLogoProps {
  className?: string;
  href?: string;
  size?: 'sm' | 'md' | 'lg';
}

const SIZE_CLASS: Record<'sm' | 'md' | 'lg', string> = {
  sm: 'text-[15px]',
  md: 'text-[17px]',
  lg: 'text-[20px]',
};

export function BrandLogo({ className = '', href = '/discover', size = 'md', textSize = '' }: BrandLogoProps) {
  const wordmark = (
    <span
      className={[
        textSize || SIZE_CLASS[size],
        'leading-none font-bold lowercase select-none inline-flex items-baseline',
        className,
      ].filter(Boolean).join(' ')}
      style={{ fontFamily: 'var(--font-logo), sans-serif', fontWeight: 700, letterSpacing: '-0.02em' }}
    >
      <span className="text-[#1C1924]">asians</span>
      <span className="text-[#6555B8]">inlove</span>
    </span>
  );

  if (href) {
    return (
      <Link href={href} className="inline-flex items-center focus:outline-none">
        {wordmark}
      </Link>
    );
  }

  return wordmark;
}

export default BrandLogo;