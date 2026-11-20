'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { CardPhoto, CARD_PHOTO_SIZES } from '@/components/CardPhoto';
import { CARD_IMAGE, supabaseImage, type EdgeImageOptions } from '@/lib/images/supabaseImage';
import { clampIndex, mouseSwipeDelta, movedBeyondSlop, nearestIndex, stepIndex, tapDelta } from '@/lib/carouselNav';

/** The track counts as settled once it has not scrolled for this long (ms). */
const SETTLE_MS = 120;

/**
 * Photo carousel for the member profile gallery (and any card that shows several photos).
 *
 * Feel: swiping is the browser's own CSS scroll-snap on a composited track (native momentum, no JS touch handlers);
 * taps, arrow keys and the desktop arrows glide the track with a smooth scroll; the photo that arrives fades up from
 * a slightly dimmed neighbour (300 ms, none under prefers-reduced-motion). Going from the last photo back to the first
 * jumps instead of rewinding past every slide, and the same fade covers the jump.
 *
 * Reliability (what used to make taps and swipes occasionally do nothing):
 *  - Taps build on where the carousel is HEADING (targetRef), not where it currently is. A second quick tap used to be
 *    computed from a position the first smooth scroll had not reached yet, so it landed on the same photo.
 *  - The parent is told about a new photo from the scroll handler, never from inside a state updater, and an index that
 *    comes back from the parent (our own report) is ignored, so a fast swipe can no longer be pulled back mid-gesture.
 *  - Photos are not natively draggable (a desktop mouse press on an image used to start a ghost-image drag and swallow
 *    the click), and the track opts out of double-tap-zoom delay so quick taps are not held back.
 *  - Mouse users can also drag-swipe, press the arrow keys, or use the hover arrows.
 *
 * Taps: on cards a tap anywhere on the photo goes to `href` / the parent (open profile). `tapNavigation="always"` (the
 * profile hero, where there is nothing to open): tap the left 30% for the previous photo, the rest for the next. A drag
 * never counts as a tap. The pure rules are in lib/carouselNav.ts (npm run carousel:test).
 *
 * Dots: centred at top-2.5; the active dot is solid white and wider, with a 200 ms transition.
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
  const count = photos.length;
  const multiple = count > 1;
  const trackRef = useRef<HTMLDivElement>(null);
  const [current, setCurrent] = useState(() => clampIndex(index ?? 0, count));
  /** The photo nearest the viewport: drives the dots, the fade and onIndexChange. */
  const currentRef = useRef(clampIndex(index ?? 0, count));
  /** Where the carousel is, or is heading: the base for the next tap. */
  const targetRef = useRef(clampIndex(index ?? 0, count));
  /** The last index we told the parent about, so its echo is not mistaken for a request to move. */
  const reportedRef = useRef(clampIndex(index ?? 0, count));
  /** True while a programmatic scroll is running (until the track has been still for SETTLE_MS). */
  const busyRef = useRef(false);
  const settleTimer = useRef<number | undefined>(undefined);
  const rafRef = useRef<number | null>(null);
  const firstRun = useRef(true);
  const gestureRef = useRef<{ x: number; y: number; moved: boolean; mouse: boolean } | null>(null);
  const onIndexChangeRef = useRef(onIndexChange);
  useEffect(() => {
    onIndexChangeRef.current = onIndexChange;
  });

  // Never show an index past the photos (a photo was just deleted): clamped here, no state change needed.
  const shown = clampIndex(current, count);

  const settle = useCallback(() => {
    busyRef.current = false;
    const el = trackRef.current;
    if (el) targetRef.current = nearestIndex(el.scrollLeft, el.clientWidth, count);
  }, [count]);

  const goTo = useCallback(
    (raw: number, instant = false) => {
      const el = trackRef.current;
      if (!el || count < 1) return;
      const i = clampIndex(raw, count);
      targetRef.current = i;
      const left = i * el.clientWidth;
      if (Math.abs(el.scrollLeft - left) < 1) {
        busyRef.current = false; // already there: no scroll event will follow to settle it
        return;
      }
      busyRef.current = true;
      const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      el.scrollTo({ left, behavior: instant || reduce ? 'auto' : 'smooth' });
    },
    [count]
  );

  const step = useCallback(
    (delta: number) => {
      const { index: next, wrapped } = stepIndex(targetRef.current, delta, count);
      goTo(next, wrapped);
    },
    [count, goTo]
  );

  // Follow the controlled index (thumbnail taps on the profile page, "make main" in the editor).
  useEffect(() => {
    if (index == null || count === 0) return;
    const i = clampIndex(index, count);
    const initial = firstRun.current;
    firstRun.current = false;
    if (!initial && (i === reportedRef.current || i === targetRef.current)) return;
    goTo(i, initial);
  }, [index, count, goTo]);

  // Photos were removed while the carousel sat past the new end: bring it back in range.
  useEffect(() => {
    if (count > 0 && currentRef.current > count - 1) goTo(count - 1, true);
  }, [count, goTo]);

  useEffect(
    () => () => {
      window.clearTimeout(settleTimer.current);
      if (rafRef.current != null) cancelAnimationFrame(rafRef.current);
    },
    []
  );

  const onScroll = () => {
    window.clearTimeout(settleTimer.current);
    settleTimer.current = window.setTimeout(settle, SETTLE_MS);
    if (rafRef.current != null) return;
    rafRef.current = requestAnimationFrame(() => {
      rafRef.current = null;
      const el = trackRef.current;
      if (!el || !el.clientWidth) return;
      const i = nearestIndex(el.scrollLeft, el.clientWidth, count);
      if (i !== currentRef.current) {
        currentRef.current = i;
        setCurrent(i);
        reportedRef.current = i;
        onIndexChangeRef.current?.(i);
      }
      if (!busyRef.current) targetRef.current = i; // a swipe: follow the finger; a glide keeps its target
    });
  };

  const onClickCapture = (e: React.MouseEvent<HTMLDivElement>) => {
    const gesture = gestureRef.current;
    gestureRef.current = null;
    if (gesture?.moved) {
      // A drag / swipe, not a tap: never open the profile or change photos.
      e.preventDefault();
      e.stopPropagation();
      return;
    }
    if (!multiple || tapNavigation === 'arrows') return; // card tap: let it open the profile
    e.preventDefault();
    e.stopPropagation();
    const rect = e.currentTarget.getBoundingClientRect();
    step(tapDelta(e.clientX - rect.left, rect.width));
  };

  const arrow = (e: React.MouseEvent, delta: number) => {
    e.preventDefault();
    e.stopPropagation(); // the arrows sit inside a card that may open the profile
    step(delta);
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
        className={`relative h-full w-full shrink-0 snap-center snap-always [transform:translate3d(0,0,0)] will-change-transform transition-opacity duration-300 ease-out motion-reduce:transition-none ${
          !multiple || i === shown ? 'opacity-100' : 'opacity-60'
        }`}
        aria-roledescription={multiple ? 'slide' : undefined}
        aria-label={multiple ? `Photo ${i + 1} of ${count}` : undefined}
      >
        {href ? (
          <Link href={href} draggable={false} className="absolute inset-0" tabIndex={i === shown ? 0 : -1}>
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
          gestureRef.current = { x: e.clientX, y: e.clientY, moved: false, mouse: e.pointerType === 'mouse' };
        }}
        onPointerMove={(e) => {
          const g = gestureRef.current;
          if (g && !g.moved && movedBeyondSlop(e.clientX - g.x, e.clientY - g.y)) g.moved = true;
        }}
        onPointerUp={(e) => {
          const g = gestureRef.current;
          if (!g?.mouse || !multiple) return;
          const delta = mouseSwipeDelta(e.clientX - g.x, e.clientY - g.y);
          if (delta) step(delta);
        }}
        onPointerCancel={() => {
          gestureRef.current = null;
        }}
        onClickCapture={onClickCapture}
        onDragStart={(e) => e.preventDefault()}
        onKeyDown={(e) => {
          if (!multiple) return;
          if (e.key === 'ArrowRight') {
            e.preventDefault();
            step(1);
          } else if (e.key === 'ArrowLeft') {
            e.preventDefault();
            step(-1);
          }
        }}
        tabIndex={multiple ? 0 : undefined}
        className={`flex h-full w-full overflow-y-hidden no-scrollbar [scrollbar-width:none] [&::-webkit-scrollbar]:hidden ${
          multiple ? 'overflow-x-auto snap-x snap-mandatory overscroll-x-contain' : 'overflow-x-hidden'
        } [transform:translate3d(0,0,0)] will-change-transform select-none [touch-action:manipulation] [&_img]:select-none [&_img]:[-webkit-user-drag:none] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#726E97]/50`}
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
                i === shown ? 'w-3 bg-white' : 'w-1.5 bg-white/50'
              }`}
            />
          ))}
        </div>
      )}

      {multiple && (
        <>
          <button
            type="button"
            aria-label="Previous photo"
            onClick={(e) => arrow(e, -1)}
            className="hidden [@media(pointer:fine)]:flex absolute left-1.5 top-[38%] -translate-y-1/2 z-20 w-8 h-8 items-center justify-center rounded-full bg-black/40 hover:bg-black/60 text-white transition-colors cursor-pointer"
          >
            <ChevronLeft className="w-4 h-4" aria-hidden />
          </button>
          <button
            type="button"
            aria-label="Next photo"
            onClick={(e) => arrow(e, 1)}
            className="hidden [@media(pointer:fine)]:flex absolute right-1.5 top-[38%] -translate-y-1/2 z-20 w-8 h-8 items-center justify-center rounded-full bg-black/40 hover:bg-black/60 text-white transition-colors cursor-pointer"
          >
            <ChevronRight className="w-4 h-4" aria-hidden />
          </button>
        </>
      )}
    </div>
  );
}

export default PhotoCarousel;
