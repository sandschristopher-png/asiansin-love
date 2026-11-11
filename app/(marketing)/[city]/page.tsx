import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ChevronDown, Globe, MessageCircle, ShieldCheck } from 'lucide-react';
import { BrandLogo } from '@/components/BrandLogo';
import { CITY_SLUGS, getCityData } from '@/lib/seo/cityData';
import { cityPageJsonLd } from '@/lib/seo/schema';

/**
 * Programmatic SEO hub: one static, indexable landing page per city in lib/seo/cityData.ts
 * (/cebu, /manila, /bangkok, /phnom-penh, /kuala-lumpur). Any other slug is a 404.
 */
export const dynamicParams = false;

export function generateStaticParams() {
  return CITY_SLUGS.map((city) => ({ city }));
}

export async function generateMetadata({ params }: { params: Promise<{ city: string }> }): Promise<Metadata> {
  const { city: slug } = await params;
  const city = getCityData(slug);
  if (!city) return {};
  return {
    title: { absolute: city.metaTitle },
    description: city.metaDescription,
    keywords: [...city.primaryKeywords, ...city.secondaryKeywords],
    alternates: { canonical: city.canonicalUrl },
    robots: { index: true, follow: true },
    openGraph: {
      type: 'website',
      url: city.canonicalUrl,
      siteName: 'Meet in Asia',
      title: city.metaTitle,
      description: city.metaDescription,
      locale: 'en_US',
      images: [{ url: '/og-image.png', width: 1200, height: 630, alt: `${city.cityName} dating on Meet in Asia` }],
    },
    twitter: {
      card: 'summary_large_image',
      title: city.metaTitle,
      description: city.metaDescription,
      images: ['/og-image.png'],
    },
  };
}

const INSIGHT_ICONS = [Globe, MessageCircle, ShieldCheck];

