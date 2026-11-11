'use client';

import React from 'react';
import { MapPin } from 'lucide-react';
import { BottomSheet as TripSheet } from '@/components/ui/BottomSheet';
import { formatTripRange, type Trip } from '@/lib/trips';

/** Read-only list of a member's upcoming stops, opened from TripPill. */
export function TripDrawer({ trips, onClose }: { trips: Trip[]; onClose: () => void }) {
  return (
    <TripSheet title="Visiting soon" onClose={onClose}>
      <ol className="mt-4 space-y-2">
        {trips.map((t) => (
          <li key={t.id} className="flex items-start gap-3 p-3 rounded-2xl border border-slate-200">
            <MapPin className="w-4 h-4 mt-0.5 shrink-0 text-[#8574B7]" aria-hidden />
            <div className="min-w-0">
              <p className="text-sm font-semibold text-[#413B5E] truncate">
                {t.destination_city}, {t.destination_country}
              </p>
              <p className="text-xs text-slate-600 mt-0.5">{formatTripRange(t.start_date, t.end_date)}</p>
            </div>
          </li>
        ))}
      </ol>
    </TripSheet>
  );
}

export default TripDrawer;
