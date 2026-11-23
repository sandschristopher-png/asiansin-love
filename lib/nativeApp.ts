import { Capacitor } from '@capacitor/core';

/**
 * Is this the Meet in Asia Android app (the Capacitor shell) rather than a browser? Purchases and ads exist only there:
 * Plus is bought through Google Play Billing and ads come from AdMob, so the website shows neither a payment prompt nor an
 * ad. Safe in any browser and on the server: it returns false instead of throwing.
 */
export function isNativeApp(): boolean {
  try {
    return Capacitor.isNativePlatform();
  } catch {
    return false;
  }
}
