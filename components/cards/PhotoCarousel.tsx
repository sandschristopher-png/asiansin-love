'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { CardPhoto, CARD_PHOTO_SIZES } from '@/components/CardPhoto';
import { CARD_IMAGE, supabaseImage, type EdgeImageOptions } from '@/lib/images/supabaseImage';

/**
 * Photo carousel for Discover cards, Sparks cards and the member profile hero.
 *
 * Performance (budget Android): swiping is the browser's own CSS scroll-snap on a composited
 * track (no JS touch handlers, no layout animation); slides sit on their own GPU layers
 * (translate3d + will-change: transform). Only the first slide of a `priority` carousel loads
 * eagerly; the rest are lazy. Photos come from the Supabase edge renderer (resized WebP).
 *
 * Taps: on a mouse / trackpad (pointer: fine) the left 30% shows the previous photo and the
 * rest shows the next one. On touch, taps fall through to `href` / the parent (open profile)
 * unless `tapNavigation="always"` (profile hero). A drag never counts as a tap.
 *
 * Story bars: hairline segments at top-2.5 inset-x-3, completed / active / upcoming shown by
 * opacity with a 200 ms fade (no fade under prefers-reduced-motion).
 */
export function PhotoCarousel({
  photos,
  alt,
  href,
  priority = false,
  placeholders,
  sizes = CARD_PHOTO_SIZES,
  edge = CARD_IMAGE,
  imgClassName = 'object-cover',
  tapNavigation = 'desktop',
  index,
  onIndexChange,
  className = '',
}: {
  photos: string[];
  alt: string;
  /** Wrap slides in a link (Discover cards open the profile on tap). */
  href?: string;
  /** Eager-load the first slide (top-of-feed cards, profile hero). */
  priority?: boolean;
  placeholders?: Record<string, string>;
  sizes?: string;
  edge?: EdgeImageOptions;
  imgClassName?: string;
  tapNavigation?: 'desktop' | 'always';
  /** Controlled index (e.g. thumbnail grid below the profile hero). */
  index?: number;
  onIndexChange?: (i: number) => void;
  className?: string;
}) {
  const trackRef = useRef<HTMLDivElement>(null);
  const [current, setCurrent] = useState(0);
  const dragRef = useRef<{ x: number; y: number; moved: boolean } | null>(null);
  const rafRef = useRef<number | null>(null);
  const count = photos.length;
  const multiple = count > 1;

  const scrollToIndex = useCallback((i: number) => {
    const el = trackRef.current;
    if (!el) return;
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    el.scrollTo({ left: i * el.clientWidth, behavior: reduce ? 'auto' : 'smooth' });
  }, []);

  // Follow the controlled index (thumbnail taps on the profile page).
  useEffect(() => {
    if (index == null || index === current) return;
    scrollToIndex(index);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- only react to the requested index
  }, [index, scrollToIndex]);

  useEffect(
    () => () => {
      if (rafRef.current != null) cancelAnimationFrame(rafRef.current);
    },
    []
  );

  const onScroll = () => {
    if (rafRef.current != null) return;
    rafRef.current = requestAnimationFrame(() => {
      rafRef.current = null;
      const el = trackRef.current;
      if (!el || !el.clientWidth) return;
      const i = Math.max(0, Math.min(count - 1, Math.round(el.scrollLeft / el.clientWidth)));
      setCurrent((prev) => {
        if (prev !== i) onIndexChange?.(i);
        return i;
      });
    });
  };

  const onClickCapture = (e: React.MouseEvent<HTMLDivElement>) => {
    const drag = dragRef.current;
    dragRef.current = null;
    if (drag?.moved) {
      // A drag / swipe, not a tap: never open the profile or change photos.
      e.preventDefault();
      e.stopPropagation();
      return;
    }
    if (!multiple) return;
    const fine = window.matchMedia('(pointer: fine)').matches;
    if (tapNavigation === 'desktop' && !fine) return; // touch tap: let it open the profile
    e.preventDefault();
    e.stopPropagation();
    const rect = e.currentTarget.getBoundingClientRect();
    const goPrev = e.clientX - rect.left < rect.width * 0.3;
    const next = goPrev ? Math.max(0, current - 1) : current + 1 >= count ? 0 : current + 1;
    scrollToIndex(next);
  };

  const slide = (url: string, i: number) => {
    const photo = (
      <CardPhoto
        src={supabaseImage(url, edge)}
        alt={i === 0 ? alt : ''}
        sizes={sizes}
        priority={priority && i === 0}
        placeholder={placeholders?.[url] ?? null}
        className={imgClassName}
      />
    );
    return (
      <div
        key={url + i}
        className="relative h-full w-full shrink-0 snap-center snap-always [transform:translate3d(0,0,0)] will-change-transform"
        aria-roledescription={multiple ? 'slide' : undefined}
        aria-label={multiple ? `Photo ${i + 1} of ${count}` : undefined}
      >
        {href ? (
          <Link href={href} draggable={false} className="absolute inset-0" tabIndex={i === current ? 0 : -1}>
            {photo}
          </Link>
        ) : (
          photo
        )}
      </div>
    );
  };

  return (
    <div className={`relative h-full w-full overflow-hidden ${className}`}>
      <div
        ref={trackRef}
        onScroll={multiple ? onScroll : undefined}
        onPointerDown={(e) => {
          dragRef.current = { x: e.clientX, y: e.clientY, moved: false };
        }}
        onPointerMove={(e) => {
          const d = dragRef.current;
          if (d && !d.moved && (Math.abs(e.clientX - d.x) > 8 || Math.abs(e.clientY - d.y) > 8)) d.moved = true;
        }}
        onClickCapture={onClickCapture}
        className={`flex h-full w-full overflow-y-hidden no-scrollbar [scrollbar-width:none] [&::-webkit-scrollbar]:hidden ${
          multiple ? 'overflow-x-auto snap-x snap-mandatory overscroll-x-contain' : 'overflow-x-hidden'
        } [transform:translate3d(0,0,0)] will-change-transform select-none`}
        role={multiple ? 'region' : undefined}
        aria-roledescription={multiple ? 'carousel' : undefined}
        aria-label={multiple ? `${alt} photos` : undefined}
      >
        {photos.map(slide)}
      </div>

      {multiple && (
        <div aria-hidden className="absolute top-2.5 inset-x-3 z-20 flex gap-1 pointer-events-none">
          {photos.map((_, i) => (
            <span
              key={i}
              className={`h-[2px] flex-1 rounded-full bg-white shadow-[0_0_2px_rgba(0,0,0,0.35)] transition-opacity duration-200 motion-reduce:transition-none ${
                i === current ? 'opacity-100' : i < current ? 'opacity-70' : 'opacity-35'
              }`}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export default PhotoCarousel;
