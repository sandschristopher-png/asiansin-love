'use client';

import React, { useState } from 'react';
import { Plane } from 'lucide-react';
import { TripDrawer } from '@/components/trips/TripDrawer';
import { formatTripRange, type Trip } from '@/lib/trips';

/**
 * "Visiting Cebu · Nov 28 - Dec 3" for one stop, "3 upcoming stops" for several. Tap opens the
 * full itinerary. Same look as VisitingBadge (light variant). Renders nothing without trips.
 */
export function TripPill({ trips }: { trips: Trip[] }) {
  const [open, setOpen] = useState(false);
  if (!trips || trips.length === 0) return null;

  const first = trips[0];
  const label =
    trips.length === 1
      ? `Visiting ${first.destination_city} · ${formatTripRange(first.start_date, first.end_date)}`
      : `${trips.length} upcoming stops`;

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex max-w-full items-center gap-1.5 rounded-full border border-[#8574B7]/20 bg-[#E8E6F1]/60 px-3 py-1 text-xs font-medium text-[#413B5E] hover:bg-[#E8E6F1] transition-colors"
      >
        <Plane className="w-3.5 h-3.5 shrink-0 text-[#8574B7]" aria-hidden />
        <span className="truncate">{label}</span>
      </button>
      {open && <TripDrawer trips={trips} onClose={() => setOpen(false)} />}
    </>
  );
}

export default TripPill;
