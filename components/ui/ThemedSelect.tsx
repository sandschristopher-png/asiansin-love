'use client';

import React, { useCallback, useEffect, useId, useLayoutEffect, useRef, useState } from 'react';
import { Check, ChevronDown } from 'lucide-react';

export type ThemedOption<T extends string | number> = {
  value: T;
  label: string;
  /** lang attribute for the option text (language names in their own script). */
  lang?: string;
};

type Props<T extends string | number> = {
  value: T;
  onChange: (value: T) => void;
  options: readonly ThemedOption<T>[];
  /** Accessible name when there is no visible <label htmlFor>. */
  ariaLabel?: string;
  id?: string;
  disabled?: boolean;
  /** Trigger button classes (border, padding, text size): each call site keeps its own field look. */
  className?: string;
  /** Replaces the default trigger content (selected label + chevron). */
  renderTrigger?: (selected: ThemedOption<T> | undefined, open: boolean) => React.ReactNode;
  /** Which trigger edge the menu lines up with ('center' centres it under the trigger). */
  align?: 'left' | 'right' | 'center';
  /** Menu width; defaults to the trigger width (min 10rem). */
  menuClassName?: string;
  /** 2 lays short options out in a two-column grid that fits without scrolling (no check icon). */
  columns?: 1 | 2;
};

const MENU =
  'absolute z-50 min-w-full bg-white rounded-xl border border-slate-200 shadow-lg py-1.5 overflow-hidden';
const ITEM =
  'w-full px-3.5 py-2.5 text-sm text-left text-slate-700 font-normal transition-colors duration-150 cursor-pointer flex items-center justify-between gap-3 hover:bg-[#8574B7]/10 hover:text-[#413B5E] hover:font-medium';
const ITEM_ACTIVE = 'bg-[#8574B7]/10 text-[#413B5E] font-medium';
const ITEM_SELECTED = 'bg-[#8574B7]/15 text-[#8574B7] font-semibold hover:bg-[#8574B7]/15 hover:text-[#8574B7] hover:font-semibold';

/**
 * Brand-themed replacement for native <select>, whose OS popup highlights in system blue.
 * Listbox pattern: Arrow keys / Home / End move, Enter or Space picks, Escape or a click outside
 * closes, typing a letter jumps to the next matching option. The menu opens upward when there is
 * not enough room below (footer, bottom sheets).
 */
