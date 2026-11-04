'use client';

import { useEffect, useSyncExternalStore } from 'react';

/**
 * Lets a screen hide the floating BottomNav while it is on screen (e.g. My Profile in edit mode,
 * where the dock would sit over the form and its Save / Cancel bar). Counted, so overlapping
 * screens can't un-hide each other.
 */
let hiders = 0;
const listeners = new Set<() => void>();

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function useBottomNavHidden(): boolean {
  return useSyncExternalStore(subscribe, () => hiders > 0, () => false);
}

/** Hides the BottomNav while `hidden` is true and the calling component is mounted. */
export function useHideBottomNav(hidden: boolean) {
  useEffect(() => {
    if (!hidden) return;
    hiders += 1;
    listeners.forEach((l) => l());
    return () => {
      hiders -= 1;
      listeners.forEach((l) => l());
    };
  }, [hidden]);
}
