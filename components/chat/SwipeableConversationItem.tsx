'use client';

import React, { useRef, useSyncExternalStore } from 'react';
import { Check, Mail, Trash2 } from 'lucide-react';

const THRESHOLD = 75; // px past which a release triggers the action
const MAX_PULL = 120;
const SNAP_MS = 200;

const finePointerQuery = '(pointer: fine)';
const subscribeFine = (cb: () => void) => {
  const mq = window.matchMedia(finePointerQuery);
  mq.addEventListener('change', cb);
  return () => mq.removeEventListener('change', cb);
};

/**
 * Messages list row with swipe actions (touch) or hover buttons (mouse / trackpad).
 *   swipe right > 75 px: lavender underlay with a check, toggles Read / Unread
 *   swipe left  > 75 px: crimson underlay with a trash can, asks to delete the conversation
 *
 * Budget-Android friendly: the row moves only by transform (translate3d on its own layer,
 * will-change: transform), written straight to the element during the drag (no React re-render
 * per touchmove), and snaps back with a 200 ms transform transition (none under
 * prefers-reduced-motion). touch-action: pan-y keeps vertical list scrolling native; a gesture
 * that starts vertical is ignored. Rows use content-visibility: auto with a 76 px intrinsic
 * size, so off-screen conversations cost no layout or GPU memory.
 */
export function SwipeableConversationItem({
  children,
  unread,
  onToggleRead,
  onDelete,
  label,
}: {
  children: React.ReactNode;
  unread: boolean;
  onToggleRead: () => void;
  onDelete: () => void;
  /** Member name, for the action button labels. */
  label: string;
}) {
  const finePointer = useSyncExternalStore(
    subscribeFine,
    () => window.matchMedia(finePointerQuery).matches,
    () => false
  );
  const rowRef = useRef<HTMLDivElement>(null);
  const leftRef = useRef<HTMLDivElement>(null);
  const rightRef = useRef<HTMLDivElement>(null);
  const gesture = useRef<{ x: number; y: number; dx: number; axis: 'x' | 'y' | null } | null>(null);
  const suppressClick = useRef(false);

  const reducedMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const paint = (dx: number, animate: boolean) => {
    const row = rowRef.current;
    if (!row) return;
    row.style.transition = animate && !reducedMotion() ? `transform ${SNAP_MS}ms cubic-bezier(0.16, 1, 0.3, 1)` : 'none';
    row.style.transform = `translate3d(${dx}px, 0, 0)`;
    if (leftRef.current) leftRef.current.style.opacity = dx > 0 ? String(Math.min(1, dx / THRESHOLD)) : '0';
    if (rightRef.current) rightRef.current.style.opacity = dx < 0 ? String(Math.min(1, -dx / THRESHOLD)) : '0';
  };

  const onTouchStart = (e: React.TouchEvent) => {
    const t = e.touches[0];
    gesture.current = { x: t.clientX, y: t.clientY, dx: 0, axis: null };
  };

  const onTouchMove = (e: React.TouchEvent) => {
    const g = gesture.current;
    if (!g) return;
    const t = e.touches[0];
    const dx = t.clientX - g.x;
    const dy = t.clientY - g.y;
    if (!g.axis) {
      if (Math.abs(dx) < 8 && Math.abs(dy) < 8) return;
      g.axis = Math.abs(dx) > Math.abs(dy) ? 'x' : 'y';
    }
    if (g.axis !== 'x') return;
    g.dx = Math.max(-MAX_PULL, Math.min(MAX_PULL, dx));
    paint(g.dx, false);
  };

  const onTouchEnd = () => {
    const g = gesture.current;
    gesture.current = null;
    if (!g || g.axis !== 'x') return;
    suppressClick.current = Math.abs(g.dx) > 8; // a swipe is never a tap on the row link
    if (g.dx > THRESHOLD) onToggleRead();
    else if (g.dx < -THRESHOLD) onDelete();
    paint(0, true);
  };

  if (finePointer) {
    // Desktop: no swipe listeners, hover action buttons instead.
    return (
      <div className="group relative [content-visibility:auto] [contain-intrinsic-size:auto_76px]">
        {children}
        <div className="absolute right-11 top-1/2 -translate-y-1/2 flex items-center gap-1 opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 transition-opacity">
          <button
            type="button"
            onClick={onToggleRead}
            aria-label={unread ? `Mark conversation with ${label} as read` : `Mark conversation with ${label} as unread`}
            title={unread ? 'Mark as read' : 'Mark as unread'}
            className="w-8 h-8 rounded-full border border-[#D5C6EC] bg-white text-[#72519A] hover:bg-[#E8DFF5]/60 flex items-center justify-center shadow-brand-sm transition-colors"
          >
            {unread ? <Check className="w-4 h-4" aria-hidden /> : <Mail className="w-4 h-4" aria-hidden />}
          </button>
          <button
            type="button"
            onClick={onDelete}
            aria-label={`Delete conversation with ${label}`}
            title="Delete conversation"
            className="w-8 h-8 rounded-full border border-red-200 bg-white text-[#DC2626] hover:bg-red-50 flex items-center justify-center shadow-brand-sm transition-colors"
          >
            <Trash2 className="w-4 h-4" aria-hidden />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="relative overflow-hidden rounded-2xl [content-visibility:auto] [contain-intrinsic-size:auto_76px]">
      {/* Underlays, revealed by the row sliding over them (opacity follows the pull). */}
      <div
        ref={leftRef}
        aria-hidden
        className="absolute inset-0 flex items-center gap-2 pl-5 bg-[#E8DFF5] text-[#72519A] text-xs font-semibold opacity-0"
      >
        <Check className="w-5 h-5" />
        {unread ? 'Read' : 'Unread'}
      </div>
      <div
        ref={rightRef}
        aria-hidden
        className="absolute inset-0 flex items-center justify-end gap-2 pr-5 bg-[#DC2626] text-white text-xs font-semibold opacity-0"
      >
        Delete
        <Trash2 className="w-5 h-5" />
      </div>
      <div
        ref={rowRef}
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
        onTouchCancel={onTouchEnd}
        onClickCapture={(e) => {
          if (suppressClick.current) {
            suppressClick.current = false;
            e.preventDefault();
            e.stopPropagation();
          }
        }}
        className="relative touch-pan-y [transform:translate3d(0,0,0)] will-change-transform"
      >
        {children}
      </div>
    </div>
  );
}

export default SwipeableConversationItem;
