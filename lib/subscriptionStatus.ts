/**
 * Last known Plus status for the signed-in member, shared across pages in this tab.
 *   null  = not known yet (render a neutral skeleton, never "Upgrade" or "Keep Free")
 *   true  = Plus (lib/plus.ts isPlusProfile)
 *   false = free member
 * Module memory only (no storage): the server render and the first client render of a full page
 * load both see null, so there is no hydration mismatch; in-app navigation then reads the cached
 * value synchronously on mount. Navbar, /plus, /settings and /profile write it after each
 * profile read, and sign-out resets it.
 */
let cached: boolean | null = null;

export function getCachedSubscription(): boolean | null {
  return cached;
}

export function setCachedSubscription(value: boolean | null) {
  cached = value;
}