export function ThemedSelect<T extends string | number>({
  value,
  onChange,
  options,
  ariaLabel,
  id,
  disabled = false,
  className = '',
  renderTrigger,
  align = 'left',
  menuClassName = '',
  columns = 1,
}: Props<T>) {
  const grid = columns === 2;
  const autoId = useId();
  const buttonId = id ?? `ts-${autoId}`;
  const listId = `${buttonId}-list`;
  const rootRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [up, setUp] = useState(false);
  // Measured on open so the menu fits any screen: maxH caps it to the room on its side, dx nudges
  // it back inside the viewport edges.
  const [fit, setFit] = useState<{ maxH?: number; dx: number }>({ dx: 0 });
  const selectedIndex = options.findIndex((o) => o.value === value);
  const [active, setActive] = useState(selectedIndex);
  const selected = selectedIndex >= 0 ? options[selectedIndex] : undefined;

  const close = useCallback((refocus = true) => {
    setOpen(false);
    setFit({ dx: 0 });
    if (refocus) rootRef.current?.querySelector('button')?.focus();
  }, []);

  const openMenu = () => {
    if (disabled) return;
    const rect = rootRef.current?.getBoundingClientRect();
    if (rect) {
      const below = window.innerHeight - rect.bottom;
      setUp(below < 260 && rect.top > below);
    }
    setActive(selectedIndex >= 0 ? selectedIndex : 0);
    setOpen(true);
  };

  const pick = (i: number) => {
    const opt = options[i];
    if (!opt) return;
    if (opt.value !== value) onChange(opt.value);
    close();
  };

  // Outside tap closes the menu and is swallowed, so it does not also press the link or button
  // underneath. A screen resize or rotation closes it too (its measured fit would be stale).
  useEffect(() => {
    if (!open) return;
    const swallow = (ev: MouseEvent) => {
      ev.preventDefault();
      ev.stopPropagation();
    };
    const onDown = (e: PointerEvent) => {
      if (rootRef.current?.contains(e.target as Node)) return;
      close(false);
      document.addEventListener('click', swallow, { capture: true, once: true });
      // A drag or scroll produces no click: drop the guard so it cannot eat a later tap.
      window.setTimeout(() => document.removeEventListener('click', swallow, { capture: true }), 600);
    };
    const onResize = () => close(false);
    document.addEventListener('pointerdown', onDown);
    window.addEventListener('resize', onResize);
    return () => {
      document.removeEventListener('pointerdown', onDown);
      window.removeEventListener('resize', onResize);
    };
  }, [open, close]);

  // Fit the menu to the screen before it paints: open toward the side with more room when it does
  // not fit below, cap its height to that room (it scrolls only then), and keep it 8px inside both
  // viewport edges. Works for any phone width, height or system font size.
  useLayoutEffect(() => {
    if (!open) return;
    const root = rootRef.current;
    const menu = menuRef.current;
    const list = listRef.current;
    if (!root || !menu || !list) return;
    const EDGE = 8;
    const GAP = 6;
    const t = root.getBoundingClientRect();
    const natural = list.scrollHeight + 12; // + menu py-1.5
    const below = window.innerHeight - t.bottom - EDGE - GAP;
    const above = t.top - EDGE - GAP;
    const goUp = natural > below && above > below;
    const room = Math.max(120, goUp ? above : below);
    const r = menu.getBoundingClientRect();
    const vw = document.documentElement.clientWidth;
    const dx = r.left < EDGE ? EDGE - r.left : r.right > vw - EDGE ? vw - EDGE - r.right : 0;
    setUp(goUp);
    setFit({ maxH: Math.min(room, grid ? Infinity : 240), dx });
  }, [open, grid]);

  // Keep the active option in view (long lists: ages, countries).
  useLayoutEffect(() => {
    if (!open) return;
    listRef.current?.querySelector<HTMLElement>(`[data-index="${active}"]`)?.scrollIntoView({ block: 'nearest' });
  }, [open, active]);

  useEffect(() => {
    if (open) listRef.current?.focus();
  }, [open]);

  const onListKey = (e: React.KeyboardEvent) => {
    const last = options.length - 1;
    if (e.key === 'ArrowDown') { e.preventDefault(); setActive((a) => Math.min(last, a + (grid ? 2 : 1))); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setActive((a) => Math.max(0, a - (grid ? 2 : 1))); }
    else if (grid && e.key === 'ArrowRight') { e.preventDefault(); setActive((a) => Math.min(last, a + 1)); }
    else if (grid && e.key === 'ArrowLeft') { e.preventDefault(); setActive((a) => Math.max(0, a - 1)); }
    else if (e.key === 'Home') { e.preventDefault(); setActive(0); }
    else if (e.key === 'End') { e.preventDefault(); setActive(last); }
    else if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); pick(active); }
    else if (e.key === 'Escape') { e.preventDefault(); close(); }
    else if (e.key === 'Tab') { close(false); }
    else if (e.key.length === 1) {
      const ch = e.key.toLowerCase();
      for (let step = 1; step <= options.length; step++) {
        const i = (active + step) % options.length;
        if (options[i].label.toLowerCase().startsWith(ch)) { setActive(i); break; }
      }
    }
  };

  return (
    <div ref={rootRef} className="relative">
      <button
        id={buttonId}
        type="button"
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={open ? listId : undefined}
        aria-label={ariaLabel}
        onClick={() => (open ? close() : openMenu())}
        onKeyDown={(e) => {
          if (e.key === 'ArrowDown' || e.key === 'ArrowUp') { e.preventDefault(); openMenu(); }
        }}
        className={`${renderTrigger ? '' : 'w-full flex items-center justify-between gap-2 text-left'} cursor-pointer disabled:cursor-not-allowed disabled:opacity-60 ${className}`}
      >
        {renderTrigger ? (
          renderTrigger(selected, open)
        ) : (
          <>
            <span className="truncate" lang={selected?.lang}>{selected?.label ?? ''}</span>
            <ChevronDown className={`w-4 h-4 shrink-0 text-slate-500 transition-transform ${open ? 'rotate-180' : ''}`} aria-hidden />
          </>
        )}
      </button>

      {open && (
        <div
          ref={menuRef}
          style={align === 'right' ? { marginRight: -fit.dx } : { marginLeft: fit.dx }}
          className={`${MENU} ${up ? 'bottom-full mb-1.5' : 'top-full mt-1.5'} ${
            align === 'right' ? 'right-0' : align === 'center' ? 'left-1/2 -translate-x-1/2' : 'left-0'
          } ${menuClassName || 'w-max min-w-[10rem]'}`}
        >
          <ul
            ref={listRef}
            id={listId}
            role="listbox"
            tabIndex={-1}
            aria-labelledby={ariaLabel ? undefined : buttonId}
            aria-label={ariaLabel}
            aria-activedescendant={`${listId}-${active}`}
            onKeyDown={onListKey}
            style={fit.maxH ? { maxHeight: fit.maxH } : undefined}
            className={`${grid ? 'grid grid-cols-2 gap-0.5 px-1.5' : 'max-h-60'} overflow-y-auto overscroll-contain focus:outline-none`}
          >
            {options.map((o, i) => {
              const isSelected = i === selectedIndex;
              return (
                <li
                  key={String(o.value)}
                  id={`${listId}-${i}`}
                  data-index={i}
                  role="option"
                  aria-selected={isSelected}
                  lang={o.lang}
                  onPointerEnter={() => setActive(i)}
                  onClick={() => pick(i)}
                  className={`${ITEM} ${grid ? 'px-3 rounded-lg text-[13px]' : ''} ${isSelected ? ITEM_SELECTED : i === active ? ITEM_ACTIVE : ''}`}
                >
                  {/* Grid cells wrap long names onto a second line instead of cutting them off. */}
                  <span className={grid ? 'min-w-0 break-words leading-snug' : 'truncate'}>{o.label}</span>
                  {isSelected && !grid && <Check className="w-4 h-4 shrink-0" aria-hidden />}
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
}

export default ThemedSelect;
