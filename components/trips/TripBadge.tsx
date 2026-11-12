'use client';

import React from 'react';
import { Plane } from 'lucide-react';
import { useLocale } from '@/components/i18n/LocaleProvider';
import { tripBadgeText } from '@/lib/tripLabels';
import { tripPhase, type TripBrief } from '@/lib/tripHubs';

/**
 * The travel indicator on Discover cards: "In Manila now" while the trip is under way, otherwise
 * "Visiting Manila · Nov 18 – Dec 2", in the member's language. Brand-purple text; `glass` sits on
 * a photo scrim (cards), `light` on the page background. Decided from the viewer's calendar day
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
      ? 'bg-white/90 text-[#8574B7] border-white/40 text-[10px] px-2 py-0.5'
      : 'bg-[#8574B7]/15 text-[#8574B7] border-transparent text-xs px-3 py-1';
  return (
    <span
      className={`inline-flex max-w-full items-center gap-1 rounded-full border font-semibold leading-none ${tone} ${className}`}
      suppressHydrationWarning
    >
      <Plane className={variant === 'glass' ? 'w-3 h-3 shrink-0' : 'w-3.5 h-3.5 shrink-0'} aria-hidden />
      <span className="truncate" suppressHydrationWarning>
        {tripBadgeText(trip, t, locale)}
      </span>
    </span>
  );
}

export default TripBadge;
