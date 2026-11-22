import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowUpRight } from 'lucide-react';
import { TravelHubMember } from '@/components/travel/TravelHubMember';
import { EXPLORE_HUBS, visitingHref } from '@/lib/travelHub';
import { SITE_URL } from '@/lib/seo/cityData';

const TITLE = 'Travel Hub | Meet in Asia';
const DESCRIPTION =
  'Plan a trip to Manila, Cebu, Bangkok, Phnom Penh, Kuala Lumpur or Ho Chi Minh City, see who is arriving in your city, and read the city and safety guides before you go.';

export const metadata: Metadata = {
  title: { absolute: TITLE },
  description: DESCRIPTION,
  alternates: { canonical: `${SITE_URL}/travel` },
  robots: { index: true, follow: true },
  openGraph: {
    type: 'website',
    url: `${SITE_URL}/travel`,
    siteName: 'Meet in Asia',
    title: TITLE,
    description: DESCRIPTION,
    locale: 'en_US',
    images: [{ url: '/Landing-Woman.png', width: 1024, height: 687, alt: 'Meet in Asia' }],
  },
  twitter: { card: 'summary_large_image', title: TITLE, description: DESCRIPTION, images: ['/Landing-Woman.png'] },
};

const GUIDES = [
  { name: 'Manila', note: 'Philippines', href: '/manila' },
  { name: 'Cebu', note: 'Philippines', href: '/cebu' },
  { name: 'Bangkok', note: 'Thailand', href: '/bangkok' },
  { name: 'Phnom Penh', note: 'Cambodia', href: '/phnom-penh' },
  { name: 'Kuala Lumpur', note: 'Malaysia', href: '/kuala-lumpur' },
  { name: 'Safety blueprint', note: 'Meeting safely', href: '/safety' },
] as const;

// Plain outbound links, no tracking ids of our own: Travelpayouts Drive converts them for signed-out visitors
// (components/TravelpayoutsDrive.tsx), and signed-in members just get the ordinary link.
const ESSENTIALS = [
  { label: 'Flights', note: 'Compare fares', href: 'https://www.aviasales.com/' },
  { label: 'Hotels', note: 'Find a place to stay', href: 'https://www.booking.com/' },
  { label: 'eSIMs', note: 'Data from landing', href: 'https://www.airalo.com/' },
] as const;

const sectionTitle = 'font-brand text-base font-semibold tracking-tight text-[#413B5E]';

export default function TravelPage() {
  return (
    <div className="w-full space-y-9 px-4 pb-32 pt-3">
      <p className="text-sm leading-relaxed text-slate-600">
        Plan a trip to Asia, see who is arriving in your city, and read the guides before you go.
      </p>

      {/* Signed-in members only: who is arriving in their hub, or their own trips. Renders nothing signed out. */}
      <TravelHubMember />

      <section aria-labelledby="travel-hubs" className="space-y-3">
        <h2 id="travel-hubs" className={sectionTitle}>
          Explore hubs
        </h2>
        <ul className="flex flex-wrap gap-2">
          {EXPLORE_HUBS.map((h) => (
            <li key={h.hub}>
              <Link
                href={visitingHref(h.hub)}
                className="inline-flex h-9 items-center whitespace-nowrap rounded-full border border-[#D0CDE1] bg-white px-4 text-sm font-medium text-[#726E97] transition-colors hover:bg-[#EAE9F2]/50 active:scale-95"
              >
                {h.label}
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <section aria-labelledby="travel-guides" className="space-y-3">
        <h2 id="travel-guides" className={sectionTitle}>
          City guides and safety
        </h2>
        <ul className="grid grid-cols-2 gap-3">
          {GUIDES.map((g) => (
            <li key={g.href}>
              <Link
                href={g.href}
                className="block h-full rounded-2xl border border-[#D0CDE1] bg-white p-4 transition-colors hover:bg-[#EAE9F2]/30"
              >
                <span className="block text-sm font-semibold text-[#413B5E]">{g.name}</span>
                <span className="mt-0.5 block text-xs text-slate-600">{g.note}</span>
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <section aria-labelledby="travel-essentials" className="space-y-3">
        <h2 id="travel-essentials" className={sectionTitle}>
          Travel essentials
        </h2>
        <ul className="space-y-4">
          {ESSENTIALS.map((e) => (
            <li key={e.label}>
              <a
                href={e.href}
                target="_blank"
                rel="sponsored noopener noreferrer"
                className="flex items-center justify-between gap-3 text-[#413B5E] transition-colors hover:text-[#726E97]"
              >
                <span>
                  <span className="block text-sm font-semibold">{e.label}</span>
                  <span className="block text-xs text-slate-600">{e.note}</span>
                </span>
                <ArrowUpRight className="h-4 w-4 shrink-0 text-[#726E97]" aria-hidden />
              </a>
            </li>
          ))}
        </ul>
        <p className="text-[11px] leading-relaxed text-slate-600">Partner links. We may earn a commission at no cost to you.</p>
      </section>
    </div>
  );
}
