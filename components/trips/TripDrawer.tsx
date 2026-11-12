'use client';

import React from 'react';
import { MapPin } from 'lucide-react';
import { BottomSheet } from '@/components/ui/BottomSheet';
import { useLocale } from '@/components/i18n/LocaleProvider';
import { type Trip } from '@/lib/trips';
import { formatRangeLocale, tripStatusText } from '@/lib/tripLabels';

/** Read-only list of a member's upcoming trips, opened from TripPill. */
export function TripDrawer({ trips, onClose }: { trips: Trip[]; onClose: () => void }) {
  const { t, locale } = useLocale();
  return (
    <BottomSheet title={t('travel.card.title')} onClose={onClose}>
      <ol className="mt-4 space-y-2">
        {trips.map((trip) => (
          <li key={trip.id} className="flex items-start gap-3 p-3 rounded-2xl border border-slate-200">
            <MapPin className="w-4 h-4 mt-0.5 shrink-0 text-[#8574B7]" aria-hidden />
            <div className="min-w-0 flex-1">
              <div className="flex items-start justify-between gap-2">
                <p className="text-sm font-semibold text-[#413B5E] truncate">
                  {trip.destination_city}, {trip.destination_country}
                </p>
                <span
                  className="shrink-0 rounded-full bg-[#8574B7]/15 px-2 py-0.5 text-[10px] font-semibold leading-none text-[#8574B7]"
                  suppressHydrationWarning
                >
                  {tripStatusText({ city: trip.destination_city, arrival: trip.start_date, departure: trip.end_date }, t)}
                </span>
              </div>
              <p className="text-xs text-slate-600 mt-0.5">{formatRangeLocale(trip.start_date, trip.end_date, locale)}</p>
              {trip.note && <p className="text-xs text-slate-600 mt-1 break-words">{trip.note}</p>}
            </div>
          </li>
        ))}
      </ol>
    </BottomSheet>
  );
}

export default TripDrawer;
