/**
 * City landing page slugs (/cebu, /manila, ...). Kept apart from cityData.ts so client code
 * (components/LayoutShell.tsx hides the app chrome on these pages) doesn't bundle the page copy.
 * Must list exactly the keys of CITY_SEO_DATA.
 */
export const CITY_PAGE_SLUGS = ['cebu', 'manila', 'bangkok', 'phnom-penh', 'kuala-lumpur'] as const;

export function isCityPagePath(pathname: string | null | undefined): boolean {
  const slug = (pathname || '').replace(/^\/+|\/+$/g, '');
  return (CITY_PAGE_SLUGS as readonly string[]).includes(slug);
}
