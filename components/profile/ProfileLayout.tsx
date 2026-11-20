import React from 'react';
import Link from 'next/link';
import { ShieldCheck } from 'lucide-react';
import { reputationTokens } from '@/lib/utils/reputation';

/**
 * Shared pieces of the flat member profile (/profile and /profile/[id]): sections sit on one continuous white
 * surface, separated by hairlines instead of stacked bordered cards. Cards are kept only for distinct interactive
 * blocks (Visiting Soon trips, Voice Intro, Highlights stories).
 */

/** One profile section: small purple title, content, hairline underneath. */
export function ProfileSection({
  title,
  icon,
  aside,
  children,
  className = '',
}: {
  title?: React.ReactNode;
  icon?: React.ReactNode;
  aside?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section className={`space-y-3 border-b border-gray-100 py-5 ${className}`}>
      {(title || aside) && (
        <div className="flex items-center justify-between gap-2">
          <h2
            className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-[#726E97]"
            style={{ fontFamily: 'var(--font-brand)' }}
          >
            {icon}
            {title}
          </h2>
          {aside}
        </div>
      )}
      {children}
    </section>
  );
}

/** The soft lavender tag used for Interests, Lifestyle and Languages, so all three read as one family. */
export const PROFILE_TAG =
  'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#EAE9F2]/60 border border-[#D0CDE1] text-xs font-semibold text-[#726E97]';

/** The same tag with a purple edge: an interest you share with the person looking. */
export const PROFILE_TAG_SHARED =
  'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#726E97]/10 border border-[#726E97] text-xs font-semibold text-[#726E97]';

/** "100% Reputation" in the badge row under the location. Tapping it opens the "What's this?" explanation. */
export function ReputationPill({ score }: { score: number }) {
  const t = reputationTokens(score);
  return (
    <Link
      href="/profile/reputation"
      aria-label={`Reputation ${t.percent}. What's this?`}
      title="What's this?"
      className={`inline-flex shrink-0 items-center gap-1 whitespace-nowrap rounded-full px-2.5 py-0.5 text-xs font-semibold transition-opacity hover:opacity-80 ${t.light.container} ${t.light.text}`}
    >
      <ShieldCheck className={`h-3.5 w-3.5 ${t.light.icon}`} aria-hidden />
      <span className="leading-none tabular-nums">{t.percent} Reputation</span>
    </Link>
  );
}
