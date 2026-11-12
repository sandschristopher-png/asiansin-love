/**
 * Public origin of the site. NEXT_PUBLIC_SITE_URL (https://meetin.asia in production) is the
 * fallback anywhere there is no browser to ask.
 */
export const SITE_ORIGIN = (process.env.NEXT_PUBLIC_SITE_URL || 'https://meetin.asia').replace(/\/+$/, '');

/**
 * Origin a sign-in should come back to. In the browser that is the page's own origin, so the
 * session cookie set by /auth/callback lands on the host the member signed in on (production on
 * meetin.asia, local development on localhost); with no window it is SITE_ORIGIN. Nothing here
 * ever returns localhost in a production browser.
 */
export function authOrigin(): string {
  if (typeof window !== 'undefined' && window.location?.origin) return window.location.origin;
  return SITE_ORIGIN;
}
