import type { MetadataRoute } from 'next';
import { SITE_URL } from '@/lib/seo/cityData';

/**
 * One rule set for every crawler (Googlebot, Bingbot, which also feeds Yahoo and DuckDuckGo,
 * and the rest): public marketing and city pages are open; APIs, admin and signed-in screens are
 * not crawled.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: [
        '/api/',
        // No /admin entry: listing it would reveal the stealth-404 admin console.
        '/settings',
        '/onboarding',
        '/chat/',
        '/messages',
        '/favorites',
        '/notifications',
        '/announcements',
        '/profile/edit',
        '/auth/',
        '/reset-password',
      ],
    },
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}
