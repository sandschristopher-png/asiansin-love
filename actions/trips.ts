'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { validateProfileContent } from '@/lib/moderation';
import { MAX_DAYS_AHEAD, MAX_NOTE_LEN, MAX_TRIP_DAYS, MAX_UPCOMING_TRIPS, hubCountry } from '@/lib/tripHubs';

/**
 * "Visiting Soon" mutations. Server Functions are reachable by direct POST, so every call
 * re-checks the session, the Plus flag and every input here; RLS and the guard_trip_rules trigger
 * on user_trips (20261111_travel_paywall.sql, 20261112_visiting_soon.sql) enforce the same rules
 * a second time.
 */

export interface TripInput {
  /** One of the curated hubs in lib/tripHubs.ts; the country is derived from it. */
  destinationCity: string;
  startDate: string; // arrival, YYYY-MM-DD
  endDate: string; // departure, YYYY-MM-DD
  /** Optional, up to 140 characters, no links / handles / numbers. */
  note?: string;
}
export type CreateTripInput = TripInput;

export interface ActionResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  code?: 'UNAUTHORIZED' | 'SUBSCRIPTION_REQUIRED' | 'INVALID_INPUT' | 'INVALID_DATES' | 'LIMIT_REACHED' | 'NOT_FOUND' | 'DB_ERROR';
}

export interface TripRow {
  id: string;
  destination_city: string;
  destination_country: string;
  start_date: string;
  end_date: string;
  note: string | null;
}

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const DAY_MS = 86_400_000;
const COLUMNS = 'id, destination_city, destination_country, start_date, end_date, note';
const BASE_COLUMNS = 'id, destination_city, destination_country, start_date, end_date';

/** Calendar date -> UTC midnight ms, or null for malformed or impossible dates (2026-02-31). */
function parseDay(value: unknown): number | null {
  if (typeof value !== 'string' || !DATE_RE.test(value)) return null;
  const ms = Date.parse(`${value}T00:00:00Z`);
  if (!Number.isFinite(ms) || new Date(ms).toISOString().slice(0, 10) !== value) return null;
  return ms;
}

function todayUtcMs(): number {
  const now = new Date();
  return Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());
}

const fail = (error: string, code: NonNullable<ActionResponse['code']>): ActionResponse<never> => ({ success: false, error, code });

type Clean = { city: string; country: string; start: string; end: string; note: string | null };

/** Shared validation for create and update; returns the cleaned values or the error to show. */
function validateTrip(input: TripInput): Clean | ActionResponse<never> {
  const country = hubCountry(input?.destinationCity);
  if (!country) return fail('Choose a destination from the list.', 'INVALID_INPUT');

  const start = parseDay(input?.startDate);
  const end = parseDay(input?.endDate);
  if (start === null || end === null) return fail('Choose valid arrival and departure dates.', 'INVALID_DATES');
  // One day of slack: a member west of UTC can still pick their own "today".
  const today = todayUtcMs();
  if (start < today - DAY_MS) return fail('The arrival date cannot be in the past.', 'INVALID_DATES');
  if (start > today + MAX_DAYS_AHEAD * DAY_MS) return fail('Trips can be scheduled up to 6 months ahead.', 'INVALID_DATES');
  if (end < start) return fail('The departure date must be on or after the arrival date.', 'INVALID_DATES');
  if (end - start > MAX_TRIP_DAYS * DAY_MS) return fail(`A single trip can last up to ${MAX_TRIP_DAYS} days.`, 'INVALID_DATES');

  let note: string | null = null;
  if (input.note !== undefined && input.note !== null) {
    if (typeof input.note !== 'string') return fail('The note must be text.', 'INVALID_INPUT');
    const clean = input.note.replace(/[\u0000-\u001f\u007f]/g, ' ').replace(/\s+/g, ' ').trim();
    if (clean.length > MAX_NOTE_LEN) return fail(`The note can be up to ${MAX_NOTE_LEN} characters.`, 'INVALID_INPUT');
    const content = validateProfileContent(clean);
    if (!content.isValid) return fail(content.errorMessage || 'This note is not allowed.', 'INVALID_INPUT');
    note = clean || null;
  }
  return { city: input.destinationCity, country, start: input.startDate, end: input.endDate, note };
}

type Member = { ok: true; supabase: Awaited<ReturnType<typeof createClient>>; user: { id: string } } | { ok: false; error: ActionResponse<never> };

