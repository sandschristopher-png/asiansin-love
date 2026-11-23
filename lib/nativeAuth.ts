/**
 * Google and LINE sign-in inside the Android app.
 *
 * Google refuses to sign anyone in from an embedded WebView, so the app opens the provider in the system's Custom Tab
 * (@capacitor/browser). When the provider is done, Supabase sends the browser to the app's own link, below, the Android
 * intent filter in AndroidManifest.xml hands that link back to the app, and components/NativeAuthBridge.tsx forwards the
 * one-time code to /auth/callback inside the WebView. That route exchanges the code with the PKCE verifier cookie the
 * WebView already holds and applies the same onboarding rules as the website, so the member lands signed in, in the app.
 *
 * "asia.meetin.app://auth/callback" must be in Supabase > Authentication > URL Configuration > Redirect URLs.
 * This file is pure (no browser or Capacitor access) so it can be tested.
 */

export const NATIVE_AUTH_SCHEME = 'asia.meetin.app';
export const NATIVE_AUTH_HOST = 'auth';
export const NATIVE_AUTH_PATH = '/callback';
/** The redirect URL handed to Supabase when the member signs in from the Android app. */
export const NATIVE_AUTH_REDIRECT = `${NATIVE_AUTH_SCHEME}://${NATIVE_AUTH_HOST}${NATIVE_AUTH_PATH}`;

export type NativeAuthResult =
  | { kind: 'code'; code: string }
  | { kind: 'error'; error: string; description: string | null };

/**
 * Reads the link the app was opened with. Returns null for anything that is not the sign-in return (another scheme,
 * another path, or no code and no error), so a stray link never starts a sign-in.
 */
export function parseNativeAuthUrl(raw: string | null | undefined): NativeAuthResult | null {
  if (!raw) return null;
  let url: URL;
  try {
    url = new URL(raw);
  } catch {
    return null;
  }
  if (url.protocol !== `${NATIVE_AUTH_SCHEME}:`) return null;
  if (url.hostname !== NATIVE_AUTH_HOST || url.pathname.replace(/\/+$/, '') !== NATIVE_AUTH_PATH) return null;

  const code = url.searchParams.get('code');
  if (code && code.length <= 2048) return { kind: 'code', code };
  const error = url.searchParams.get('error') || url.searchParams.get('error_code');
  if (error) return { kind: 'error', error: error.slice(0, 200), description: (url.searchParams.get('error_description') || '').slice(0, 300) || null };
  return null;
}

/** The same-origin /auth/callback path that finishes the sign-in on the server (the WebView navigates to it). */
export function callbackPathFor(result: NativeAuthResult, next: string | null): string {
  const q = new URLSearchParams();
  if (result.kind === 'code') {
    q.set('code', result.code);
    if (next) q.set('next', next);
  } else {
    q.set('error', result.error);
    if (result.description) q.set('error_description', result.description);
    if (next) q.set('next', next);
  }
  return `/auth/callback?${q.toString()}`;
}
