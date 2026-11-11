'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Loader2, Trash2 } from 'lucide-react';
import { createTrip, deleteTrip } from '@/actions/trips';
import { BottomSheet as TripSheet } from '@/components/ui/BottomSheet';
import { MAX_DAYS_AHEAD, formatTripRange, localIsoDate, type Trip } from '@/lib/trips';

const FIELD =
  'w-full px-3.5 py-2.5 rounded-xl bg-white border border-[#D0CDE1] text-sm text-[#413B5E] placeholder:text-slate-400 focus:outline-none focus:border-[#8574B7]';
const LABEL = 'block text-[11px] font-semibold uppercase tracking-wider text-slate-600 mb-1.5';

/**
 * Manage the "Visiting Soon" itinerary. Members without Plus get the paywall instead of the form;
 * the server actions and RLS enforce the same rule, so this gate is only the friendly front door.
 */
export function TripPlannerModal({
  isPlus,
  trips,
  onClose,
  onChanged,
}: {
  isPlus: boolean;
  trips: Trip[];
  onClose: () => void;
  /** Called after a trip is added or removed so the caller can reload the list. */
  onChanged: () => void;
}) {
  const [city, setCity] = useState('');
  const [country, setCountry] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  if (!isPlus) {
    return (
      <TripSheet title="Plan a trip" onClose={onClose}>
        <div className="pt-5 text-center">
          <span className="inline-block text-[10px] font-semibold uppercase tracking-wider px-2.5 py-1 bg-[#8574B7] text-white rounded-full">
            Plus feature
          </span>
          <h3 className="text-lg font-semibold text-[#413B5E] mt-3">Travel Mode is locked</h3>
          <p className="text-sm text-slate-600 mt-2 leading-relaxed">
            Schedule your upcoming trips so members in your destination can see when you are visiting, and start
            talking before you land.
          </p>
        </div>
        <div className="mt-6 flex flex-col items-center gap-3">
          <Link
            href="/upgrade"
            className="w-full h-12 inline-flex items-center justify-center rounded-full bg-[#8574B7] hover:bg-[#534377] text-white text-sm font-medium transition-colors active:scale-95"
          >
            Upgrade to Plus
          </Link>
          <button type="button" onClick={onClose} className="text-sm font-medium text-slate-600 hover:text-[#413B5E]">
            Maybe later
          </button>
        </div>
      </TripSheet>
    );
  }

  const today = localIsoDate();
  const latestStart = localIsoDate(MAX_DAYS_AHEAD);

  const addTrip = async (e: React.FormEvent) => {
    e.preventDefault();
    if (saving) return;
    setError(null);
    setSaving(true);
    try {
      const res = await createTrip({ destinationCity: city, destinationCountry: country, startDate, endDate });
      if (!res.success) {
        setError(res.error || 'Could not save your trip. Please try again.');
        return;
      }
      setCity('');
      setCountry('');
      setStartDate('');
      setEndDate('');
      onChanged();
    } catch {
      setError('Could not reach the server. Check your connection and try again.');
    } finally {
      setSaving(false);
    }
  };

  const removeTrip = async (id: string) => {
    if (deletingId) return;
    setError(null);
    setDeletingId(id);
    try {
      const res = await deleteTrip(id);
      if (!res.success) setError(res.error || 'Could not remove this trip.');
      else onChanged();
    } catch {
      setError('Could not reach the server. Check your connection and try again.');
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <TripSheet title="Manage travel itinerary" onClose={onClose}>
      <form onSubmit={addTrip} className="mt-4 space-y-3">
        {error && <p className="text-xs text-red-600 bg-red-50 px-3 py-2 rounded-xl">{error}</p>}
        <div className="grid grid-cols-2 gap-2.5">
          <div>
            <label htmlFor="trip-city" className={LABEL}>City</label>
            <input id="trip-city" type="text" placeholder="Cebu" value={city} onChange={(e) => setCity(e.target.value)} required maxLength={80} autoComplete="off" className={FIELD} />
          </div>
          <div>
            <label htmlFor="trip-country" className={LABEL}>Country</label>
            <input id="trip-country" type="text" placeholder="Philippines" value={country} onChange={(e) => setCountry(e.target.value)} required maxLength={80} autoComplete="off" className={FIELD} />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-2.5">
          <div>
            <label htmlFor="trip-start" className={LABEL}>Start date</label>
            <input
              id="trip-start"
              type="date"
              value={startDate}
              min={today}
              max={latestStart}
              onChange={(e) => {
                setStartDate(e.target.value);
                if (endDate && e.target.value > endDate) setEndDate(e.target.value);
              }}
              required
              className={FIELD}
            />
          </div>
          <div>
            <label htmlFor="trip-end" className={LABEL}>End date</label>
            <input id="trip-end" type="date" value={endDate} min={startDate || today} onChange={(e) => setEndDate(e.target.value)} required className={FIELD} />
          </div>
        </div>
        <button
          type="submit"
          disabled={saving}
          className="w-full h-11 inline-flex items-center justify-center gap-2 rounded-full bg-[#8574B7] hover:bg-[#534377] text-white text-sm font-medium transition-colors disabled:opacity-60"
        >
          {saving && <Loader2 className="w-4 h-4 animate-spin" aria-hidden />}
          {saving ? 'Saving...' : 'Add travel destination'}
        </button>
      </form>

      <div className="mt-6 border-t border-slate-200 pt-4">
        <h3 className="text-[11px] font-semibold uppercase tracking-wider text-slate-600 mb-2">Scheduled stops</h3>
        {trips.length === 0 ? (
          <p className="text-sm text-slate-600">No upcoming travel scheduled.</p>
        ) : (
          <ul className="space-y-2">
            {trips.map((t) => (
              <li key={t.id} className="flex items-center justify-between gap-3 p-3 rounded-2xl border border-slate-200">
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-[#413B5E] truncate">
                    {t.destination_city}, {t.destination_country}
                  </p>
                  <p className="text-xs text-slate-600 mt-0.5">{formatTripRange(t.start_date, t.end_date)}</p>
                </div>
                <button
                  type="button"
                  onClick={() => removeTrip(t.id)}
                  disabled={deletingId !== null}
                  aria-label={`Remove trip to ${t.destination_city}`}
                  className="shrink-0 inline-flex items-center gap-1 rounded-full px-2.5 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50 transition-colors disabled:opacity-50"
                >
                  {deletingId === t.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" aria-hidden /> : <Trash2 className="w-3.5 h-3.5" aria-hidden />}
                  Remove
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </TripSheet>
  );
}

export default TripPlannerModal;
