'use client';

import { useEffect, useRef } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useIsNativeApp } from '@/lib/useNativeApp';
import { decideBack } from '@/lib/nativeBack';

/**
 * The Android hardware / gesture back button, inside the Capacitor app only (it renders nothing and does nothing in a browser):
 *   1. an open sheet or dialog closes first (it listens for Escape);
 *   2. on a sub-page, back goes to the previous page in the app's history;
 *   3. on a root tab other than Discover, back goes to Discover, so one press never throws a member out of the app;
 *   4. on Discover (or with nowhere to go back to), back leaves the app.
 * The listener is removed when this unmounts, and the plugin is imported only here, only in the app.
 */
export function NativeBackButton() {
  const native = useIsNativeApp();
  const router = useRouter();
  const pathname = usePathname();
  const path = useRef(pathname);
  useEffect(() => {
    path.current = pathname;
  });

  useEffect(() => {
    if (!native) return;
    let cancelled = false;
    let handle: { remove: () => Promise<void> } | null = null;

    (async () => {
      const { App } = await import('@capacitor/app');
      const listener = await App.addListener('backButton', () => {
        const action = decideBack({
          path: path.current || '/',
          historyLength: window.history.length,
          dialogOpen: Boolean(document.querySelector('[role="dialog"][aria-modal="true"]')),
        });
        if (action === 'close_dialog') document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
        else if (action === 'history_back') window.history.back();
        else if (action === 'go_discover') router.push('/discover');
        else void App.exitApp();
      });
      if (cancelled) void listener.remove();
      else handle = listener;
    })().catch((err) => console.warn('[back] button handler not installed:', err));

    return () => {
      cancelled = true;
      void handle?.remove().catch(() => {});
    };
  }, [native, router]);

  return null;
}

export default NativeBackButton;
