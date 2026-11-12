'use client';

import React, { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { Loader2, Pencil, Plus, Trash2 } from 'lucide-react';
import { deleteTrip } from '@/actions/trips';
import { PlusBadge } from '@/components/ui/PlusBadge';
import { TripBadge } from '@/components/trips/TripBadge';
import { TripPill } from '@/components/trips/TripPill';
import { TripPlannerModal } from '@/components/trips/TripPlannerModal';
import { MAX_UPCOMING_TRIPS, formatRange, isoToday, tripStatusLabel } from '@/lib/tripHubs';
import { fetchUpcomingTrips, type Trip } from '@/lib/trips';

/** Another member's upcoming trips (public profile): the pill alone, or nothing. */
export function MemberTrips({ userId }: { userId: string | null | undefined }) {
  const [trips, setTrips] = useState<Trip[]>([]);
  useEffect(() => {
    if (!userId) return;
    let cancelled = false;
    fetchUpcomingTrips(userId).then((t) => {
      if (!cancelled) setTrips(t);
    });
    return () => {
      cancelled = true;
    };
  }, [userId]);
  return <TripPill trips={trips} />;
}

/**
 * Your own "Visiting Soon" card on /profile. Plus: up to 3 upcoming trips with status, edit and
 * delete, and an add button. Free: a preview of how a trip shows on Discover, and a path to
 * /upgrade. isPlus must come from profiles.is_plus, the flag the server action and RLS check.
 */
export function MyTrips({ userId, isPlus }: { userId: string | null | undefined; isPlus: boolean }) {
  const [trips, setTrips] = useState<Trip[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [sheet, setSheet] = useState<{ trip: Trip | null } | null>(null);
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(() => {
    if (!userId) return;
    fetchUpcomingTrips(userId).then((t) => {
      setTrips(t);
      setLoaded(true);
    });
  }, [userId]);

  useEffect(() => {
    load();
  }, [load]);

  if (!userId) return null;

  const atLimit = trips.length >= MAX_UPCOMING_TRIPS;

  const remove = async (id: string) => {
    setBusyId(id);
    setError(null);
    try {
      const res = await deleteTrip(id);
      if (!res.success) setError(res.error || 'Could not remove this trip.');
      else {
        setConfirmId(null);
        load();
      }
    } catch {
      setError('Could not reach the server. Check your connection and try again.');
    } finally {
      setBusyId(null);
    }
  };

  return (
    <section aria-label="Visiting Soon" className="w-full rounded-2xl border border-slate-200 bg-white p-4 space-y-3">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 className="font-brand text-sm font-semibold text-[#413B5E]">Visiting Soon</h2>
          <p className="mt-0.5 text-xs leading-relaxed text-slate-600">
            Let members in your destination see when you arrive.
          </p>
        </div>
        {isPlus ? (
          <button
            type="button"
            onClick={() => setSheet({ trip: null })}
            disabled={atLimit}
            className="shrink-0 inline-flex h-8 items-center gap-1 rounded-full bg-[#8574B7] px-3 text-xs font-medium text-white transition-colors hover:bg-[#534377] disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Plus className="w-3.5 h-3.5" aria-hidden />
            Add trip
          </button>
        ) : (
          <PlusBadge />
        )}
      </div>

      {error && <p className="text-xs font-medium text-red-600">{error}</p>}

      {isPlus ? (
        !loaded ? null : trips.length === 0 ? (
          <p className="rounded-xl border border-dashed border-[#D0CDE1] p-3 text-xs text-slate-600">
            No upcoming trips. Add one to appear as Visiting Soon in your destination.
          </p>
        ) : (
          <>
            <ul className="space-y-2">
              {trips.map((t) => (
                <li key={t.id} className="rounded-xl border border-slate-200 p-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-[#413B5E]">
                        {t.destination_city}, {t.destination_country}
                      </p>
                      <p className="mt-0.5 text-xs text-slate-600">{formatRange(t.start_date, t.end_date)}</p>
                    </div>
                    <span
                      className="shrink-0 rounded-full bg-[#8574B7]/15 px-2 py-0.5 text-[10px] font-semibold leading-none text-[#8574B7]"
                      suppressHydrationWarning
                    >
                      {tripStatusLabel({ city: t.destination_city, arrival: t.start_date, departure: t.end_date }, isoToday())}
                    </span>
                  </div>
                  {t.note && <p className="mt-1.5 break-words text-xs text-slate-600">{t.note}</p>}
                  <div className="mt-2 flex items-center gap-4">
                    <button
                      type="button"
                      onClick={() => setSheet({ trip: t })}
                      className="inline-flex items-center gap-1 text-xs font-medium text-[#8574B7] transition-colors hover:text-[#534377]"
                    >
                      <Pencil className="w-3.5 h-3.5" aria-hidden />
                      Edit
                    </button>
                    {confirmId === t.id ? (
                      <span className="inline-flex items-center gap-3 text-xs">
                        <button
                          type="button"
                          onClick={() => remove(t.id)}
                          disabled={busyId === t.id}
                          className="inline-flex items-center gap-1 font-semibold text-red-600 disabled:opacity-50"
                        >
                          {busyId === t.id && <Loader2 className="w-3.5 h-3.5 animate-spin" aria-hidden />}
                          Confirm delete
                        </button>
                        <button type="button" onClick={() => setConfirmId(null)} className="font-medium text-slate-600">
                          Cancel
                        </button>
                      </span>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setConfirmId(t.id)}
                        className="inline-flex items-center gap-1 text-xs font-medium text-slate-600 transition-colors hover:text-red-600"
                      >
                        <Trash2 className="w-3.5 h-3.5" aria-hidden />
                        Delete
                      </button>
                    )}
                  </div>
                </li>
              ))}
            </ul>
            <p className="text-[11px] text-slate-500">
              {trips.length} of {MAX_UPCOMING_TRIPS} upcoming trips
            </p>
          </>
        )
      ) : (
        <div className="space-y-3">
          <div className="rounded-xl border border-dashed border-[#D0CDE1] bg-slate-50/60 p-3 space-y-2">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-600">Example on Discover</p>
            <TripBadge
              variant="light"
              trip={{ city: 'Cebu City', country: 'Philippines', arrival: isoToday(14), departure: isoToday(19) }}
            />
            <p className="text-xs leading-relaxed text-slate-600">
              Plus members show this on their card to members in their destination, before they land.
            </p>
          </div>
          <Link
            href="/upgrade"
            aria-label="Upgrade to Plus"
            className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-full border border-[#8574B7] bg-white text-sm font-medium text-[#8574B7] transition-colors hover:bg-[#8574B7]/10 active:scale-95"
          >
            <span>Upgrade to</span>
            <span aria-hidden="true">
              <PlusBadge />
            </span>
          </Link>
        </div>
      )}

      {sheet && (
        <TripPlannerModal isPlus={isPlus} trip={sheet.trip} onClose={() => setSheet(null)} onSaved={load} />
      )}
    </section>
  );
}
