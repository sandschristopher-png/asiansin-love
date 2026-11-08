import React from 'react';
import { Plane } from 'lucide-react';

export interface TravelNotice {
  city: string;
  country?: string | null;
  dates?: string | null;
}

/** "✈️ Visiting: Cebu in December 2026" (Plus travel notice) on Discover cards and profiles. */
export function VisitingBadge({
  travel,
  variant = 'light',
  className = '',
}: {
  travel: TravelNotice | null | undefined;
  /** `glass` sits on a photo scrim (Discover cards); `light` on the page background. */
  variant?: 'light' | 'glass';
  className?: string;
}) {
  if (!travel?.city) return null;
  const label = `Visiting: ${travel.city}${travel.dates ? ` in ${travel.dates}` : ''}`;
  const tone =
    variant === 'glass'
      ? 'bg-white/90 text-[#413B5E] border-white/40 text-[10px] px-2 py-0.5'
      : 'bg-[#E8E6F1]/60 text-[#413B5E] border-[#8574B7]/20 text-xs px-3 py-1';
  return (
    <span
      title={travel.country ? `${label}, ${travel.country}` : label}
      className={`inline-flex items-center gap-1 max-w-full rounded-full border font-semibold shadow-sm ${tone} ${className}`}
    >
      <Plane className="w-3 h-3 shrink-0" aria-hidden />
      <span className="truncate">{label}</span>
    </span>
  );
}

export default VisitingBadge;