export default async function CityLandingPage({ params }: { params: Promise<{ city: string }> }) {
  const { city: slug } = await params;
  const city = getCityData(slug);
  if (!city) notFound();

  return (
    <main className="relative isolate min-h-[100dvh] w-full overflow-hidden bg-white text-[#413B5E] font-sans">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: cityPageJsonLd(city) }} />

      {/* Soft lavender aura in the mid and lower canvas; the header stays pure white. */}
      <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden -z-10">
        <div className="absolute top-[38%] -right-24 w-[28rem] h-[28rem] rounded-full bg-[#D0CDE1]/40 blur-3xl" />
        <div className="absolute top-[62%] -left-28 w-[30rem] h-[30rem] rounded-full bg-[#E8E6F1]/60 blur-3xl" />
      </div>

      <header className="px-5 pt-6 flex items-center justify-between max-w-xl mx-auto">
        <BrandLogo href="/" size="sm" />
        <Link href="/login" className="text-xs font-semibold text-[#8574B7] hover:text-[#413B5E] transition-colors">
          Sign in
        </Link>
      </header>

      <div className="max-w-xl mx-auto px-5 pb-[calc(3rem+env(safe-area-inset-bottom))]">
        {/* Hero */}
        <section className="pt-10 pb-8 text-center">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-[#D0CDE1] bg-[#E8E6F1]/50 px-3 py-1 text-[11px] font-semibold tracking-wide text-[#8574B7] shadow-brand-sm">
            <ShieldCheck className="w-3.5 h-3.5" aria-hidden />
            {city.heroBadge}
          </span>
          <h1 className="mt-5 text-3xl sm:text-4xl font-extrabold tracking-tight leading-[1.15]">
            {city.heroHeadline}{' '}
            <span className="bg-gradient-to-r from-[#8574B7] via-[#9A93BC] to-[#B8B3D1] bg-clip-text text-transparent">
              {city.heroHighlight}
            </span>
          </h1>
          <p className="mt-4 text-sm leading-relaxed text-[#413B5E]/75 max-w-md mx-auto">{city.heroSubhead}</p>
          <div className="mt-7 flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              href="/signup"
              className="h-12 px-8 rounded-full bg-[#8574B7] hover:bg-[#534377] text-white text-sm font-semibold shadow-brand-glow transition-colors flex items-center justify-center"
            >
              Create your free profile
            </Link>
            <Link
              href="/login"
              className="h-12 px-6 rounded-full border border-[#D0CDE1] bg-white text-[#413B5E] text-sm font-medium hover:bg-[#E8E6F1]/30 transition-colors flex items-center justify-center"
            >
              I already have an account
            </Link>
          </div>
          {city.localStats && (
            <dl className="mt-8 grid grid-cols-3 gap-2">
              {[
                ['Active singles', city.localStats.activeSingles],
                ['Avg. reply', city.localStats.avgResponseTime],
                ['Verified', city.localStats.verifiedRate],
              ].map(([label, value]) => (
                <div key={label} className="rounded-2xl border border-[#D0CDE1]/60 bg-white px-2 py-3 shadow-brand-sm">
                  <dt className="text-[10px] font-semibold uppercase tracking-wider text-[#413B5E]/55">{label}</dt>
                  <dd className="mt-1 text-sm font-bold text-[#413B5E]">{value}</dd>
                </div>
              ))}
            </dl>
          )}
        </section>

        {/* Search themes */}
        <section className="py-8 border-t border-[#D0CDE1]/60" aria-labelledby="themes-heading">
          <h2 id="themes-heading" className="text-xl font-bold tracking-tight">
            {city.searchThemes.heading}
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-[#413B5E]/75">{city.searchThemes.description}</p>
          <ul className="mt-4 flex flex-wrap gap-2">
            {city.searchThemes.searchTags.map((tag) => (
              <li key={tag} className="rounded-full border border-[#D0CDE1] bg-white px-3 py-1 text-xs font-medium text-[#8574B7]">
                {tag}
              </li>
            ))}
          </ul>
        </section>

        {/* Cultural insights */}
        <section className="py-8 border-t border-[#D0CDE1]/60" aria-labelledby="insights-heading">
          <h2 id="insights-heading" className="text-xl font-bold tracking-tight">
            Dating in {city.cityName}, {city.countryName}
          </h2>
          <div className="mt-4 space-y-3">
            {city.culturalInsights.map((insight, i) => {
              const Icon = INSIGHT_ICONS[i % INSIGHT_ICONS.length];
              return (
                <article key={insight.title} className="flex gap-3 rounded-2xl border border-[#D0CDE1]/60 bg-white p-4 shadow-brand-sm">
                  <span className="w-9 h-9 shrink-0 rounded-xl bg-[#E8E6F1]/70 text-[#8574B7] flex items-center justify-center">
                    <Icon className="w-4 h-4" aria-hidden />
                  </span>
                  <div>
                    <h3 className="text-sm font-bold">{insight.title}</h3>
                    <p className="mt-1 text-[13px] leading-relaxed text-[#413B5E]/75">{insight.description}</p>
                  </div>
                </article>
              );
            })}
          </div>
        </section>

        {/* FAQ (also in the FAQPage JSON-LD) */}
        <section className="py-8 border-t border-[#D0CDE1]/60" aria-labelledby="faq-heading">
          <h2 id="faq-heading" className="text-xl font-bold tracking-tight">
            {city.cityName} dating questions
          </h2>
          <div className="mt-4 space-y-2.5">
            {city.faq.map((f) => (
              <details key={f.question} className="group rounded-2xl border border-[#D0CDE1] bg-white px-4 py-3 shadow-brand-sm">
                <summary className="cursor-pointer list-none flex items-center justify-between gap-3 text-sm font-semibold">
                  {f.question}
                  <ChevronDown className="w-4 h-4 shrink-0 text-[#B8B3D1] transition-transform group-open:rotate-180" aria-hidden />
                </summary>
                <p className="mt-2 text-[13px] leading-relaxed text-[#413B5E]/75">{f.answer}</p>
              </details>
            ))}
          </div>
        </section>

        {/* Closing CTA */}
        <section className="pt-8 pb-4 border-t border-[#D0CDE1]/60 text-center">
          <h2 className="text-xl font-bold tracking-tight">Start meeting singles in {city.cityName}</h2>
          <p className="mt-2 text-sm text-[#413B5E]/75">Free to join. Selfie verification is free for every member.</p>
          <Link
            href="/signup"
            className="mt-5 inline-flex h-12 px-8 rounded-full bg-[#8574B7] hover:bg-[#534377] text-white text-sm font-semibold shadow-brand-glow transition-colors items-center justify-center"
          >
            Create your free profile
          </Link>
          <p className="mt-6 text-[11px] text-[#413B5E]/55">
            Members must be 18 or older. <Link href="/terms" className="underline underline-offset-4">Terms</Link> ·{' '}
            <Link href="/privacy" className="underline underline-offset-4">Privacy</Link> ·{' '}
            <Link href="/safety" className="underline underline-offset-4">Safety</Link>
          </p>
        </section>
      </div>
    </main>
  );
}
