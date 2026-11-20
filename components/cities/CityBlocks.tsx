import React from 'react';
import Link from 'next/link';
import { Plane } from 'lucide-react';
import { IceFrame } from '@/components/ui/IceFrame';
import { PUBLISHED_CITIES, cityHref } from '@/lib/cities';

/**
 * Blocks shared by every public city page, so the root hubs (/manila, /cebu, /bangkok, /phnom-penh,
 * /kuala-lumpur via app/(marketing)/[city]) and the other city pages (app/cities/[slug]) stay identical.
 */

/** Hero pair: both pills stay on one line at every width. */
export function CityHeroCtas() {
  return (
    <div className="mt-7 flex flex-row justify-center gap-3">
      <Link
        href="/signup"
        className="flex h-12 items-center justify-center whitespace-nowrap rounded-full bg-[#726E97] px-8 text-sm font-medium text-white transition-colors hover:bg-[#524E75]"
      >
        Join free
      </Link>
      <Link
        href="/login"
        className="flex h-12 items-center justify-center whitespace-nowrap rounded-full border border-[#D0CDE1] bg-white px-8 text-sm font-medium text-[#413B5E] transition-colors hover:bg-[#EAE9F2]/30"
      >
        Sign in
      </Link>
    </div>
  );
}

/** Visiting Soon callout (trip hub cities only: never advertise it for the others). */
export function VisitingSoonCallout({ cityName }: { cityName: string }) {
  return (
    <section className="py-2" aria-labelledby="travel-heading">
      <IceFrame>
        <div className="rounded-2xl bg-white p-4">
          <div className="flex items-start gap-3">
            <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#EBF3FF] text-[#3B66A8]">
              <Plane className="w-4 h-4" aria-hidden />
            </span>
            <div>
              <h2 id="travel-heading" className="text-sm font-semibold">Travelling to {cityName}?</h2>
              <p className="mt-1 text-xs leading-relaxed text-[#413B5E]/75">
                Plus members can add a Visiting Soon trip with arrival and departure dates, so people in {cityName} see you
                before you land.
              </p>
              <Link
                href="/plus?feature=trips"
                className="mt-3 inline-flex h-9 items-center rounded-full bg-[#726E97] px-4 text-xs font-medium text-white transition-colors hover:bg-[#524E75]"
              >
                See Meet in Asia Plus
              </Link>
            </div>
          </div>
        </div>
      </IceFrame>
    </section>
  );
}

/** Cross-links to the other published Southeast Asia cities, and the full directory. */
export function ExploreCities({ currentSlug }: { currentSlug: string }) {
  const others = PUBLISHED_CITIES.filter((c) => c.region === 'Southeast Asia' && c.slug !== currentSlug);
  const pill =
    'inline-flex rounded-full border border-[#D0CDE1] bg-white px-3 py-1.5 text-xs font-medium text-[#726E97] transition-colors hover:bg-[#EAE9F2]/40';
  return (
    <section className="py-8 border-t border-[#D0CDE1]/60" aria-labelledby="explore-cities-heading">
      <h2 id="explore-cities-heading" className="text-base font-semibold tracking-tight">Explore other cities</h2>
      <ul className="mt-3 flex flex-wrap gap-2">
        {others.map((c) => (
          <li key={c.slug}>
            <Link href={cityHref(c.slug)} className={pill}>
              {c.name}
            </Link>
          </li>
        ))}
        <li>
          <Link href="/cities" className={pill}>
            All cities
          </Link>
        </li>
      </ul>
    </section>
  );
}
