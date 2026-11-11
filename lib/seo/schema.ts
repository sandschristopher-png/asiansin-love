/**
 * JSON-LD helpers for the city landing pages (schema.org). Rendered with
 * JSON.stringify(...).replace(/</g, '\\u003c') per the Next.js JSON-LD guide, so profile copy can
 * never close the <script> tag.
 */
import { SITE_URL, type CitySEOData } from '@/lib/seo/cityData';

type JsonLd = Record<string, unknown>;

export function organizationSchema(): JsonLd {
  return {
    '@type': 'Organization',
    '@id': `${SITE_URL}/#organization`,
    name: 'Meet in Asia',
    url: SITE_URL,
    logo: `${SITE_URL}/icon-192.png`,
  };
}

export function webPageSchema(city: CitySEOData): JsonLd {
  return {
    '@type': 'WebPage',
    '@id': `${city.canonicalUrl}#webpage`,
    url: city.canonicalUrl,
    name: city.metaTitle,
    description: city.metaDescription,
    inLanguage: 'en',
    isPartOf: { '@type': 'WebSite', '@id': `${SITE_URL}/#website`, name: 'Meet in Asia', url: SITE_URL },
    publisher: { '@id': `${SITE_URL}/#organization` },
    about: {
      '@type': 'City',
      name: city.cityName,
      containedInPlace: { '@type': 'Country', name: city.countryName, identifier: city.countryCode },
    },
    keywords: [...city.primaryKeywords, ...city.secondaryKeywords].join(', '),
  };
}

export function breadcrumbSchema(city: CitySEOData): JsonLd {
  return {
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Meet in Asia', item: SITE_URL },
      { '@type': 'ListItem', position: 2, name: `${city.cityName} Dating`, item: city.canonicalUrl },
    ],
  };
}

export function faqSchema(city: CitySEOData): JsonLd {
  return {
    '@type': 'FAQPage',
    '@id': `${city.canonicalUrl}#faq`,
    mainEntity: city.faq.map((f) => ({
      '@type': 'Question',
      name: f.question,
      acceptedAnswer: { '@type': 'Answer', text: f.answer },
    })),
  };
}

/** One @graph document for the page (organization, page, breadcrumb, FAQ). */
export function cityPageJsonLd(city: CitySEOData): string {
  const doc = {
    '@context': 'https://schema.org',
    '@graph': [organizationSchema(), webPageSchema(city), breadcrumbSchema(city), faqSchema(city)],
  };
  return JSON.stringify(doc).replace(/</g, '\\u003c');
}
