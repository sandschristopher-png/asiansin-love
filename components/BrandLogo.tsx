'use client';

import React from 'react';
import Link from 'next/link';

interface BrandLogoProps {
  className?: string;
  href?: string;
  size?: 'sm' | 'md' | 'lg';
  textSize?: string;
}

const SIZE_CLASS: Record<'sm' | 'md' | 'lg', string> = {
  sm: 'text-[15px]',
  md: 'text-[17px]',
  lg: 'text-[20px]',
};

export function BrandLogo({ className = '', href = '/discover', size = 'md', textSize = '' }: BrandLogoProps) {
  // "asiansin.love" in Comfortaa: slate "asiansin" + gradient ".love".
  const wordmark = (
    <span
      className={[
        textSize || SIZE_CLASS[size],
        'font-comfortaa leading-none lowercase select-none inline-flex items-center',
        className,
      ].filter(Boolean).join(' ')}
      aria-label="asiansin.love"
    >
      <span className="text-[#2D264B] font-bold tracking-tight">asiansin</span>
      <span className="bg-gradient-to-r from-[#6555B8] to-[#9D8CFC] bg-clip-text text-transparent font-extrabold tracking-tight">
        .love
      </span>
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