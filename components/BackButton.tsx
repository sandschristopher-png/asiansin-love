'use client';

import { ArrowLeft } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface BackButtonProps {
  /** Extra classes to merge (positioning, sizing of the wrapper) */
  className?: string;
  /** Where to go when there is no history to go back to */
  fallback?: string;
  /** Visual variant */
  variant?: 'plain' | 'circled' | 'dark';
}

const BASE =
  'inline-flex items-center justify-center h-9 w-9 shrink-0 active:scale-95 transition-transform';
const VARIANTS: Record<'plain' | 'circled' | 'dark', string> = {
  plain: 'text-[#413B5E]',
  circled:
    'rounded-full border border-[#D0CDE1] bg-white/90 backdrop-blur text-[#413B5E] shadow-xs',
  dark:
    'rounded-full bg-black/45 text-white hover:bg-black/60 shadow-xs',
};

export function BackButton({
  className = '',
  fallback = '/discover',
  variant = 'circled',
}: BackButtonProps) {
  const router = useRouter();

  const handleClick = () => {
    if (typeof window !== 'undefined' && window.history.length > 1) {
      router.back();
    } else {
      router.push(fallback);
    }
  };

  return (
    <button
      type="button"
      aria-label="Back"
      onClick={handleClick}
      className={`${BASE} ${VARIANTS[variant]} ${className}`}
    >
      <ArrowLeft className="h-5 w-5" aria-hidden />
    </button>
  );
}

export default BackButton;