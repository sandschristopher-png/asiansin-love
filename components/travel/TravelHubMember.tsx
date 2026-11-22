'use client';

import React, { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { Plus } from 'lucide-react';
import { CardPhoto } from '@/components/CardPhoto';
import { useLocale } from '@/components/i18n/LocaleProvider';
import { MyTrips } from '@/components/VisitingSoonSection';
import { TripPlannerModal } from '@/components/trips/TripPlannerModal';
import { supabase } from '@/lib/supabase/client';
import { isPlusProfile } from '@/lib/plus';
import { viewerHub, visitingHref } from '@/lib/travelHub';
import { formatRangeLocale } from '@/lib/tripLabels';
import { type TripBrief } from '@/lib/tripHubs';

type Me = { id: string; hub: string | null; isPlus: boolean };
type Arrival = { id: string; name: string; age: number; avatarUrl: string; trip: TripBrief };

const PREVIEW_COUNT = 10;

const outlinePill =
  'inline-flex h-8 shrink-0 items-center gap-1 rounded-full border border-[#D0CDE1] bg-white px-3 text-xs font-medium text-[#726E97] transition-colors hover:bg-[#EAE9F2]/50 active:scale-95';

/**
 * The signed-in half of /travel. It reads the member's city once and adapts:
 *   - inside an Asia hub (lib/metroAreas.ts, so Taguig counts as Manila): "Visiting <hub> Soon", a row of members
 *     with an upcoming trip there, "See all", and a quiet "Add a trip" pill for locals who are travelling;
 *   - anywhere else: "My Trips" (add, edit, remove) with the optional travel intent pills.
 * Signed-out visitors get nothing from this component; the rest of the page is for everyone.
 */
export function TravelHubMember() {
  const { t, locale } = useLocale();
  const [state, setState] = useState<'loading' | 'out' | 'ready'>('loading');
  const [me, setMe] = useState<Me | null>(null);
  const [arrivals, setArrivals] = useState<Arrival[] | null>(null);
  const [sheet, setSheet] = useState(false);
  const [tripsKey, setTripsKey] = useState(0);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (cancelled) return;
      if (!session) {
        setState('out');
        return;
      }
      const { data } = await supabase
        .from('profiles')
        .select('city, is_plus, is_premium, subscription_status, current_period_end, plus_expires_at')
        .eq('id', session.user.id)
        .maybeSingle();
      if (cancelled) return;
      setMe({ id: session.user.id, hub: viewerHub(data?.city), isPlus: isPlusProfile(data) });
      setState('ready');
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  // Who is arriving in the member's own hub: every signed-in member sees this row (preview=travel lets the server
  // apply the hub filter to a free member's own hub only). Whose trips appear is unchanged: only Plus members' trips
  // are public, and adding a trip stays Plus. "See all" opens Discover's hub filter, which is Plus.
  const hub = me?.hub ?? null;
  const isPlus = Boolean(me?.isPlus);
  useEffect(() => {
    if (!hub) return;
    let cancelled = false;
    fetch(`/api/discover?visiting=${encodeURIComponent(hub)}&preview=travel`)
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (cancelled) return;
        const rows: Arrival[] = (Array.isArray(d?.profiles) ? d.profiles : [])
          .filter((p: { trip?: TripBrief | null }) => p.trip)
          .slice(0, PREVIEW_COUNT)
          .map((p: { id: string; name: string; age: number; avatarUrl: string; trip: TripBrief }) => ({
            id: p.id,
            name: p.name,
            age: p.age,
            avatarUrl: p.avatarUrl,
            trip: p.trip,
          }));
        setArrivals(rows);
      })
      .catch(() => {
        if (!cancelled) setArrivals([]);
      });
    return () => {
      cancelled = true;
    };
  }, [hub]);

  const refreshTrips = useCallback(() => setTripsKey((n) => n + 1), []);

  if (state === 'out') return null;
  if (state === 'loading' || !me) {
    return (
      <div aria-hidden className="space-y-3">
        <div className="h-5 w-48 rounded-full bg-[#F6F4FB] ail-shimmer" />
        <div className="h-40 w-full rounded-3xl bg-[#F6F4FB] ail-shimmer" />
      </div>
    );
  }

  // Outside the hubs: My Trips and the intent pills.
  if (!hub) {
    return <MyTrips userId={me.id} isPlus={me.isPlus} showIntent />;
  }

  return (
    <>
      <section aria-labelledby="travel-visiting" className="space-y-3">
        <div className="flex items-center justify-between gap-3">
          <h2 id="travel-visiting" className="font-brand min-w-0 truncate text-base font-semibold tracking-tight text-[#413B5E]">
            {t('travelHub.visitingSoon', { hub })}
          </h2>
          <div className="flex shrink-0 items-center gap-3">
            {isPlus && arrivals && arrivals.length > 0 && (
              <Link href={visitingHref(hub)} className="text-xs font-medium text-[#726E97] transition-colors hover:text-[#524E75]">
                {t('travelHub.seeAll')}
              </Link>
            )}
            <button type="button" onClick={() => setSheet(true)} className={outlinePill}>
              <Plus className="h-3.5 w-3.5" aria-hidden />
              {t('travelHub.addTrip')}
            </button>
          </div>
        </div>

        {arrivals === null ? (
          <div aria-hidden className="flex gap-3 overflow-hidden">
            {[0, 1, 2].map((i) => (
              <div key={i} className="aspect-[3/4] w-28 shrink-0 rounded-2xl bg-[#F6F4FB] ail-shimmer" />
            ))}
          </div>
        ) : arrivals.length === 0 ? (
          <p className="text-xs leading-relaxed text-slate-600">{t('travelHub.nobody', { hub })}</p>
        ) : (
          <ul className="no-scrollbar -mx-4 flex gap-3 overflow-x-auto px-4 pb-1">
            {arrivals.map((a) => (
              <li key={a.id} className="w-28 shrink-0">
                <Link href={`/profile/${a.id}`} className="block">
                  <div className="relative aspect-[3/4] w-full overflow-hidden rounded-2xl border border-[#E6E2F0] bg-[#F6F4FB]">
                    <CardPhoto src={a.avatarUrl} alt={a.name} sizes="112px" />
                  </div>
                  <p className="mt-1.5 truncate text-sm font-semibold text-[#413B5E]">
                    {a.name}, {a.age}
                  </p>
                  <p className="truncate text-[11px] text-slate-600" suppressHydrationWarning>
                    {formatRangeLocale(a.trip.arrival, a.trip.departure, locale)}
                  </p>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* Your own trips, once you have one: edit or remove them here (the pill above adds). */}
      <MyTrips key={tripsKey} userId={me.id} isPlus={me.isPlus} hideWhenEmpty />

      {sheet && (
        <TripPlannerModal
          isPlus={me.isPlus}
          trip={null}
          onClose={() => setSheet(false)}
          onSaved={() => {
            setSheet(false);
            refreshTrips();
          }}
        />
      )}
    </>
  );
}

export default TravelHubMember;
