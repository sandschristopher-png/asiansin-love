import React from 'react';
import { Award, ShieldCheck } from 'lucide-react';

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
      className={`inline-flex items-center px-2 py-0.5 rounded-full bg-emerald-500/90 text-white text-[10px] font-bold tracking-wider uppercase shadow-sm ${className}`}
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
      className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-white/90 text-[11px] font-semibold text-[#2D264B] shadow-sm border border-white/40 whitespace-nowrap ${className}`}
    >
      <ShieldCheck className="w-3 h-3 text-[#6555B8] stroke-[2.5]" />
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
      className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-50/80 border border-[#6555B8]/25 text-[#2D264B] text-xs font-semibold shadow-sm ${className}`}
    >
      <Award className="w-3.5 h-3.5 text-[#6555B8] stroke-[2.5]" />
      Day 1 · #{String(number).padStart(3, '0')}
    </span>
  );
}
