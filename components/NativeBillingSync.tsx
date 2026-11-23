'use client';

import { useEffect } from 'react';
import { useIsNativeApp } from '@/lib/useNativeApp';
import { supabase } from '@/lib/supabase/client';
import { clearHeaderProfile } from '@/lib/headerProfileStore';
import { restorePurchases } from '@/lib/billing/nativePlay';

const SYNCED_KEY = 'ail_play_synced';

/**
 * Once per app session, for a signed-in member in the Android app: asks Google Play for the member's subscriptions and has the
 * server re-check them. A subscription that keeps renewing gets its paid-until time extended without the member doing anything,
 * and Plus comes back after a reinstall. Silent: no message, nothing in a browser, and a failure changes nothing.
 */
export function NativeBillingSync() {
  const native = useIsNativeApp();

  useEffect(() => {
    if (!native) return;
    let cancelled = false;
    try {
      if (sessionStorage.getItem(SYNCED_KEY)) return;
    } catch {
      // no session storage: it simply runs again on the next page
    }
    const timer = window.setTimeout(async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (cancelled || !user) return;
      try {
        sessionStorage.setItem(SYNCED_KEY, '1');
      } catch {
        // see above
      }
      const outcome = await restorePurchases();
      if (!cancelled && outcome.status === 'restored') clearHeaderProfile();
    }, 4000);
    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [native]);

  return null;
}

export default NativeBillingSync;
