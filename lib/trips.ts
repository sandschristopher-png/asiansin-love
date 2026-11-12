import { supabase } from '@/lib/supabase/client';
import { formatRange, isoToday } from '@/lib/tripHubs';

export { MAX_DAYS_AHEAD, MAX_NOTE_LEN, MAX_TRIP_DAYS, MAX_UPCOMING_TRIPS } from '@/lib/tripHubs';

/** A row of public.user_trips (client side). The table's names: city / country / arrival / departure. */
export interface Trip {
  id: string;
  destination_city: string;
  destination_country: string;
  start_date: string; // arrival, YYYY-MM-DD
  end_date: string; // departure, YYYY-MM-DD
  note: string | null;
}

const BASE_COLUMNS = 'id, destination_city, destination_country, start_date, end_date';

/** Local calendar date as YYYY-MM-DD (offset by `days`). */
export const localIsoDate = isoToday;

/**
 * A member's upcoming active stops, soonest first. RLS returns other members' trips only while
 * they have Plus and neither has blocked the other. Returns [] if anything fails, so profiles
 * never break over travel data. The note column arrives with 20261112_visiting_soon.sql: until
 * then the query is retried without it.
 */
export async function fetchUpcomingTrips(userId: string): Promise<Trip[]> {
  const run = (columns: string) =>
    supabase
      .from('user_trips')
      .select(columns)
      .eq('user_id', userId)
      .eq('is_active', true)
      .gte('end_date', isoToday())
      .order('start_date', { ascending: true })
      .limit(10);
  try {
    let { data, error } = await run(`${BASE_COLUMNS}, note`);
    if (error && /note/.test(error.message)) ({ data, error } = await run(BASE_COLUMNS));
    if (error || !data) return [];
    return (data as unknown as Partial<Trip>[]).map((t) => ({ note: null, ...t })) as Trip[];
  } catch {
    return [];
  }
}

/** "Nov 18 – Dec 2" for a trip row. */
export function formatTripRange(start: string, end: string): string {
  return formatRange(start, end);
}
