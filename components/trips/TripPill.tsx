'use client';

import React, { useState } from 'react';
import { Plane } from 'lucide-react';
import { TripDrawer } from '@/components/trips/TripDrawer';
import { type Trip } from '@/lib/trips';
import { tripBadgeLabel } from '@/lib/tripHubs';

/**
 * "In Manila now" / "Visiting Manila · Nov 18 – Dec 2" for one trip, "3 upcoming trips" for
 * several. Tap opens the full itinerary. Renders nothing without trips.
 */
export function TripPill({ trips }: { trips: Trip[] }) {
  const [open, setOpen] = useState(false);
  if (!trips || trips.length === 0) return null;

  const first = trips[0];
  const label =
    trips.length === 1
      ? tripBadgeLabel({ city: first.destination_city, country: first.destination_country, arrival: first.start_date, departure: first.end_date })
      : `${trips.length} upcoming trips`;

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
