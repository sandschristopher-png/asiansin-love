import Image from 'next/image';

/** Grid cards render at roughly half the 480px app shell. */
export const CARD_PHOTO_SIZES = '(max-width: 480px) 50vw, 240px';

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
 */
export function CardPhoto({
  src,
  alt,
  className = '',
  sizes = CARD_PHOTO_SIZES,
  priority = false,
  onError,
}: {
  src: string;
  alt: string;
  className?: string;
  sizes?: string;
  /** First visible row: load eagerly with high fetch priority (LCP). */
  priority?: boolean;
  /** Called when the image fails to load (lets the caller show a fallback). */
  onError?: () => void;
}) {
  if (isOptimizable(src)) {
    return (
      <Image
        src={src}
        alt={alt}
        fill
        sizes={sizes}
        {...(priority ? { priority: true } : { loading: 'lazy' as const })}
        unoptimized={src.endsWith('.svg')}
        className={className}
        onError={onError}
      />
    );
  }
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt={alt}
      loading="lazy"
      decoding="async"
      sizes={sizes}
      onError={onError}
      className={`absolute inset-0 w-full h-full ${className}`}
    />
  );
}
