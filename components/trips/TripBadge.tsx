'use client';

import React from 'react';
import { useLocale } from '@/components/i18n/LocaleProvider';
import { tripBadgeText } from '@/lib/tripLabels';
import { tripPhase, type TripBrief } from '@/lib/tripHubs';

/**
 * The travel indicator on Discover cards: "In Manila now" while the trip is under way, otherwise
 * "Visiting Manila · Nov 18 – Dec 2", in the member's language. A quiet periwinkle pill (#EAE9F2 wash, #524E75
 * text at 6.4:1, #726E97 at 20% for the edge) with no icon; `glass` sits on a photo scrim (cards), `light` on the
 * page background. Decided from the viewer's calendar day
 * when it renders, so a cached card never shows a stale "arriving" label.
 */
export function TripBadge({
  trip,
  variant = 'glass',
  className = '',
}: {
  trip: TripBrief | null | undefined;
  variant?: 'light' | 'glass';
  className?: string;
}) {
  const { t, locale } = useLocale();
  if (!trip?.city || tripPhase(trip) === 'past') return null;
  const tone =
    variant === 'glass'
      ? 'bg-[#EAE9F2]/95 text-[#524E75] border-[#726E97]/20 text-[10px] px-2 py-0.5'
      : 'bg-[#EAE9F2] text-[#524E75] border-[#726E97]/20 text-xs px-3 py-1';
  return (
    <span
      className={`inline-flex max-w-full items-center rounded-full border font-semibold leading-none ${tone} ${className}`}
      suppressHydrationWarning
    >
      <span className="truncate" suppressHydrationWarning>
        {tripBadgeText(trip, t, locale)}
      </span>
    </span>
  );
}

export default TripBadge;
