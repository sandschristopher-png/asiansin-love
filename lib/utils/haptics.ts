/**
 * Light haptic feedback (navigator.vibrate). No-ops where unsupported (iOS Safari, desktop) and
 * when the member turned it off in Settings (localStorage "ail_haptics" = "off").
 */
const STORAGE_KEY = 'ail_haptics';

export function hapticsEnabled(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    return window.localStorage.getItem(STORAGE_KEY) !== 'off';
  } catch {
    return true;
  }
}

export function setHapticsEnabled(on: boolean): void {
  try {
    window.localStorage.setItem(STORAGE_KEY, on ? 'on' : 'off');
  } catch {
    // Private mode / storage blocked: the default (on) stays in effect.
  }
}

export function hapticsSupported(): boolean {
  return typeof navigator !== 'undefined' && typeof navigator.vibrate === 'function';
}

function vibrate(pattern: number | number[]): void {
  if (!hapticsEnabled() || !hapticsSupported()) return;
  try {
    navigator.vibrate(pattern);
  } catch {
    // Some browsers throw outside a user gesture; feedback is optional.
  }
}

/** Taps on primary controls (mic, send, spark). */
export const hapticTap = () => vibrate(8);
/** Camera shutter. */
export const hapticPhotoSnap = () => vibrate([12, 40, 18]);
/** Something worked (sent, verified, saved). */
export const hapticSuccess = () => vibrate([10, 60, 14]);
/** Blocked or failed action (locked feature, error). */
export const hapticError = () => vibrate([30, 50, 30]);
