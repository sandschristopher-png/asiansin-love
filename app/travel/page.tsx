import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowRight, ArrowUpRight } from 'lucide-react';
import { TravelHubMember } from '@/components/travel/TravelHubMember';
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

// The individual city guides live one tap away on /cities.
const GUIDES = [
  { label: 'City guides', note: 'Manila, Cebu, Bangkok, and more', href: '/cities' },
  { label: 'Safety blueprint', note: 'Meeting safely', href: '/safety' },
] as const;

// Plain outbound links, no tracking ids of our own: Travelpayouts Drive converts them into partner links for everyone,
// signed in or not (components/TravelpayoutsDrive.tsx, lib/travelpayouts.ts). Each destination must be an approved
// Drive program.
const ESSENTIALS = [
  { label: 'Flights', note: 'Compare fares', href: 'https://www.aviasales.com/' },
  { label: 'Activities & transfers', note: 'Tours, airport rides, and passes', href: 'https://www.klook.com' },
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

      <section aria-labelledby="travel-guides" className="space-y-3">
        <h2 id="travel-guides" className={sectionTitle}>
          Guides
        </h2>
        <ul className="space-y-4">
          {GUIDES.map((g) => (
            <li key={g.href}>
              <Link
                href={g.href}
                className="flex items-center justify-between gap-3 text-[#413B5E] transition-colors hover:text-[#726E97]"
              >
                <span>
                  <span className="block text-sm font-semibold">{g.label}</span>
                  <span className="block text-xs text-slate-600">{g.note}</span>
                </span>
                <ArrowRight className="h-4 w-4 shrink-0 text-[#726E97]" aria-hidden />
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
