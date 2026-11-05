'use client';

import { useState } from 'react';
import Image from 'next/image';
import { isEdgeTransformUrl } from '@/lib/images/supabaseImage';

/** Grid cards render at roughly half the 430px app shell: ~640px WebP on a 3x phone. */
export const CARD_PHOTO_SIZES = '(max-width: 480px) 50vw, 240px';
/** Profile detail hero: full shell width, ~1440px WebP on a 3x phone. */
export const DETAIL_PHOTO_SIZES = '(max-width: 480px) 100vw, 430px';

// Must stay in sync with images.remotePatterns in next.config.ts.
function isOptimizable(src: string): boolean {
  if (src.startsWith('/')) return true;
  try {
    const host = new URL(src).hostname;
    return host.endsWith('.supabase.co') || host === 'images.unsplash.com';
  } catch {
    return false;
  }
}

/**
 * Lazy, responsive card photo that fills its (positioned) parent. Uses next/image (AVIF/WebP,
 * resized per `sizes`) for known hosts and falls back to a plain lazy <img> for anything else,
 * so an unexpected avatar host can never break the grid.
 *
 * `placeholder` (tiny blurred data URL saved at upload) is painted underneath and the real photo
 * cross-fades in over it, so slow 3G/LTE never shows an empty box.
 */
export function CardPhoto({
  src,
  alt,
  className = '',
  sizes = CARD_PHOTO_SIZES,
  priority = false,
  placeholder = null,
  onError,
}: {
  src: string;
  alt: string;
  className?: string;
  sizes?: string;
  /** First visible row: load eagerly with high fetch priority (LCP). */
  priority?: boolean;
  /** Tiny blurred preview (data URL) shown until the photo has loaded. */
  placeholder?: string | null;
  /** Called when the image fails to load (lets the caller show a fallback). */
  onError?: () => void;
}) {
  const [loadedSrc, setLoadedSrc] = useState<string | null>(null);
  const loaded = loadedSrc === src;
  const fade = placeholder ? ` ail-photo-fade ${loaded ? 'opacity-100' : 'opacity-0'}` : '';
  const preview = placeholder ? (
    // Upscaled 16px preview: the browser's smoothing blurs it, no CSS filter (cheap on budget GPUs).
    // eslint-disable-next-line @next/next/no-img-element
    <img src={placeholder} alt="" aria-hidden className="absolute inset-0 w-full h-full object-cover" />
  ) : null;
  if (isOptimizable(src)) {
    return (
      <>
      {preview}
      <Image
        src={src}
        alt={alt}
        fill
        sizes={sizes}
        {...(priority ? { priority: true } : { loading: 'lazy' as const })}
        // SVGs, and Supabase edge renders (lib/images/supabaseImage.ts), which are already resized
        // WebP: re-encoding them through /_next/image would only add latency.
        unoptimized={src.endsWith('.svg') || isEdgeTransformUrl(src)}
        className={className + fade}
        onLoad={() => setLoadedSrc(src)}
        onError={onError}
      />
      </>
    );
  }
  return (
    <>
    {preview}
    {/* eslint-disable-next-line @next/next/no-img-element */}
    <img
      src={src}
      alt={alt}
      loading="lazy"
      decoding="async"
      sizes={sizes}
      onLoad={() => setLoadedSrc(src)}
      onError={onError}
      className={`absolute inset-0 w-full h-full ${className}${fade}`}
    />
    </>
  );
}
