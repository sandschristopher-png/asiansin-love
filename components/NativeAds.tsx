'use client';

import { useEffect } from 'react';
import { useIsNativeApp } from '@/lib/useNativeApp';
import { useMemberState } from '@/lib/useMemberState';
import { shouldShowAds } from '@/lib/adsRules';
import { BANNER_UNIT_ID, removeBanner, showBanner } from '@/lib/ads';

/**
 * The AdMob banner of the Android app, and nothing anywhere else: it renders no markup, does nothing in a browser, and
 * never shows to a Plus member (it is removed the moment Plus is known). See lib/adsRules.ts for the full rule.
 */
export function NativeAds() {
  const native = useIsNativeApp();
  const { plus } = useMemberState();
  const show = shouldShowAds({ native, plus, unitId: BANNER_UNIT_ID });

  useEffect(() => {
    if (!show) return;
    void showBanner(BANNER_UNIT_ID);
    return () => {
      void removeBanner();
    };
  }, [show]);

  return null;
}

export default NativeAds;
