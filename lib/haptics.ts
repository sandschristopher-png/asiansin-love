/**
 * Named haptic triggers. Android/desktop Chrome only (iOS Safari has no Vibration API) and silent
 * when the member turned haptics off in Settings (lib/utils/haptics.ts).
 */
import { hapticsEnabled } from '@/lib/utils/haptics';

function vibrate(pattern: number | number[]): void {
  if (typeof window === 'undefined' || !('vibrate' in navigator) || !hapticsEnabled()) return;
  try {
    navigator.vibrate(pattern);
  } catch {
    // Some browsers throw outside a user gesture; feedback is optional.
  }
}

/** Category pill click, tab switch. */
export const hapticLight = () => vibrate(10);
/** Sparking a profile, button confirmation. */
export const hapticMedium = () => vibrate(25);
/** Hitting the daily Spark quota. */
export const hapticWarning = () => vibrate([30, 40, 30]);
/** Mutual match unlock. */
export const hapticSuccess = () => vibrate([40, 60, 80]);
