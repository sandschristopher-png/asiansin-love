'use client';

import React, { useMemo, useState } from 'react';
import Link from 'next/link';
import { Loader2 } from 'lucide-react';
import { createTrip, updateTrip } from '@/actions/trips';
import { BottomSheet } from '@/components/ui/BottomSheet';
import { PlusBadge } from '@/components/ui/PlusBadge';
import { ThemedSelect, type ThemedOption } from '@/components/ui/ThemedSelect';
import { useLocale } from '@/components/i18n/LocaleProvider';
import { profileContentMessage } from '@/lib/i18n/moderationMessages';
import { validateProfileContent } from '@/lib/moderation';
import { MAX_DAYS_AHEAD, MAX_NOTE_LEN, MAX_TRIP_DAYS, TRIP_HUBS, isoToday } from '@/lib/tripHubs';
import type { Trip } from '@/lib/trips';

const FIELD =
  'w-full px-3.5 py-2.5 rounded-xl bg-white border border-[#D0CDE1] text-sm text-[#413B5E] placeholder:text-slate-400 focus:outline-none focus:border-[#8574B7]';
const LABEL = 'block text-[11px] font-semibold uppercase tracking-wider text-slate-600 mb-1.5';

/**
 * Add or edit one "Visiting Soon" trip: a curated destination, arrival and departure dates (from
 * today, up to 90 days), and an optional 140-character note checked live with the same rule the
 * server applies. Members without Plus get the paywall instead of the form; the server action and
 * the database enforce the same rule, so this gate is only the friendly front door. Copy comes from
 * the member's language (city and country names stay as written).
 */
export function TripPlannerModal({
  isPlus,
  trip,
  onClose,
  onSaved,
}: {
  isPlus: boolean;
  /** The trip being edited; omit to add a new one. */
  trip?: Trip | null;
  onClose: () => void;
  /** Called after a trip is added or updated so the caller can reload the list. */
  onSaved: () => void;
}) {
  const { t } = useLocale();
  const [city, setCity] = useState(trip?.destination_city ?? '');
  const [startDate, setStartDate] = useState(trip?.start_date ?? '');
  const [endDate, setEndDate] = useState(trip?.end_date ?? '');
  const [note, setNote] = useState(trip?.note ?? '');
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const hubOptions = useMemo<ThemedOption<string>[]>(
    () => [{ value: '', label: t('travel.planner.choose') }, ...TRIP_HUBS.map((h) => ({ value: h.city as string, label: `${h.city}, ${h.country}` }))],
    [t]
  );

  const noteCheck = useMemo(() => validateProfileContent(note), [note]);
  const noteMessage = profileContentMessage(noteCheck, t);
  const today = isoToday();
  const latestStart = isoToday(MAX_DAYS_AHEAD);
  const tooLong = Boolean(startDate && endDate && endDate >= startDate && (Date.parse(endDate) - Date.parse(startDate)) / 86_400_000 > MAX_TRIP_DAYS);
  const ready = Boolean(city && startDate && endDate && endDate >= startDate && !tooLong && noteCheck.isValid);

  if (!isPlus) {
    return (
      <BottomSheet title={t('travel.planner.plusHeading')} onClose={onClose}>
        <div className="pt-5 text-center">
          <span className="inline-flex align-middle">
            <PlusBadge />
          </span>
          <h3 className="text-lg font-semibold text-[#413B5E] mt-3">{t('travel.planner.plusTitle')}</h3>
          <p className="text-sm text-slate-600 mt-2 leading-relaxed">{t('travel.planner.plusBody')}</p>
        </div>
        <div className="mt-6 flex flex-col items-center gap-3">
          <Link
            href="/upgrade"
            className="w-full h-12 inline-flex items-center justify-center rounded-full bg-[#8574B7] hover:bg-[#534377] text-white text-sm font-medium transition-colors active:scale-95"
          >
            {t('travel.planner.upgrade')}
          </Link>
          <button type="button" onClick={onClose} className="text-sm font-medium text-slate-600 hover:text-[#413B5E]">
            {t('travel.planner.later')}
          </button>
        </div>
      </BottomSheet>
    );
  }

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (saving || !ready) return;
    setError(null);
    setSaving(true);
    try {
      const input = { destinationCity: city, startDate, endDate, note };
      const res = trip ? await updateTrip(trip.id, input) : await createTrip(input);
      if (!res.success) {
        // Server messages are English; the form's own checks above are translated.
        setError(res.error || 'Could not save your trip. Please try again.');
        return;
      }
      onSaved();
      onClose();
    } catch {
      setError('Could not reach the server. Check your connection and try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <BottomSheet title={trip ? t('travel.planner.editTitle') : t('travel.planner.addTitle')} onClose={onClose}>
      <form onSubmit={submit} className="mt-4 space-y-3.5">
        {error && <p className="text-xs text-red-600 font-medium bg-red-50 px-3 py-2 rounded-xl">{error}</p>}

        <div>
          <span className={LABEL}>{t('travel.planner.destination')}</span>
          <ThemedSelect<string>
            value={city}
            onChange={setCity}
            options={hubOptions}
            ariaLabel={t('travel.planner.destination')}
            menuClassName="w-full"
            className={`${FIELD} ${city ? '' : 'text-slate-400'}`}
          />
        </div>

        <div className="grid grid-cols-2 gap-2.5">
          <div>
            <label htmlFor="trip-start" className={LABEL}>{t('travel.planner.arrival')}</label>
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
            <label htmlFor="trip-end" className={LABEL}>{t('travel.planner.departure')}</label>
            <input id="trip-end" type="date" value={endDate} min={startDate || today} onChange={(e) => setEndDate(e.target.value)} required className={FIELD} />
          </div>
        </div>
        {tooLong && <p className="text-xs text-red-600 font-medium -mt-1.5">{t('travel.planner.tooLong', { n: MAX_TRIP_DAYS })}</p>}

        <div>
          <label htmlFor="trip-note" className={LABEL}>{t('travel.planner.note')}</label>
          <textarea
            id="trip-note"
            rows={2}
            value={note}
            maxLength={MAX_NOTE_LEN}
            onChange={(e) => setNote(e.target.value)}
            aria-invalid={!noteCheck.isValid}
            placeholder={t('travel.planner.notePlaceholder')}
            className={`${FIELD} resize-none ${noteCheck.isValid ? '' : 'border-red-400 focus:border-red-500'}`}
          />
          <div className="mt-1 flex items-start justify-between gap-3">
            {noteCheck.isValid ? <span /> : <p className="text-xs text-red-600 font-medium" role="alert">{noteMessage}</p>}
            <span className="shrink-0 text-[11px] text-slate-500">
              {note.length}/{MAX_NOTE_LEN}
            </span>
          </div>
        </div>

        <button
          type="submit"
          disabled={saving || !ready}
          className="w-full h-11 inline-flex items-center justify-center gap-2 rounded-full bg-[#8574B7] hover:bg-[#534377] text-white text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {saving && <Loader2 className="w-4 h-4 animate-spin" aria-hidden />}
          {saving ? t('travel.planner.saving') : trip ? t('travel.planner.saveChanges') : t('travel.planner.addButton')}
        </button>
      </form>
    </BottomSheet>
  );
}

export default TripPlannerModal;
