import { isNativeApp } from '@/lib/nativeApp';

/** The AdMob banner unit id (create it in the AdMob console). Unset means no ads. Read at build time. */
export const BANNER_UNIT_ID = process.env.NEXT_PUBLIC_ADMOB_BANNER_ID ?? '';

/** Space left under the banner so it sits above the floating tab bar. */
const BANNER_MARGIN = 88;

/**
 * Shows the bottom banner. The ads plugin is imported only here, only inside the Android app, and every call is guarded:
 * in a browser this does nothing, and an ads failure never reaches the page.
 */
export async function showBanner(unitId: string): Promise<void> {
  if (!isNativeApp()) return;
  try {
    const { AdMob, BannerAdSize, BannerAdPosition } = await import('@capacitor-community/admob');
    await AdMob.initialize();
    await AdMob.showBanner({ adId: unitId, adSize: BannerAdSize.ADAPTIVE_BANNER, position: BannerAdPosition.BOTTOM_CENTER, margin: BANNER_MARGIN });
  } catch (err) {
    console.warn('[ads] banner not shown:', err);
  }
}

export async function removeBanner(): Promise<void> {
  if (!isNativeApp()) return;
  try {
    const { AdMob } = await import('@capacitor-community/admob');
    await AdMob.removeBanner();
  } catch {
    // Nothing was showing, or the plugin is not there: nothing to remove.
  }
}
