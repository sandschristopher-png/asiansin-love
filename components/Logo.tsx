'use client';

import React from 'react';
import Link from 'next/link';

interface LogoProps {
  textSize?: string;
  className?: string;
  href?: string;
}

export function Logo({ className = '', href = '/discover', textSize = '' }: LogoProps) {
  const wordmark = (
    <span
      className={[(textSize || 'text-[20px] leading-none font-black tracking-[-0.035em] lowercase select-none inline-flex items-baseline'), 'leading-none font-black tracking-[-0.035em] lowercase select-none inline-flex items-baseline ', className].filter(Boolean).join(' ')}
      style={{ fontFamily: 'var(--font-brand)', fontWeight: 900 }}
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

export default Logo;
