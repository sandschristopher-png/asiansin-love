import { CityFooterLinks } from '@/components/CityFooterLinks';
import { PublicOnly } from '@/components/cities/MemberAware';
import { ChevronRight } from 'lucide-react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { BrandLogo } from '@/components/BrandLogo';
import { PUBLISHED_CITIES, cityHref } from '@/lib/cities';
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

/** Published cities grouped by country (Southeast Asia first), each country in the order its first city is listed. */
const COUNTRIES = (() => {
  const regionRank = (r: string) => (r === 'Southeast Asia' ? 0 : 1);
  const byCountry = new Map<string, { country: string; rank: number; cities: typeof PUBLISHED_CITIES }>();
  for (const c of PUBLISHED_CITIES) {
    const group = byCountry.get(c.country) ?? { country: c.country, rank: regionRank(c.region), cities: [] };
    group.cities = [...group.cities, c];
    byCountry.set(c.country, group);
  }
  return [...byCountry.values()].sort((a, b) => a.rank - b.rank);
})();

export default function CitiesIndexPage() {
  return (
    <main className="min-h-[100dvh] bg-white text-[#413B5E] overflow-x-hidden">
      {/* Signed-in members get the app's own header and tab bar instead (components/LayoutShell). */}
      <PublicOnly>
        <header className="px-5 pt-6 flex items-center justify-between max-w-xl mx-auto">
          <BrandLogo href="/" size="sm" />
          <Link href="/login" className="text-xs font-medium text-[#726E97] hover:text-[#413B5E] transition-colors">
            Sign in
          </Link>
        </header>
      </PublicOnly>

      <div className="max-w-xl mx-auto px-4 pb-[calc(3rem+env(safe-area-inset-bottom))]">
        {/* The signed-in header is already right above: the breadcrumb is for visitors. */}
        <PublicOnly>
          <nav aria-label="Breadcrumb" className="pt-6 text-xs text-slate-600">
            <ol className="flex items-center gap-1.5">
              <li><Link href="/" className="hover:text-[#726E97]">Meet in Asia</Link></li>
              <li aria-hidden>/</li>
              <li aria-current="page" className="text-[#413B5E] font-medium">Cities</li>
            </ol>
          </nav>
        </PublicOnly>

        <section className="pt-8 pb-6">
          <h1 className="text-3xl font-semibold tracking-tight leading-[1.15]">
            Dating in <span className="text-[#726E97]">Asia&apos;s cities</span>
          </h1>
          <p className="mt-4 text-sm leading-relaxed text-[#413B5E]/75">
            Pick a city for local dating tips, the areas people choose for a first meeting, and answers to common questions.
          </p>
        </section>

        <div className="space-y-8">
          {COUNTRIES.map(({ country, cities }) => {
            const id = `country-${country.replace(/s+/g, '-').toLowerCase()}`;
            return (
              <section key={country} aria-labelledby={id}>
                <h2 id={id} className="text-xs font-semibold uppercase tracking-wider text-slate-600">
                  {country}
                </h2>
                <ul className="mt-2 space-y-1">
                  {cities.map((c) => (
                    <li key={c.slug}>
                      <Link
                        href={cityHref(c.slug)}
                        className="-mx-3 flex items-center justify-between gap-3 rounded-2xl px-3 py-2.5 text-[#413B5E] transition-colors hover:bg-[#EAE9F2]/50"
                      >
                        <span className="min-w-0">
                          <span className="block text-sm font-semibold">{c.name}</span>
                          <span className="block truncate text-xs text-slate-600">{c.heroTagline}</span>
                        </span>
                        <ChevronRight className="h-4 w-4 shrink-0 text-[#726E97]" aria-hidden />
                      </Link>
                    </li>
                  ))}
                </ul>
              </section>
            );
          })}
        </div>

        <footer className="pt-10 text-center">
          <CityFooterLinks />
        </footer>
      </div>
    </main>
  );
}
