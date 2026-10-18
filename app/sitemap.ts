import { MetadataRoute } from 'next';

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = 'https://asiansin.love';
  const slugs = ["filipina-dating","filipino-dating","manila-dating","cebu-dating","thai-dating","bangkok-dating","indonesia-dating","jakarta-dating","myanmar-dating","burmese-dating","cambodia-dating","khmer-dating","vietnam-dating","saigon-dating","verified-asian-dating"];

  const routes = ['', '/discover', '/favorites', '/messages', '/profile', '/plus'].map((route) => ({
    url: baseUrl + route,
    lastModified: new Date(),
    changeFrequency: 'daily' as const,
    priority: route === '' ? 1.0 : 0.8,
  }));

  const seoRoutes = slugs.map((slug) => ({
    url: baseUrl + '/dating/' + slug,
    lastModified: new Date(),
    changeFrequency: 'weekly' as const,
    priority: 0.9,
  }));

  return [...routes, ...seoRoutes];
}
