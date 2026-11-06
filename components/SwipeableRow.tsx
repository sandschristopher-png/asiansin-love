'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { MoreHorizontal, type LucideIcon } from 'lucide-react';

export interface SwipeAction {
  key: string;
  label: string;
  icon: LucideIcon;
  /** "danger": crimson destructive action (Delete). */
  tone?: 'neutral' | 'danger';
  /** Collapse the row out of the list (height animation) before running onSelect. */
  removes?: boolean;
  onSelect: () => void;
}

const THRESHOLD = 40; // px a drag must travel before an axis wins (direction lock)
const ACTION_WIDTH = 76; // px per revealed action button
const EASE = 'cubic-bezier(0.16, 1, 0.3, 1)';
const SNAP_MS = 260;
const COLLAPSE_MS = 300;

// Only one row open at a time across the app: the open row's token (stable per row).
type RowToken = { close: () => void };
let openToken: RowToken | null = null;

const reducedMotion = () =>
  typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/**
 * List row with swipe actions, identical for touch and mouse (pointer events).
 *   Drag left past 40 px: the row follows the pointer and uncovers the actions proportionally;
 *   release past half of the action area keeps it open, otherwise it snaps back.
 *   A press without a drag is a normal click (the row link navigates). With the row open, tapping
 *   the row closes it; tapping an action runs it. Escape or a press outside closes it, and opening
 *   another row closes this one.
 *   Direction lock: whichever axis passes 40 px first wins, so vertical scrolling (touch-action:
 *   pan-y lets the browser own it) never starts a swipe.
 *   Hover does nothing beyond the row's own background tint.
 *   Keyboard / screen readers: the "More" button opens a bottom sheet with the same actions.
 *
 * The row only moves by transform (translate3d on its own layer, written straight to the element
 * while dragging, no re-render per pointermove). Removal collapses the height with the site's
 * cubic-bezier(0.16, 1, 0.3, 1) curve. No motion under prefers-reduced-motion.
 */
