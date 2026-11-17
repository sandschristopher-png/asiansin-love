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

// ---- Named presets ----------------------------------------------------------------------------------
// Call these synchronously from onClick / onPointerDown, BEFORE any await: browsers only allow a
// vibration inside the user gesture that triggered it. All of them respect the Settings toggle
// ("Haptic feedback", on by default) and are silent where vibration is unsupported (iOS Safari, desktop).
// Inside a Capacitor shell the native Haptics plugin is used when it is present.

type CapacitorHaptics = { impact?: (o: { style: string }) => unknown; notification?: (o: { type: string }) => unknown };

function bridge(): CapacitorHaptics | null {
  if (typeof window === 'undefined') return null;
  const cap = (window as unknown as { Capacitor?: { isNativePlatform?: () => boolean; Plugins?: { Haptics?: CapacitorHaptics } } }).Capacitor;
  return cap?.isNativePlatform?.() ? (cap.Plugins?.Haptics ?? null) : null;
}

function fire(pattern: number | number[], native?: 'light' | 'medium' | 'success'): void {
  if (typeof window === 'undefined' || !hapticsEnabled()) return;
  const b = bridge();
  if (b && native) {
    try {
      if (native === 'success') void b.notification?.({ type: 'SUCCESS' });
      else void b.impact?.({ style: native === 'light' ? 'LIGHT' : 'MEDIUM' });
      return;
    } catch {
      // fall through to the web vibration
    }
  }
  vibrate(pattern);
}

export const haptic = {
  /** Bottom nav tabs, the + Post Moment button, chat send, call Mute / Speaker / End. */
  tap: () => fire(8, 'light'),
  /** A Moment heart turning to liked (not on unlike). */
  like: () => fire(10, 'light'),
  /** Tapping Spark on a profile. */
  spark: () => fire(15, 'medium'),
  /** Mutual match celebration. */
  match: () => fire([30, 50, 60], 'success'),
  /** An incoming real-time toast. */
  notify: () => fire([15, 40, 15], 'light'),
  /** A head-turn direction locking in during the liveness check. */
  poseLock: () => fire(18, 'light'),
  /** One incoming-call ring cycle. */
  ring: () => fire([200, 100, 200]),
};
