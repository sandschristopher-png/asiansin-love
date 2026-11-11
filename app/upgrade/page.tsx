import type { Metadata } from 'next';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { Check } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import { FREE_DAILY_SPARKS, PLUS_PLANS } from '@/lib/plusPlans';

export const metadata: Metadata = { title: 'Upgrade to Plus' };

/**
 * Every line here must be true in the live app. Travel limits match actions/trips.ts; Sparks,
 * country filters and read receipts match the comparison table on /plus.
 */
const UPGRADE_BENEFITS = [
  {
    title: 'Visiting Soon itinerary',
    description: 'Share confirmed travel dates up to 6 months ahead on your profile.',
  },
  {
    title: 'Multi-city trips',
    description: 'Add up to 10 upcoming stops across Asia, each with its own dates.',
  },
  {
    title: 'Unlimited daily Sparks',
    description: `Start conversations without the ${FREE_DAILY_SPARKS}-per-day limit (fair use applies).`,
  },
  {
    title: 'Country filters',
    description: 'Browse members in the countries you are visiting or planning to move to.',
  },
  {
    title: 'Read receipts',
    description: 'See when your messages have been read.',
  },
];

/** Lowest effective monthly price across the plans in lib/plusPlans.ts. */
function lowestMonthly(): string {
  const toNum = (s: string) => Number(s.replace(/[^0-9.]/g, ''));
  return PLUS_PLANS.reduce((best, p) => (toNum(p.perMonth) < toNum(best) ? p.perMonth : best), PLUS_PLANS[0].perMonth);
}

export default async function UpgradePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login?returnTo=/upgrade');
  }

  const { data: profile } = await supabase.from('profiles').select('is_plus').eq('id', user.id).maybeSingle();

  if (profile?.is_plus === true) {
    redirect('/profile');
  }

  return (
    <div className="w-full min-h-full bg-white px-4 pt-6 pb-36">
      <div className="mx-auto max-w-md">
        <div className="text-center mb-7">
          <h1 className="text-2xl font-semibold tracking-tight text-[#413B5E]">
            Meet in <span className="text-[#8574B7]">Asia</span> Plus
          </h1>
          <p className="text-sm text-slate-600 mt-2 leading-relaxed">
            Plan your trips, meet verified members before you land, and connect without daily limits.
          </p>
        </div>

        <div className="rounded-2xl border-2 border-[#8574B7] bg-white p-5 shadow-brand-sm">
          <div className="flex items-center justify-between mb-4">
            <span className="text-[10px] font-semibold uppercase tracking-wider px-2.5 py-1 bg-[#8574B7] text-white rounded-full">
              Recommended
            </span>
            <span className="text-xs font-medium text-slate-600">1, 3 or 6 months</span>
          </div>

          <div className="mb-5">
            <div className="flex items-baseline gap-1.5">
              <span className="text-xs font-medium text-slate-600">From</span>
              <span className="text-3xl font-semibold text-[#413B5E]">{lowestMonthly()}</span>
              <span className="text-sm font-medium text-slate-600">/ month</span>
            </div>
            <p className="text-xs text-slate-600 mt-1">Choose your plan on the next step. Cancel anytime in Settings.</p>
          </div>

          <ul className="border-t border-slate-200 pt-4 space-y-3.5 mb-6">
            {UPGRADE_BENEFITS.map((b) => (
              <li key={b.title} className="flex items-start gap-3">
                <Check className="w-5 h-5 text-[#8574B7] shrink-0 mt-0.5" strokeWidth={2.5} aria-hidden />
                <div>
                  <p className="text-sm font-semibold text-[#8574B7]">{b.title}</p>
                  <p className="text-xs text-slate-600 mt-0.5 leading-relaxed">{b.description}</p>
                </div>
              </li>
            ))}
          </ul>

          {/* Plan choice and Stripe checkout live on /plus (POST /api/plus/checkout). */}
          <Link
            href="/plus"
            className="w-full h-12 inline-flex items-center justify-center rounded-full bg-[#8574B7] hover:bg-[#534377] text-white text-sm font-medium transition-colors active:scale-95"
          >
            Upgrade to Plus
          </Link>
        </div>

        <p className="text-xs text-center text-slate-600 mt-6 leading-relaxed">
          Live selfie verification is free for every member on every plan, and verified profiles carry a badge.
        </p>
      </div>
    </div>
  );
}
