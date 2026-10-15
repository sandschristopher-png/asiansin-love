import React from 'react';
import Link from 'next/link';

interface BrandLogoProps {
  href?: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function BrandLogo({ href, size = 'md', className = '' }: BrandLogoProps) {
  const sizeClasses = {
    sm: 'text-[19px] sm:text-[20px]',
    md: 'text-[22px] sm:text-[24px]',
    lg: 'text-[26px] sm:text-[30px]',
  }[size];

  const content = (
    <span
      className={`inline-flex items-baseline select-none lowercase whitespace-nowrap leading-none tracking-[-0.035em] text-[#4C3B75] ${sizeClasses} ${className}`}
      style={{ fontFamily: 'var(--font-logo)', fontWeight: 600 }}
    ><span className="text-[20px] leading-none font-black tracking-[-0.035em] lowercase select-none inline-flex items-baseline" style={{ fontFamily: 'var(--font-brand)', fontWeight: 900 }}><span className="text-[#1C1924]">asians</span><span className="text-[#6555B8]">inlove</span></span></span>
  );

  if (href) {
    return (
      <Link href={href} className="inline-flex items-center shrink-0 active:opacity-75 transition-opacity py-1">
        {content}
      </Link>
    );
  }

  return content;
}
