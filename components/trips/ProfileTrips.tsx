'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { TripPill } from '@/components/trips/TripPill';
import { TripPlannerModal } from '@/components/trips/TripPlannerModal';
import { fetchUpcomingTrips, type Trip } from '@/lib/trips';

/** Another member's upcoming stops (public profile): the pill alone, or nothing. */
export function MemberTrips({ userId }: { userId: string | null | undefined }) {
  const [trips, setTrips] = useState<Trip[]>([]);
  useEffect(() => {
    if (!userId) return;
    let cancelled = false;
    fetchUpcomingTrips(userId).then((t) => {
      if (!cancelled) setTrips(t);
    });
    return () => {
      cancelled = true;
    };
  }, [userId]);
  return <TripPill trips={trips} />;
}

/**
 * Your own itinerary on /profile: the pill (when you have stops) plus a "Plan a trip" /
 * "Manage trips" link that opens the planner, or the Plus paywall without Plus.
 * isPlus must come from profiles.is_plus, the flag the server actions and RLS check.
 */
export function MyTrips({ userId, isPlus }: { userId: string | null | undefined; isPlus: boolean }) {
  const [trips, setTrips] = useState<Trip[]>([]);
  const [open, setOpen] = useState(false);

  const load = useCallback(() => {
    if (!userId) return;
    fetchUpcomingTrips(userId).then(setTrips);
  }, [userId]);

  useEffect(() => {
    load();
  }, [load]);

  if (!userId) return null;

  return (
    <div className="flex flex-wrap items-center gap-2">
      <TripPill trips={trips} />
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="text-xs font-medium text-[#8574B7] hover:text-[#534377] transition-colors"
      >
        {trips.length > 0 ? 'Manage trips' : 'Plan a trip'}
      </button>
      {open && <TripPlannerModal isPlus={isPlus} trips={trips} onClose={() => setOpen(false)} onChanged={load} />}
    </div>
  );
}
