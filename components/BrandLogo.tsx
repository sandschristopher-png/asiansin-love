import React from 'react';
import Link from 'next/link';

interface BrandLogoProps {
  href?: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function BrandLogo({ href, size = 'md', className = '' }: BrandLogoProps) {
  const sizeClasses = {
    sm: 'text-[20px] sm:text-[24px] md:text-[26px]',
    md: 'text-[22px] sm:text-[30px] md:text-[36px]',
    lg: 'text-[28px] sm:text-[36px] md:text-[44px]',
  }[size];

  const content = (
    <span
      className={`inline-flex items-baseline select-none lowercase whitespace-nowrap leading-none tracking-[-0.035em] text-[#1C1924] ${sizeClasses} ${className}`}
      style={{ fontFamily: "'Outfit', sans-serif", fontWeight: 500 }}
    >
      asians in love
    </span>
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