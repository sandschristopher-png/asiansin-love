import { NextResponse } from 'next/server';
import type { SupabaseClient } from '@supabase/supabase-js';
import { COUNTRY_NAMES } from '@/lib/countries';
import { sendPushToUser } from '@/lib/pushSender';
import {
  REPORT_WINDOW_MS,
  VELOCITY_WINDOW_MS,
  newCountryLogin,
  reportsExceeded,
  velocityExceeded,
  type TriggerReason,
} from '@/lib/verify/stepUpRules';

/**
 * Server side of "unusual activity": raises profiles.reverification_required, and reads it for the
 * routes that enforce it. Every helper is best effort and tolerant of the migration not being applied yet
 * (20261127_stepup_liveness.sql): a missing column or table reads as "no restriction" and never breaks the
 * request it rides along with.
 */

export interface Reverification {
  required: boolean;
  reason: string | null;
}

export async function reverificationState(db: SupabaseClient, userId: string): Promise<Reverification> {
  const { data, error } = await db.from('profiles').select('reverification_required, reverification_reason').eq('id', userId).maybeSingle();
  if (error || !data) return { required: false, reason: null };
  return { required: data.reverification_required === true, reason: (data.reverification_reason as string | null) ?? null };
}

/** The 403 every restricted action returns; the app opens the identity check when it sees the code. */
export function reverificationBlocked(message = 'Confirm your identity to continue.') {
  return NextResponse.json({ error: message, code: 'REVERIFICATION_REQUIRED' }, { status: 403 });
}

/** Marks the member as needing the check (once) and tells them. Staff accounts are never restricted. */
export async function flagReverification(db: SupabaseClient, userId: string, reason: TriggerReason): Promise<boolean> {
  const { data: updated, error } = await db
    .from('profiles')
    .update({ reverification_required: true, reverification_reason: reason })
    .eq('id', userId)
    .eq('reverification_required', false)
    .or('is_admin.is.null,is_admin.eq.false')
    .select('id');
  if (error || !updated || updated.length === 0) return false;
  await db
    .from('notifications')
    .insert({
      user_id: userId,
      type: 'identity',
      title: 'Confirm your identity',
      description: 'Certain actions are restricted until you take a quick liveness check.',
      link_url: '/profile',
      is_read: false,
    })
    .then(({ error: e }) => e && console.warn('[risk] notification failed:', e.message));
  void sendPushToUser({ userId, type: 'identity', body: 'Confirm your identity to keep messaging.', url: '/profile', tag: 'identity' }).catch(() => {});
  return true;
}

/** More than 15 messages + Sparks in 10 minutes: burst behaviour. */
export async function checkVelocity(db: SupabaseClient, userId: string): Promise<void> {
  try {
    const since = new Date(Date.now() - VELOCITY_WINDOW_MS).toISOString();
    const [messages, sparks] = await Promise.all([
      db.from('messages').select('id', { count: 'exact', head: true }).eq('sender_id', userId).gte('created_at', since),
      db.from('sparks').select('id', { count: 'exact', head: true }).eq('sender_id', userId).gte('created_at', since),
    ]);
    if (velocityExceeded((messages.count ?? 0) + (sparks.count ?? 0))) await flagReverification(db, userId, 'velocity');
  } catch (err) {
    console.warn('[risk] velocity check skipped:', err);
  }
}

/** Two or more reports against a member within 7 days. */
export async function checkReports(db: SupabaseClient, reportedId: string): Promise<void> {
  try {
    const since = new Date(Date.now() - REPORT_WINDOW_MS).toISOString();
    const { count } = await db.from('user_reports').select('id', { count: 'exact', head: true }).eq('reported_id', reportedId).gte('created_at', since);
    if (reportsExceeded(count ?? 0)) await flagReverification(db, reportedId, 'reports');
  } catch (err) {
    console.warn('[risk] report check skipped:', err);
  }
}

const CODE_BY_NAME = new Map(Object.entries(COUNTRY_NAMES).map(([code, name]) => [name.toLowerCase(), code]));

/** A session from a new country (edge geolocation) differing from the last session and the profile. */
export async function checkNewCountry(db: SupabaseClient, userId: string, edgeCountry: string | null): Promise<void> {
  try {
    const edge = edgeCountry?.toUpperCase() || null;
    if (!edge || !/^[A-Z]{2}$/.test(edge)) return;
    const { data, error } = await db.from('profiles').select('country, last_login_country').eq('id', userId).maybeSingle();
    if (error || !data) return;
    const last = (data.last_login_country as string | null) || null;
    if (last === edge) return;
    const profileCode = CODE_BY_NAME.get(String(data.country ?? '').trim().toLowerCase()) ?? null;
    const flag = newCountryLogin(edge, last, profileCode);
    await db.from('profiles').update({ last_login_country: edge }).eq('id', userId);
    if (flag) await flagReverification(db, userId, 'new_country');
  } catch (err) {
    console.warn('[risk] country check skipped:', err);
  }
}
