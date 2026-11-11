import React from 'react';
import { Award, MapPin } from 'lucide-react';

const NEW_MEMBER_MS = 7 * 24 * 60 * 60 * 1000;

/** Joined within the last 7 days. */
export function isNewMember(createdAt: string | null | undefined): boolean {
  if (!createdAt) return false;
  const t = new Date(createdAt).getTime();
  return Number.isFinite(t) && t > Date.now() - NEW_MEMBER_MS;
}

/** Emerald "New" pill (top-left of Discover cards and profile hero photos) for 7 days. */
export function NewMemberPill({ createdAt, className = '' }: { createdAt: string | null | undefined; className?: string }) {
  if (!isNewMember(createdAt)) return null;
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded-full bg-emerald-500/90 text-white text-[10px] font-semibold tracking-wider uppercase shadow-sm ${className}`}
    >
      New
    </span>
  );
}

/** GPS-confirmed location (public badge; same look on your own and other members' profiles). */
export function VerifiedLocationBadge({ title, className = '' }: { title?: string; className?: string }) {
  return (
    <span
      title={title}
      className={`inline-flex items-center gap-1.5 rounded-full border border-[#D0CDE1] bg-[#E8E6F1]/50 px-2.5 py-0.5 text-xs font-medium text-[#413B5E] shadow-brand-sm whitespace-nowrap ${className}`}
    >
      <MapPin className="text-[#8574B7] h-3.5 w-3.5" aria-hidden />
      Verified Location
    </span>
  );
}

/** Founding cohort badge: "Day 1 · #042". */
export function DayOneBadge({ number, className = '' }: { number: number | null | undefined; className?: string }) {
  if (!number || number < 1 || number > 200) return null;
  return (
    <span
      title="One of the first 200 verified members"
      className={`inline-flex items-center gap-1.5 border border-[#D0CDE1] bg-white text-[#413B5E] px-2.5 py-0.5 text-xs font-medium rounded-full shadow-brand-sm ${className}`}
    >
      <Award className="w-3.5 h-3.5 text-[#8574B7] stroke-[2.5]" />
      Day 1 · #{String(number).padStart(3, '0')}
    </span>
  );
}
