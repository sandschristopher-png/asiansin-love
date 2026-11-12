'use client';

import React, { useState } from 'react';
import { Plane } from 'lucide-react';
import { useLocale } from '@/components/i18n/LocaleProvider';
import { TripDrawer } from '@/components/trips/TripDrawer';
import { type Trip } from '@/lib/trips';
import { tripBadgeText } from '@/lib/tripLabels';

/**
 * "In Manila now" / "Visiting Manila · Nov 18 – Dec 2" for one trip, "3 upcoming trips" for
 * several, in the member's language. Tap opens the full itinerary. Renders nothing without trips.
 */
export function TripPill({ trips }: { trips: Trip[] }) {
  const [open, setOpen] = useState(false);
  const { t, locale } = useLocale();
  if (!trips || trips.length === 0) return null;

  const first = trips[0];
  const label =
    trips.length === 1
      ? tripBadgeText({ city: first.destination_city, country: first.destination_country, arrival: first.start_date, departure: first.end_date }, t, locale)
      : t('travel.upcomingTrips', { n: trips.length });

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex max-w-full items-center gap-1.5 rounded-full bg-[#8574B7]/15 px-3 py-1 text-xs font-semibold text-[#8574B7] hover:bg-[#8574B7]/25 transition-colors"
      >
        <Plane className="w-3.5 h-3.5 shrink-0" aria-hidden />
        <span className="truncate" suppressHydrationWarning>
          {label}
        </span>
      </button>
      {open && <TripDrawer trips={trips} onClose={() => setOpen(false)} />}
    </>
  );
}

export default TripPill;
