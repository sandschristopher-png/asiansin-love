'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';

/**
 * Travel itinerary ("Visiting Soon") mutations. Server Functions are reachable by direct POST, so
 * every call re-checks the session, the Plus flag and every input here; RLS on user_trips
 * (supabase/migrations/20261111_travel_paywall.sql) enforces the same paywall a second time.
 */

export interface CreateTripInput {
  destinationCity: string;
  destinationCountry: string;
  startDate: string; // YYYY-MM-DD
  endDate: string; // YYYY-MM-DD
}

export interface ActionResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  code?: 'UNAUTHORIZED' | 'SUBSCRIPTION_REQUIRED' | 'INVALID_INPUT' | 'INVALID_DATES' | 'LIMIT_REACHED' | 'DB_ERROR';
}

export interface TripRow {
  id: string;
  destination_city: string;
  destination_country: string;
  start_date: string;
  end_date: string;
}

/** How far ahead a trip may start, and the longest single stop (matches the DB constraint). */
const MAX_DAYS_AHEAD = 183;
const MAX_TRIP_DAYS = 180;
/** Upcoming stops a member can have at once. */
const MAX_UPCOMING_TRIPS = 10;
const MAX_PLACE_LEN = 80;

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const DAY_MS = 86_400_000;

/** Calendar date -> UTC midnight ms, or null for malformed or impossible dates (2026-02-31). */
function parseDay(value: unknown): number | null {
  if (typeof value !== 'string' || !DATE_RE.test(value)) return null;
  const ms = Date.parse(`${value}T00:00:00Z`);
  if (!Number.isFinite(ms) || new Date(ms).toISOString().slice(0, 10) !== value) return null;
  return ms;
}

/** Trims, collapses whitespace and drops control characters; null when empty or too long. */
function cleanPlace(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  const s = value.replace(/[\u0000-\u001f\u007f]/g, '').replace(/\s+/g, ' ').trim();
  return s.length >= 1 && s.length <= MAX_PLACE_LEN ? s : null;
}

function todayUtcMs(): number {
  const now = new Date();
  return Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());
}

export async function createTrip(input: CreateTripInput): Promise<ActionResponse<TripRow>> {
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();
  if (authError || !user) {
    return { success: false, error: 'Please sign in again.', code: 'UNAUTHORIZED' };
  }

  // is_plus is the protected, webhook-written flag (the same one RLS checks).
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('is_plus')
    .eq('id', user.id)
    .maybeSingle();
  if (profileError || profile?.is_plus !== true) {
    return { success: false, error: 'Meet in Asia Plus is required to schedule travel.', code: 'SUBSCRIPTION_REQUIRED' };
  }

  const city = cleanPlace(input?.destinationCity);
  const country = cleanPlace(input?.destinationCountry);
  if (!city || !country) {
    return { success: false, error: `Enter a city and a country (up to ${MAX_PLACE_LEN} characters each).`, code: 'INVALID_INPUT' };
  }

  const start = parseDay(input?.startDate);
  const end = parseDay(input?.endDate);
  if (start === null || end === null) {
    return { success: false, error: 'Choose valid start and end dates.', code: 'INVALID_DATES' };
  }
  // One day of slack: a member west of UTC can still pick their own "today".
  const today = todayUtcMs();
  if (start < today - DAY_MS) {
    return { success: false, error: 'The start date cannot be in the past.', code: 'INVALID_DATES' };
  }
  if (start > today + MAX_DAYS_AHEAD * DAY_MS) {
    return { success: false, error: 'Trips can be scheduled up to 6 months ahead.', code: 'INVALID_DATES' };
  }
  if (end < start) {
    return { success: false, error: 'The end date must be on or after the start date.', code: 'INVALID_DATES' };
  }
  if (end - start > MAX_TRIP_DAYS * DAY_MS) {
    return { success: false, error: `A single stop can last up to ${MAX_TRIP_DAYS} days.`, code: 'INVALID_DATES' };
  }

  const todayIso = new Date(today - DAY_MS).toISOString().slice(0, 10);
  const { count, error: countError } = await supabase
    .from('user_trips')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', user.id)
    .eq('is_active', true)
    .gte('end_date', todayIso);
  if (countError) {
    console.error('[trips] count failed', countError.message);
    return { success: false, error: 'Could not save your trip. Please try again.', code: 'DB_ERROR' };
  }
  if ((count ?? 0) >= MAX_UPCOMING_TRIPS) {
    return { success: false, error: `You can have up to ${MAX_UPCOMING_TRIPS} upcoming stops.`, code: 'LIMIT_REACHED' };
  }

  const { data, error: insertError } = await supabase
    .from('user_trips')
    .insert({
      user_id: user.id,
      destination_city: city,
      destination_country: country,
      start_date: input.startDate,
      end_date: input.endDate,
      is_active: true,
    })
    .select('id, destination_city, destination_country, start_date, end_date')
    .single();
  if (insertError) {
    // Raw database messages stay in the server log.
    console.error('[trips] insert failed', insertError.message);
    return { success: false, error: 'Could not save your trip. Please try again.', code: 'DB_ERROR' };
  }

  revalidatePath('/discover');
  revalidatePath('/profile');
  return { success: true, data: data as TripRow };
}

export async function deleteTrip(tripId: string): Promise<ActionResponse> {
  if (typeof tripId !== 'string' || !UUID_RE.test(tripId)) {
    return { success: false, error: 'Trip not found.', code: 'INVALID_INPUT' };
  }

  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();
  if (authError || !user) {
    return { success: false, error: 'Please sign in again.', code: 'UNAUTHORIZED' };
  }

  // Deleting stays open to lapsed members so they can clear old dates.
  const { error } = await supabase.from('user_trips').delete().eq('id', tripId).eq('user_id', user.id);
  if (error) {
    console.error('[trips] delete failed', error.message);
    return { success: false, error: 'Could not remove this trip. Please try again.', code: 'DB_ERROR' };
  }

  revalidatePath('/discover');
  revalidatePath('/profile');
  return { success: true };
}
