import { ROOT_HUB_SLUGS } from '@/lib/cities';

/**
 * Where the Travelpayouts Drive AI script may run. Its first request carries the page address, and it can rewrite
 * links inside the page, so it stays off everything signed in (chat and profile addresses contain member ids) and off
 * the login and signup flow. Only these public pages load it:
 *
 *   /                       the landing page (signed-out visitors; signed-in members are redirected away)
 *   /cities, /cities/[slug] the city directory and city pages
 *   /manila, /cebu, ...     the root city hubs
 *   /safety                 the safety guide
 *
 * components/TravelpayoutsDrive.tsx is the only user of this rule.
 */
export function tpScriptAllowed(pathname: string | null | undefined): boolean {
  if (!pathname) return false;
  const path = pathname.length > 1 ? pathname.replace(/\/+$/, '') : pathname;
  if (path === '/' || path === '/cities' || path === '/safety') return true;
  if (/^\/cities\/[^/]+$/.test(path)) return true;
  return (ROOT_HUB_SLUGS as readonly string[]).some((slug) => path === `/${slug}`);
}
