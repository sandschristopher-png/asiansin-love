import React from 'react';
import Link from 'next/link';

interface BrandLogoProps {
  href?: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function BrandLogo({ href, size = 'md', className = '' }: BrandLogoProps) {
  const sizeClasses = {
    sm: 'text-[26px]',
    md: 'text-[36px]',
    lg: 'text-[44px]',
  }[size];

  const content = (
    <span
      className={`inline-flex items-baseline select-none lowercase leading-none tracking-[-0.035em] text-[#1C1924] ${sizeClasses} ${className}`}
      style={{ fontFamily: "'Outfit', sans-serif", fontWeight: 500 }}
    >
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600&display=swap');
      `}</style>
      asians in love
    </span>
  );

  if (href) {
    return (
      <Link href={href} className="inline-flex items-center active:opacity-75 transition-opacity py-1">
        {content}
      </Link>
    );
  }

  return content;
}
