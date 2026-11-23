'use client';

import { useEffect } from 'react';
import { useIsNativeApp } from '@/lib/useNativeApp';
import { callbackPathFor, parseNativeAuthUrl } from '@/lib/nativeAuth';
import { NATIVE_AUTH_NEXT_KEY } from '@/lib/nativeOAuth';
import { safeReturnTo } from '@/lib/authRedirect';

const HANDLED_KEY = 'ail_native_auth_handled';

/**
 * Brings a Google or LINE sign-in back into the Android app. The provider finishes in the system Custom Tab and sends the
 * browser to asia.meetin.app://auth/callback; Android reopens the app with that link, and this forwards the one-time code
 * to /auth/callback inside the WebView, where the server exchanges it for a session. It handles both a link that arrives
 * while the app is open (appUrlOpen) and the link that started the app (getLaunchUrl, when Android had closed it while the
 * member was signing in). Each link is handled once. It renders nothing, and does nothing in a browser.
 */
export function NativeAuthBridge() {
  const native = useIsNativeApp();

  useEffect(() => {
    if (!native) return;
    let cancelled = false;
    let handle: { remove: () => Promise<void> } | null = null;

    const forward = async (url: string | null | undefined) => {
      const result = parseNativeAuthUrl(url);
      if (!result || !url) return;
      try {
        if (sessionStorage.getItem(HANDLED_KEY) === url) return;
        sessionStorage.setItem(HANDLED_KEY, url);
      } catch {
        // no session storage: the one-time code simply cannot be used twice
      }
      let next: string | null = null;
      try {
        next = safeReturnTo(localStorage.getItem(NATIVE_AUTH_NEXT_KEY));
        localStorage.removeItem(NATIVE_AUTH_NEXT_KEY);
      } catch {
        // default destination
      }
      try {
        const { Browser } = await import('@capacitor/browser');
        await Browser.close();
      } catch {
        // Android cannot close a Custom Tab from code; reopening the app already brought it to the front
      }
      window.location.assign(callbackPathFor(result, next));
    };

    (async () => {
      const { App } = await import('@capacitor/app');
      const listener = await App.addListener('appUrlOpen', (event) => void forward(event.url));
      if (cancelled) {
        void listener.remove();
        return;
      }
      handle = listener;
      const launch = await App.getLaunchUrl();
      if (!cancelled) await forward(launch?.url);
    })().catch((err) => console.warn('[auth] sign-in return link not handled:', err));

    return () => {
      cancelled = true;
      void handle?.remove().catch(() => {});
    };
  }, [native]);

  return null;
}

export default NativeAuthBridge;
