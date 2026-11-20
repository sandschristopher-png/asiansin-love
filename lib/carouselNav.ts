/**
 * The rules behind the photo carousel's taps, swipes and arrow keys (components/cards/PhotoCarousel.tsx), kept pure
 * so they can be tested: which photo comes next, what counts as a drag rather than a tap, and which side of the photo
 * was tapped.
 */

/** A touch or click that moves further than this (px) is a drag, not a tap. */
export const DRAG_SLOP_PX = 8;
/** A mouse drag must travel this far sideways (px) to count as a swipe (touch swipes are the browser's own scroll). */
export const MOUSE_SWIPE_PX = 40;
/** The left share of the photo that goes back; the rest goes forward. */
export const PREV_ZONE = 0.3;

/** A valid photo index: rounded, never below 0 or past the last photo (0 when there are none). */
export function clampIndex(i: number, count: number): number {
  if (!Number.isFinite(i) || count <= 0) return 0;
  return Math.max(0, Math.min(count - 1, Math.round(i)));
}

/**
 * The photo after stepping `delta` from `base`, wrapping at both ends. `base` must be where the carousel is HEADING
 * (the last requested photo), not where it currently is: while a smooth scroll is still running, a second quick tap
 * must build on the first, or it lands on the same photo and looks like a missed tap.
 */
export function stepIndex(base: number, delta: number, count: number): { index: number; wrapped: boolean } {
  if (count <= 1) return { index: 0, wrapped: false };
  const raw = clampIndex(base, count) + delta;
  if (raw < 0) return { index: count - 1, wrapped: true };
  if (raw >= count) return { index: 0, wrapped: true };
  return { index: raw, wrapped: false };
}

/** Tap on the left share of the photo goes back (-1), anywhere else goes forward (+1). */
export function tapDelta(offsetX: number, width: number): 1 | -1 {
  return width > 0 && offsetX < width * PREV_ZONE ? -1 : 1;
}

/** Has the pointer moved far enough since it went down for this to be a drag? */
export function movedBeyondSlop(dx: number, dy: number): boolean {
  return Math.abs(dx) > DRAG_SLOP_PX || Math.abs(dy) > DRAG_SLOP_PX;
}

/** A mouse drag ending after (dx, dy): +1 next photo, -1 previous, 0 not a horizontal swipe. */
export function mouseSwipeDelta(dx: number, dy: number): 1 | -1 | 0 {
  if (Math.abs(dx) < MOUSE_SWIPE_PX || Math.abs(dx) <= Math.abs(dy)) return 0;
  return dx < 0 ? 1 : -1;
}

/** The photo nearest the viewport for a scroll position (each slide is one track width wide). */
export function nearestIndex(scrollLeft: number, width: number, count: number): number {
  return width > 0 ? clampIndex(scrollLeft / width, count) : 0;
}
