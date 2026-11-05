import type { MetadataRoute } from 'next';
import { CITY_SEO_DATA, SITE_URL } from '@/lib/seo/cityData';

/** Legacy keyword pages (app/dating/[slug]) that still render. cebu / manila / bangkok /
 *  cambodia / khmer-dating 301 to the city hubs (next.config.ts), so they are not listed. */
const DATING_SLUGS = [
  'filipina-dating', 'filipino-dating', 'thai-dating',
  'indonesia-dating', 'jakarta-dating', 'myanmar-dating', 'burmese-dating',
  'vietnam-dating', 'saigon-dating', 'verified-asian-dating',
];

/**
 * Public, crawlable pages only. Signed-in screens (/discover, /messages, /favorites, /profile...)
 * redirect crawlers to /login, so they are not listed.
 */
export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();

  const core: MetadataRoute.Sitemap = [
    { url: SITE_URL, lastModified: now, changeFrequency: 'daily', priority: 1.0 },
    { url: `${SITE_URL}/plus`, lastModified: now, changeFrequency: 'weekly', priority: 0.7 },
    { url: `${SITE_URL}/features`, lastModified: now, changeFrequency: 'monthly', priority: 0.6 },
    { url: `${SITE_URL}/safety`, lastModified: now, changeFrequency: 'monthly', priority: 0.5 },
    { url: `${SITE_URL}/standards`, lastModified: now, changeFrequency: 'monthly', priority: 0.4 },
    { url: `${SITE_URL}/terms`, lastModified: now, changeFrequency: 'yearly', priority: 0.3 },
    { url: `${SITE_URL}/privacy`, lastModified: now, changeFrequency: 'yearly', priority: 0.3 },
  ];

  const cities: MetadataRoute.Sitemap = Object.values(CITY_SEO_DATA).map((city) => ({
    url: city.canonicalUrl,
    lastModified: now,
    changeFrequency: 'weekly',
    priority: 0.9,
  }));

  const legacy: MetadataRoute.Sitemap = DATING_SLUGS.map((slug) => ({
    url: `${SITE_URL}/dating/${slug}`,
    lastModified: now,
    changeFrequency: 'weekly',
    priority: 0.6,
  }));

  return [...core, ...cities, ...legacy];
}
