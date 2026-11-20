import { CityFooterLinks } from '@/components/CityFooterLinks';
import type { Metadata } from 'next';
import Link from 'next/link';
import { BrandLogo } from '@/components/BrandLogo';
import { PUBLISHED_CITIES, cityHref, type City } from '@/lib/cities';
import { SITE_URL } from '@/lib/seo/cityData';

const TITLE = 'Dating Cities in Asia | Meet in Asia';
const DESCRIPTION =
  'Browse Meet in Asia city guides for Manila, Bangkok, Hanoi, Singapore and more. Local dating tips, first-date areas and answers to common questions.';

export const metadata: Metadata = {
  title: { absolute: TITLE },
  description: DESCRIPTION,
  alternates: { canonical: `${SITE_URL}/cities` },
  robots: { index: true, follow: true },
  openGraph: {
    type: 'website',
    url: `${SITE_URL}/cities`,
    siteName: 'Meet in Asia',
    title: TITLE,
    description: DESCRIPTION,
    locale: 'en_US',
    images: [{ url: '/Landing-Woman.png', width: 1024, height: 687, alt: 'Meet in Asia' }],
  },
  twitter: { card: 'summary_large_image', title: TITLE, description: DESCRIPTION, images: ['/Landing-Woman.png'] },
};

const REGIONS: City['region'][] = ['Southeast Asia', 'East Asia'];

export default function CitiesIndexPage() {
  return (
    <main className="min-h-[100dvh] bg-white text-[#413B5E] overflow-x-hidden">
      <header className="px-5 pt-6 flex items-center justify-between max-w-xl mx-auto">
        <BrandLogo href="/" size="sm" />
        <Link href="/login" className="text-xs font-medium text-[#8574B7] hover:text-[#413B5E] transition-colors">
          Sign in
        </Link>
      </header>

      <div className="max-w-xl mx-auto px-4 pb-[calc(3rem+env(safe-area-inset-bottom))]">
        <nav aria-label="Breadcrumb" className="pt-6 text-xs text-slate-600">
          <ol className="flex items-center gap-1.5">
            <li><Link href="/" className="hover:text-[#8574B7]">Meet in Asia</Link></li>
            <li aria-hidden>/</li>
            <li aria-current="page" className="text-[#413B5E] font-medium">Cities</li>
          </ol>
        </nav>

        <section className="pt-8 pb-6">
          <h1 className="text-3xl font-semibold tracking-tight leading-[1.15]">
            Dating in <span className="text-[#8574B7]">Asia&apos;s cities</span>
          </h1>
          <p className="mt-4 text-sm leading-relaxed text-[#413B5E]/75">
            Pick a city for local dating tips, the areas people choose for a first meeting, and answers to common questions.
          </p>
        </section>

        {REGIONS.map((region) => {
          const cities = PUBLISHED_CITIES.filter((c) => c.region === region);
          if (cities.length === 0) return null;
          return (
            <section key={region} className="py-6 border-t border-[#D0CDE1]/60" aria-labelledby={`region-${region.replace(/\s+/g, '-').toLowerCase()}`}>
              <h2 id={`region-${region.replace(/\s+/g, '-').toLowerCase()}`} className="text-base font-semibold tracking-tight">
                {region}
              </h2>
              <ul className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-3">
                {cities.map((c) => (
                  <li key={c.slug}>
                    <Link
                      href={cityHref(c.slug)}
                      className="block rounded-2xl border border-[#D0CDE1]/60 bg-white p-4 shadow-sm hover:border-[#8574B7]/40 transition-colors"
                    >
                      <span className="block text-sm font-semibold text-[#413B5E]">{c.name}</span>
                      <span className="mt-0.5 block text-xs text-slate-600">{c.country}</span>
                      <span className="mt-2 block text-xs leading-relaxed text-[#413B5E]/75">{c.heroTagline}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          );
        })}

        <footer className="pt-8 border-t border-[#D0CDE1]/60 text-center">
          <CityFooterLinks />
        </footer>
      </div>
    </main>
  );
}
