import { supabase } from '@/lib/supabase/client';

export interface Trip {
  id: string;
  destination_city: string;
  destination_country: string;
  start_date: string; // YYYY-MM-DD
  end_date: string; // YYYY-MM-DD
}

const TRIP_COLUMNS = 'id, destination_city, destination_country, start_date, end_date';
export const MAX_DAYS_AHEAD = 183;

/** Local calendar date as YYYY-MM-DD (offset by `days`). */
export function localIsoDate(days = 0): string {
  const d = new Date();
  d.setDate(d.getDate() + days);
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${d.getFullYear()}-${mm}-${dd}`;
}

/**
 * A member's upcoming active stops, soonest first. RLS returns other members' trips only while
 * they have Plus. Returns [] if anything fails (including before the user_trips migration runs),
 * so profiles never break over travel data.
 */
export async function fetchUpcomingTrips(userId: string): Promise<Trip[]> {
  try {
    const { data, error } = await supabase
      .from('user_trips')
      .select(TRIP_COLUMNS)
      .eq('user_id', userId)
      .eq('is_active', true)
      .gte('end_date', localIsoDate())
      .order('start_date', { ascending: true })
      .limit(10);
    if (error || !data) return [];
    return data as Trip[];
  } catch {
    return [];
  }
}

/** "YYYY-MM-DD" read as a calendar day (UTC), so no time zone can shift it to the day before. */
function parts(iso: string) {
  const [y, m, d] = iso.split('-').map(Number);
  const month = new Date(Date.UTC(y, (m || 1) - 1, d || 1)).toLocaleDateString('en-US', { month: 'short', timeZone: 'UTC' });
  return { y, month, d };
}

/** "Nov 28 - 30", "Nov 28 - Dec 3", or "Dec 28, 2026 - Jan 3, 2027". */
export function formatTripRange(start: string, end: string): string {
  const s = parts(start);
  const e = parts(end);
  if (s.y !== e.y) return `${s.month} ${s.d}, ${s.y} - ${e.month} ${e.d}, ${e.y}`;
  if (s.month !== e.month) return `${s.month} ${s.d} - ${e.month} ${e.d}`;
  if (s.d === e.d) return `${s.month} ${s.d}`;
  return `${s.month} ${s.d} - ${e.d}`;
}
