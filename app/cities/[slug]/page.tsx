import { CityFooterLinks } from '@/components/CityFooterLinks';
import { IceFrame } from '@/components/ui/IceFrame';
import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound, permanentRedirect } from 'next/navigation';
import { MapPin, Plane, ShieldCheck, Lightbulb } from 'lucide-react';
import { BrandLogo } from '@/components/BrandLogo';
import { CITY_SLUGS, cityHref, getCity, isRootHub, type City } from '@/lib/cities';
import { SITE_URL } from '@/lib/seo/cityData';
import { TRIP_HUBS } from '@/lib/tripHubs';

/**
 * Programmatic SEO page per city (/cities/[slug]). Static at build time; any other slug is a 404.
 * Copy and facts live in lib/cities.ts.
 */

export function generateStaticParams() {
  return CITY_SLUGS.map((slug) => ({ slug }));
}

type Params = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { slug } = await params;
  const city = getCity(slug);
  // Root hubs and held cities are not indexed on /cities/[slug].
  if (!city || !city.published || isRootHub(city.slug)) return {};
  const url = `${SITE_URL}/cities/${city.slug}`;
  return {
    title: { absolute: city.metaTitle },
    description: city.metaDescription,
    alternates: { canonical: url },
    robots: { index: true, follow: true },
    openGraph: {
      type: 'website',
      url,
      siteName: 'Meet in Asia',
      title: city.metaTitle,
      description: city.metaDescription,
      locale: 'en_US',
      images: [{ url: '/Landing-Woman.png', width: 1024, height: 687, alt: `Meet in Asia in ${city.name}` }],
    },
    twitter: {
      card: 'summary_large_image',
      title: city.metaTitle,
      description: city.metaDescription,
      images: ['/Landing-Woman.png'],
    },
  };
}

/** Serialises JSON-LD safely for an inline script tag (escapes "<" so no value can close the tag). */
function jsonLd(data: unknown): string {
  return JSON.stringify(data).replace(/</g, '\\u003c');
}

function breadcrumbJsonLd(city: City) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Meet in Asia', item: SITE_URL },
      { '@type': 'ListItem', position: 2, name: 'Cities', item: `${SITE_URL}/cities` },
      { '@type': 'ListItem', position: 3, name: city.name, item: `${SITE_URL}/cities/${city.slug}` },
    ],
  };
}

function faqJsonLd(city: City) {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: city.faqs.map((f) => ({
      '@type': 'Question',
      name: f.question,
      acceptedAnswer: { '@type': 'Answer', text: f.answer },
    })),
  };
}

