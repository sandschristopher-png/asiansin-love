'use client';

import React from 'react';
import { MapPin } from 'lucide-react';
import { BottomSheet } from '@/components/ui/BottomSheet';
import { type Trip } from '@/lib/trips';
import { formatRange, tripStatusLabel } from '@/lib/tripHubs';

/** Read-only list of a member's upcoming trips, opened from TripPill. */
export function TripDrawer({ trips, onClose }: { trips: Trip[]; onClose: () => void }) {
  return (
    <BottomSheet title="Visiting Soon" onClose={onClose}>
      <ol className="mt-4 space-y-2">
        {trips.map((t) => (
          <li key={t.id} className="flex items-start gap-3 p-3 rounded-2xl border border-slate-200">
            <MapPin className="w-4 h-4 mt-0.5 shrink-0 text-[#8574B7]" aria-hidden />
            <div className="min-w-0 flex-1">
              <div className="flex items-start justify-between gap-2">
                <p className="text-sm font-semibold text-[#413B5E] truncate">
                  {t.destination_city}, {t.destination_country}
                </p>
                <span
                  className="shrink-0 rounded-full bg-[#8574B7]/15 px-2 py-0.5 text-[10px] font-semibold leading-none text-[#8574B7]"
                  suppressHydrationWarning
                >
                  {tripStatusLabel({ city: t.destination_city, arrival: t.start_date, departure: t.end_date })}
                </span>
              </div>
              <p className="text-xs text-slate-600 mt-0.5">{formatRange(t.start_date, t.end_date)}</p>
              {t.note && <p className="text-xs text-slate-600 mt-1 break-words">{t.note}</p>}
            </div>
          </li>
        ))}
      </ol>
    </BottomSheet>
  );
}

export default TripDrawer;