/** Signed-in member who has Plus (profiles.is_plus: the protected, webhook-written flag RLS checks). */
async function requirePlusMember(): Promise<Member> {
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();
  if (authError || !user) return { ok: false, error: fail('Please sign in again.', 'UNAUTHORIZED') };

  const { data: profile, error: profileError } = await supabase.from('profiles').select('is_plus').eq('id', user.id).maybeSingle();
  if (profileError || profile?.is_plus !== true) {
    return { ok: false, error: fail('Meet in Asia Plus is required to schedule travel.', 'SUBSCRIPTION_REQUIRED') };
  }
  return { ok: true, supabase, user };
}

/** Database rule messages (the trigger's own sentences) are shown; raw constraint text is not. */
function dbMessage(error: { code?: string; message: string }, fallback: string): string {
  return error.code === '23514' && !/violates check constraint/i.test(error.message) ? error.message : fallback;
}

export async function createTrip(input: TripInput): Promise<ActionResponse<TripRow>> {
  const auth = await requirePlusMember();
  if (!auth.ok) return auth.error;
  const { supabase, user } = auth;

  const clean = validateTrip(input);
  if ('success' in clean) return clean;

  const todayIso = new Date(todayUtcMs() - DAY_MS).toISOString().slice(0, 10);
  const { count, error: countError } = await supabase
    .from('user_trips')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', user.id)
    .eq('is_active', true)
    .gte('end_date', todayIso);
  if (countError) {
    console.error('[trips] count failed', countError.message);
    return fail('Could not save your trip. Please try again.', 'DB_ERROR');
  }
  if ((count ?? 0) >= MAX_UPCOMING_TRIPS) {
    return fail(`You can have up to ${MAX_UPCOMING_TRIPS} upcoming trips.`, 'LIMIT_REACHED');
  }

  const row: Record<string, unknown> = {
    user_id: user.id,
    destination_city: clean.city,
    destination_country: clean.country,
    start_date: clean.start,
    end_date: clean.end,
    is_active: true,
  };
  // The note column arrives with 20261112_visiting_soon.sql: only sent (and selected) when used.
  if (clean.note) row.note = clean.note;
  const { data, error } = await supabase.from('user_trips').insert(row).select(clean.note ? COLUMNS : BASE_COLUMNS).single();
  if (error) {
    console.error('[trips] insert failed', error.message);
    return fail(dbMessage(error, 'Could not save your trip. Please try again.'), 'DB_ERROR');
  }

  revalidatePath('/discover');
  revalidatePath('/profile');
  return { success: true, data: { note: null, ...(data as unknown as Partial<TripRow>) } as TripRow };
}

export async function updateTrip(tripId: string, input: TripInput): Promise<ActionResponse<TripRow>> {
  if (typeof tripId !== 'string' || !UUID_RE.test(tripId)) return fail('Trip not found.', 'INVALID_INPUT');
  const auth = await requirePlusMember();
  if (!auth.ok) return auth.error;
  const { supabase, user } = auth;

  const clean = validateTrip(input);
  if ('success' in clean) return clean;

  const patch: Record<string, unknown> = {
    destination_city: clean.city,
    destination_country: clean.country,
    start_date: clean.start,
    end_date: clean.end,
  };
  if (clean.note !== null || input.note !== undefined) patch.note = clean.note;
  const { data, error } = await supabase
    .from('user_trips')
    .update(patch)
    .eq('id', tripId)
    .eq('user_id', user.id)
    .select('note' in patch ? COLUMNS : BASE_COLUMNS)
    .maybeSingle();
  if (error) {
    console.error('[trips] update failed', error.message);
    return fail(dbMessage(error, 'Could not update your trip. Please try again.'), 'DB_ERROR');
  }
  if (!data) return fail('Trip not found.', 'NOT_FOUND');

  revalidatePath('/discover');
  revalidatePath('/profile');
  return { success: true, data: { note: null, ...(data as unknown as Partial<TripRow>) } as TripRow };
}

export async function deleteTrip(tripId: string): Promise<ActionResponse> {
  if (typeof tripId !== 'string' || !UUID_RE.test(tripId)) return fail('Trip not found.', 'INVALID_INPUT');

  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();
  if (authError || !user) return fail('Please sign in again.', 'UNAUTHORIZED');

  // Deleting stays open to lapsed members so they can clear old dates.
  const { error } = await supabase.from('user_trips').delete().eq('id', tripId).eq('user_id', user.id);
  if (error) {
    console.error('[trips] delete failed', error.message);
    return fail('Could not remove this trip. Please try again.', 'DB_ERROR');
  }

  revalidatePath('/discover');
  revalidatePath('/profile');
  return { success: true };
}
