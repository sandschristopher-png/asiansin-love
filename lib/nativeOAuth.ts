'use client';

import { supabase } from '@/lib/supabase/client';
import { NATIVE_AUTH_REDIRECT } from '@/lib/nativeAuth';

/** Where the member was heading before sign-in; the bridge reads it when the app is reopened by the provider's return link. */
export const NATIVE_AUTH_NEXT_KEY = 'ail_native_auth_next';

/**
 * Starts Google or LINE sign-in in the Android app: Supabase builds the provider URL (and stores the PKCE verifier cookie
 * here in the WebView), and the system Custom Tab opens it. Resolves once the tab is open; the rest happens in
 * components/NativeAuthBridge.tsx when the app is opened by asia.meetin.app://auth/callback.
 */
export async function startNativeOAuth(provider: 'google' | 'line', returnTo: string | null): Promise<{ error: { message: string } | null }> {
  const { data, error } = await supabase.auth.signInWithOAuth({
    // LINE is a custom OIDC provider in Supabase ("custom:line"); the SDK types list built-ins only.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    provider: (provider === 'line' ? 'custom:line' : 'google') as any,
    options: { redirectTo: NATIVE_AUTH_REDIRECT, skipBrowserRedirect: true },
  });
  if (error || !data?.url) return { error: error ?? { message: 'No sign-in address was returned.' } };
  try {
    if (returnTo) localStorage.setItem(NATIVE_AUTH_NEXT_KEY, returnTo);
    else localStorage.removeItem(NATIVE_AUTH_NEXT_KEY);
  } catch {
    // storage unavailable: the member lands on the default page
  }
  try {
    const { Browser } = await import('@capacitor/browser');
    await Browser.open({ url: data.url });
    return { error: null };
  } catch (err) {
    return { error: { message: err instanceof Error ? err.message : 'The sign-in window could not open.' } };
  }
}
