'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { ChevronLeft, ChevronRight } from 'lucide-react';
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
 * Taps: on cards a tap anywhere on the photo goes to `href` / the parent (open profile), on
 * touch and mouse alike. Photos change by swiping, or with the arrow buttons on mouse / trackpad
 * (pointer: fine). `tapNavigation="always"` (profile hero, where there is nothing to open): tap
 * the left 30% for the previous photo, the rest for the next. A drag never counts as a tap.
 *
 * Dots: centred at top-2.5; the active dot is solid white and wider, with a 200 ms transition
 * (none under prefers-reduced-motion).
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
  tapNavigation = 'arrows',
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
  tapNavigation?: 'arrows' | 'always';
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
    if (!multiple || tapNavigation === 'arrows') return; // card tap: let it open the profile
    e.preventDefault();
    e.stopPropagation();
    const rect = e.currentTarget.getBoundingClientRect();
    const goPrev = e.clientX - rect.left < rect.width * 0.3;
    const next = goPrev ? Math.max(0, current - 1) : current + 1 >= count ? 0 : current + 1;
    scrollToIndex(next);
  };

  const stepPhoto = (e: React.MouseEvent, delta: number) => {
    e.preventDefault();
    e.stopPropagation(); // the arrows sit inside a card that opens the profile
    scrollToIndex((current + delta + count) % count);
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
        <div aria-hidden className="absolute top-2.5 inset-x-0 z-20 flex items-center justify-center gap-1 pointer-events-none">
          {photos.map((_, i) => (
            <span
              key={i}
              className={`h-1.5 rounded-full shadow-[0_0_2px_rgba(0,0,0,0.45)] transition-all duration-200 motion-reduce:transition-none ${
                i === current ? 'w-3 bg-white' : 'w-1.5 bg-white/50'
              }`}
            />
          ))}
        </div>
      )}

      {multiple && tapNavigation === 'arrows' && (
        <>
          <button
            type="button"
            aria-label="Previous photo"
            onClick={(e) => stepPhoto(e, -1)}
            className="hidden [@media(pointer:fine)]:flex absolute left-1.5 top-[38%] -translate-y-1/2 z-20 w-7 h-7 items-center justify-center rounded-full bg-black/40 hover:bg-black/60 text-white transition-colors cursor-pointer"
          >
            <ChevronLeft className="w-4 h-4" aria-hidden />
          </button>
          <button
            type="button"
            aria-label="Next photo"
            onClick={(e) => stepPhoto(e, 1)}
            className="hidden [@media(pointer:fine)]:flex absolute right-1.5 top-[38%] -translate-y-1/2 z-20 w-7 h-7 items-center justify-center rounded-full bg-black/40 hover:bg-black/60 text-white transition-colors cursor-pointer"
          >
            <ChevronRight className="w-4 h-4" aria-hidden />
          </button>
        </>
      )}
    </div>
  );
}

export default PhotoCarousel;
