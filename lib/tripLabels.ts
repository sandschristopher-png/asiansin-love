import type { TKey } from '@/lib/i18n';
import { HTML_LANG, type Locale } from '@/lib/i18n/config';
import { formatRange as formatRangeEn, isoToday, tripPhase, type TripBrief } from '@/lib/tripHubs';

type T = (key: TKey, vars?: Record<string, string | number>) => string;

const DAY_MS = 86_400_000;
const dayNumber = (iso: string) => {
  const [y, m, d] = iso.split('-').map(Number);
  return Math.round(Date.UTC(y, (m || 1) - 1, d || 1) / DAY_MS);
};

/**
 * "Nov 18 – Dec 2" in English, and the same range in the member's language with Intl month names
 * ("18 nov – 2 dic" in Spanish, "11月18日～12月2日" in Japanese). Falls back to English if the
 * browser has no data for the language. Dates are calendar days, read as UTC so no time zone can
 * move them.
 */
export function formatRangeLocale(start: string, end: string, locale: Locale): string {
  if (locale === 'en') return formatRangeEn(start, end);
  try {
    const crossYear = start.slice(0, 4) !== end.slice(0, 4);
    const fmt = new Intl.DateTimeFormat(HTML_LANG[locale], {
      month: 'short',
      day: 'numeric',
      ...(crossYear ? { year: 'numeric' as const } : {}),
      timeZone: 'UTC',
    });
    const a = new Date(`${start}T00:00:00Z`);
    const b = new Date(`${end}T00:00:00Z`);
    return start === end ? fmt.format(a) : fmt.formatRange(a, b);
  } catch {
    return formatRangeEn(start, end);
  }
}

/** Discover card / profile label: "In Manila now" or "Visiting Manila · Nov 18 – Dec 2", translated. */
export function tripBadgeText(trip: TripBrief, t: T, locale: Locale, today = isoToday()): string {
  return tripPhase(trip, today) === 'now'
    ? t('travel.inNow', { city: trip.city })
    : t('travel.visiting', { city: trip.city, dates: formatRangeLocale(trip.arrival, trip.departure, locale) });
}

/** Status pill in the trip manager: "In Manila now" / "Arriving tomorrow" / "Arriving in 6 days", translated. */
export function tripStatusText(trip: { city: string; arrival: string; departure: string }, t: T, today = isoToday()): string {
  const phase = tripPhase(trip, today);
  if (phase === 'now') return t('travel.inNow', { city: trip.city });
  if (phase === 'past') return t('travel.ended');
  const days = dayNumber(trip.arrival) - dayNumber(today);
  return days <= 1 ? t('travel.arrivingTomorrow') : t('travel.arrivingIn', { n: days });
}