export function SwipeableRow({
  children,
  actions,
  label,
  spacing = '',
  className = '',
}: {
  children: React.ReactNode;
  actions: SwipeAction[];
  /** Accessible name of the row (e.g. member name) for the More button. */
  label: string;
  /** Gap below the row (e.g. "pb-2"); inside the collapsing area, so it closes with the row. */
  spacing?: string;
  className?: string;
}) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const rowRef = useRef<HTMLDivElement>(null);
  const underlayRef = useRef<HTMLDivElement>(null);
  const offsetRef = useRef(0);
  const openRef = useRef(false);
  const gesture = useRef<{
    id: number;
    x: number;
    y: number;
    start: number;
    lock: 'x' | 'y' | null;
  } | null>(null);
  const suppressClick = useRef(false); // click synthesized after a drag (justSwiped pattern)
  const [open, setOpen] = useState(false);
  const tokenRef = useRef<RowToken | null>(null);
  const [collapsing, setCollapsing] = useState(false);
  const [sheet, setSheet] = useState(false);
  const revealWidth = actions.length * ACTION_WIDTH;

  const paint = useCallback(
    (x: number, animate: boolean) => {
      offsetRef.current = x;
      const row = rowRef.current;
      if (row) {
        row.style.transition = animate && !reducedMotion() ? `transform ${SNAP_MS}ms ${EASE}` : 'none';
        row.style.transform = `translate3d(${x}px, 0, 0)`;
      }
      const under = underlayRef.current;
      if (under) {
        const p = Math.min(1, Math.abs(x) / revealWidth);
        under.style.transition = animate && !reducedMotion() ? `opacity ${SNAP_MS}ms ${EASE}` : 'none';
        under.style.opacity = String(p);
      }
    },
    [revealWidth]
  );

  const close = useCallback(() => {
    paint(0, true);
    openRef.current = false;
    setOpen(false);
    if (openToken && openToken === tokenRef.current) openToken = null;
  }, [paint]);

  // Keep one token object per row; only its close() is refreshed.
  useEffect(() => {
    if (tokenRef.current) tokenRef.current.close = close;
    else tokenRef.current = { close };
  }, [close]);

  const openRow = useCallback(() => {
    if (openToken && openToken !== tokenRef.current) openToken.close();
    openToken = tokenRef.current;
    paint(-revealWidth, true);
    openRef.current = true;
    setOpen(true);
  }, [paint, revealWidth]);

  // Escape / press outside closes the open row.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && close();
    const onDown = (e: PointerEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) close();
    };
    document.addEventListener('keydown', onKey);
    document.addEventListener('pointerdown', onDown, true);
    return () => {
      document.removeEventListener('keydown', onKey);
      document.removeEventListener('pointerdown', onDown, true);
    };
  }, [open, close]);

  useEffect(
    () => () => {
      if (openToken && openToken === tokenRef.current) openToken = null;
    },
    []
  );

  const onPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (e.pointerType === 'mouse' && e.button !== 0) return;
    if ((e.target as HTMLElement).closest('[data-swipe-ignore]')) return; // More button
    gesture.current = { id: e.pointerId, x: e.clientX, y: e.clientY, start: offsetRef.current, lock: null };
  };

  const onPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const g = gesture.current;
    if (!g || g.id !== e.pointerId) return;
    const dx = e.clientX - g.x;
    const dy = e.clientY - g.y;
    if (!g.lock) {
      if (Math.abs(dx) < THRESHOLD && Math.abs(dy) < THRESHOLD) return;
      g.lock = Math.abs(dx) >= Math.abs(dy) ? 'x' : 'y';
      if (g.lock === 'y') return; // a scroll: leave it to the browser
      e.currentTarget.setPointerCapture(e.pointerId);
      if (openToken && openToken !== tokenRef.current) openToken.close();
    }
    if (g.lock !== 'x') return;
    e.preventDefault();
    // Start moving from the threshold (no jump), rubber-band past the action area.
    const travel = dx - Math.sign(dx) * THRESHOLD;
    let x = g.start + travel;
    if (x > 0) x = 0;
    if (x < -revealWidth) x = -revealWidth - (-revealWidth - x) * 0.25;
    paint(x, false);
  };

  const endGesture = (e: React.PointerEvent<HTMLDivElement>, cancelled: boolean) => {
    const g = gesture.current;
    if (!g || g.id !== e.pointerId) return;
    gesture.current = null;
    if (g.lock === 'x') {
      suppressClick.current = true;
      if (!cancelled && offsetRef.current < -revealWidth / 2) openRow();
      else close();
      return;
    }
    if (g.lock === 'y') {
      // A vertical drag (mouse) is a scroll attempt, never a click on the row.
      suppressClick.current = true;
      return;
    }
    if (!cancelled && g.lock === null && openRef.current) {
      // Tap on an open row closes it instead of navigating.
      suppressClick.current = true;
      close();
    }
  };

  const run = (action: SwipeAction) => {
    setSheet(false);
    close();
    if (action.removes) {
      setCollapsing(true);
      window.setTimeout(action.onSelect, reducedMotion() ? 0 : COLLAPSE_MS);
    } else {
      action.onSelect();
    }
  };

  return (
    <div
      ref={wrapRef}
      className={`grid ${collapsing ? 'grid-rows-[0fr] opacity-0' : 'grid-rows-[1fr] opacity-100'} motion-reduce:transition-none ${className}`}
      style={{ transition: `grid-template-rows ${COLLAPSE_MS}ms ${EASE}, opacity ${COLLAPSE_MS}ms ${EASE}` }}
    >
      <div className={`min-h-0 overflow-hidden ${spacing}`}>
        <div className="relative overflow-hidden rounded-2xl [content-visibility:auto] [contain-intrinsic-size:auto_76px]">
          {/* Actions behind the row, uncovered as it slides left. */}
          <div ref={underlayRef} className="absolute inset-y-0 right-0 flex opacity-0" style={{ width: revealWidth }} aria-hidden={!open}>
            {actions.map((a) => (
              <button
                key={a.key}
                type="button"
                tabIndex={open ? 0 : -1}
                onClick={() => run(a)}
                className={`h-full flex flex-col items-center justify-center gap-1 text-[11px] font-semibold ${
                  a.tone === 'danger' ? 'bg-[#DC2626] text-white' : 'bg-[#E8E6F1] text-[#665D96]'
                }`}
                style={{ width: ACTION_WIDTH }}
              >
                <a.icon className="w-5 h-5" aria-hidden />
                {a.label}
              </button>
            ))}
          </div>

          <div
            ref={rowRef}
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={(e) => endGesture(e, false)}
            onPointerCancel={(e) => endGesture(e, true)}
            onClickCapture={(e) => {
              if (suppressClick.current) {
                suppressClick.current = false;
                e.preventDefault();
                e.stopPropagation();
              }
            }}
            onDragStart={(e) => e.preventDefault()}
            className="relative touch-pan-y select-none [transform:translate3d(0,0,0)] will-change-transform"
          >
            {children}
            <button
              type="button"
              data-swipe-ignore
              onClick={() => setSheet(true)}
              aria-label={`More actions for ${label}`}
              aria-haspopup="dialog"
              className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full flex items-center justify-center text-[#B8B3D1] hover:bg-black/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#665D96]/40"
            >
              <MoreHorizontal className="w-4 h-4" aria-hidden />
            </button>
          </div>
        </div>
      </div>

      {sheet &&
        typeof document !== 'undefined' &&
        createPortal(
          <div
            className="fixed inset-0 z-[70] flex items-end justify-center bg-black/50 ail-fade-in"
            onClick={() => setSheet(false)}
            onKeyDown={(e) => e.key === 'Escape' && setSheet(false)}
          >
            <div
              role="dialog"
              aria-modal="true"
              aria-label={`Actions for ${label}`}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-[430px] rounded-t-3xl bg-white shadow-xl ail-sheet-up px-4 pt-3 pb-[max(1rem,env(safe-area-inset-bottom))] [transform:translate3d(0,0,0)]"
            >
              <div className="mx-auto mb-3 h-1.5 w-10 rounded-full bg-[#D0CDE1]" aria-hidden />
              <p className="px-1 pb-2 text-xs font-semibold text-[#413B5E]/60 truncate">{label}</p>
              <div className="space-y-1">
                {actions.map((a, i) => (
                  <button
                    key={a.key}
                    type="button"
                    autoFocus={i === 0}
                    onClick={() => run(a)}
                    className={`w-full h-12 px-3 rounded-2xl flex items-center gap-3 text-sm font-semibold text-left hover:bg-black/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#665D96]/40 ${
                      a.tone === 'danger' ? 'text-[#DC2626]' : 'text-[#413B5E]'
                    }`}
                  >
                    <a.icon className="w-5 h-5" aria-hidden />
                    {a.label}
                  </button>
                ))}
              </div>
              <button
                type="button"
                onClick={() => setSheet(false)}
                className="mt-2 w-full h-12 rounded-full border border-[#D0CDE1] bg-white text-sm font-medium text-[#413B5E] hover:bg-black/5"
              >
                Cancel
              </button>
            </div>
          </div>,
          document.body
        )}
    </div>
  );
}

export default SwipeableRow;