export default async function CityPage({ params }: Params) {
  const { slug } = await params;
  const city = getCity(slug);
  if (!city || !city.published) notFound();
  // The five overlapping cities canonicalize to the root hub (/manila, /cebu, ...).
  if (isRootHub(city.slug)) permanentRedirect(cityHref(city.slug));

  // Visiting Soon only lists the hub cities in lib/tripHubs.ts; never advertise it for the others.
  const isTripHub = TRIP_HUBS.some((h) => h.city === city.name);
  const nearby = city.nearbySlugs
    .map((s) => getCity(s))
    .filter((c): c is City => Boolean(c && c.published));

  return (
    <main className="min-h-[100dvh] bg-white text-[#413B5E] overflow-x-hidden">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd(breadcrumbJsonLd(city)) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd(faqJsonLd(city)) }} />

      <header className="px-5 pt-6 flex items-center justify-between max-w-xl mx-auto">
        <BrandLogo href="/" size="sm" />
        <Link href="/login" className="text-xs font-medium text-[#8574B7] hover:text-[#413B5E] transition-colors">
          Sign in
        </Link>
      </header>

      <div className="max-w-xl mx-auto px-4 pb-[calc(3rem+env(safe-area-inset-bottom))]">
        <nav aria-label="Breadcrumb" className="pt-6 text-xs text-slate-600">
          <ol className="flex flex-wrap items-center gap-1.5">
            <li><Link href="/" className="hover:text-[#8574B7]">Meet in Asia</Link></li>
            <li aria-hidden>/</li>
            <li><Link href="/cities" className="hover:text-[#8574B7]">Cities</Link></li>
            <li aria-hidden>/</li>
            <li aria-current="page" className="text-[#413B5E] font-medium">{city.name}</li>
          </ol>
        </nav>

        {/* Hero */}
        <section className="pt-8 pb-8 text-center">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-[#D0CDE1] bg-[#E8E6F1]/50 px-3 py-1 text-[11px] font-semibold tracking-wide text-[#8574B7]">
            <MapPin className="w-3.5 h-3.5" aria-hidden />
            {city.country} · {city.region}
          </span>
          <h1 className="mt-5 text-3xl sm:text-4xl font-semibold tracking-tight leading-[1.15]">
            Meet singles in{' '}
            <span className="text-[#8574B7]">{city.name}</span>
          </h1>
          <p className="mt-4 text-sm leading-relaxed text-[#413B5E]/75">{city.heroTagline}</p>
          <div className="mt-7 flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              href="/signup"
              className="h-12 px-8 rounded-full bg-[#8574B7] hover:bg-[#534377] text-white text-sm font-medium transition-colors flex items-center justify-center"
            >
              Create your free profile
            </Link>
            <Link
              href="/login"
              className="h-12 px-6 rounded-full border border-[#D0CDE1] bg-white text-[#413B5E] text-sm font-medium hover:bg-[#E8E6F1]/30 transition-colors flex items-center justify-center"
            >
              Sign in to browse {city.name}
            </Link>
          </div>
        </section>

        {/* Intro */}
        <section className="py-8 border-t border-[#D0CDE1]/60" aria-labelledby="intro-heading">
          <h2 id="intro-heading" className="text-xl font-semibold tracking-tight">
            Dating in {city.name}
          </h2>
          <p className="mt-3 text-sm leading-relaxed text-[#413B5E]/80">{city.intro}</p>
        </section>

        {/* Visiting Soon callout (hub cities only) */}
        {isTripHub && (
          <section className="py-2" aria-labelledby="travel-heading">
            <IceFrame>
            <div className="rounded-2xl bg-white p-4">
              <div className="flex items-start gap-3">
                <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#EBF3FF] text-[#3B66A8]">
                  <Plane className="w-4 h-4" aria-hidden />
                </span>
                <div>
                  <h2 id="travel-heading" className="text-sm font-semibold">Travelling to {city.name}?</h2>
                  <p className="mt-1 text-xs leading-relaxed text-[#413B5E]/75">
                    Plus members can add a Visiting Soon trip with arrival and departure dates, so people in {city.name} see
                    you before you land.
                  </p>
                  <Link href="/plus?feature=trips" className="mt-3 inline-flex h-9 items-center rounded-full bg-[#8574B7] px-4 text-xs font-medium text-white hover:bg-[#534377] transition-colors">
                    See Meet in Asia Plus
                  </Link>
                </div>
              </div>
            </div>
            </IceFrame>
          </section>
        )}

        {/* Tips */}
        <section className="py-8 border-t border-[#D0CDE1]/60" aria-labelledby="tips-heading">
          <h2 id="tips-heading" className="text-xl font-semibold tracking-tight">Local dating tips</h2>
          <ul className="mt-4 space-y-3">
            {city.datingCultureTips.map((tip) => (
              <li key={tip} className="flex gap-3 rounded-2xl border border-[#D0CDE1]/60 bg-white p-4">
                <Lightbulb className="mt-0.5 w-4 h-4 shrink-0 text-[#8574B7]" aria-hidden />
                <p className="text-sm leading-relaxed text-[#413B5E]/80">{tip}</p>
              </li>
            ))}
          </ul>
        </section>

        {/* First-date spots */}
        <section className="py-8 border-t border-[#D0CDE1]/60" aria-labelledby="spots-heading">
          <h2 id="spots-heading" className="text-xl font-semibold tracking-tight">First-date areas in {city.name}</h2>
          <ul className="mt-4 flex flex-wrap gap-2">
            {city.firstDateSpots.map((spot) => (
              <li key={spot} className="rounded-full border border-[#D0CDE1] bg-white px-3 py-1.5 text-xs font-medium text-[#8574B7]">
                {spot}
              </li>
            ))}
          </ul>
        </section>

        {/* Trust */}
        <section className="py-8 border-t border-[#D0CDE1]/60" aria-labelledby="trust-heading">
          <h2 id="trust-heading" className="text-xl font-semibold tracking-tight">How members are checked</h2>
          <div className="mt-4 flex gap-3 rounded-2xl border border-[#D0CDE1]/60 bg-white p-4">
            <ShieldCheck className="mt-0.5 w-4 h-4 shrink-0 text-[#8574B7]" aria-hidden />
            <p className="text-sm leading-relaxed text-[#413B5E]/80">
              Verification is a free, optional selfie check. Reputation scores are public on every profile, messages are
              screened for scams and off-platform pressure, and reports are reviewed by the team.
            </p>
          </div>
        </section>

        {/* FAQ */}
        <section className="py-8 border-t border-[#D0CDE1]/60" aria-labelledby="faq-heading">
          <h2 id="faq-heading" className="text-xl font-semibold tracking-tight">Questions about dating in {city.name}</h2>
          <dl className="mt-4 space-y-5">
            {city.faqs.map((f) => (
              <div key={f.question}>
                <dt className="text-sm font-semibold">{f.question}</dt>
                <dd className="mt-1.5 text-sm leading-relaxed text-[#413B5E]/80">{f.answer}</dd>
              </div>
            ))}
          </dl>
        </section>

        {/* Nearby */}
        {nearby.length > 0 && (
          <section className="py-8 border-t border-[#D0CDE1]/60" aria-labelledby="nearby-heading">
            <h2 id="nearby-heading" className="text-base font-semibold tracking-tight">Nearby cities</h2>
            <ul className="mt-3 flex flex-wrap gap-2">
              {nearby.map((c) => (
                <li key={c.slug}>
                  <Link href={cityHref(c.slug)} className="inline-flex rounded-full border border-[#D0CDE1] bg-white px-3 py-1.5 text-xs font-medium text-[#8574B7] hover:bg-[#E8E6F1]/40 transition-colors">
                    {c.name}
                  </Link>
                </li>
              ))}
            </ul>
            <p className="mt-4 text-xs text-slate-600">
              <Link href="/cities" className="font-medium text-[#8574B7] hover:text-[#413B5E]">All cities</Link>
            </p>
          </section>
        )}

        <footer className="pt-8 border-t border-[#D0CDE1]/60 text-center">
          <CityFooterLinks />
        </footer>
      </div>
    </main>
  );
}
