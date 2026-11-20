// app/api/webhooks/ccbill/route.ts
// CCBill postbacks for Meet in Asia Plus. Grants and extends Plus on sales, renewals and upgrades;
// keeps Plus until the paid period ends on cancellation; removes it at once on expiration, refund,
// chargeback or void. Rules: lib/billing/ccbill.ts. Schema: supabase/migrations/20261130_ccbill_billing.sql.
//
// Authentication is fail-closed (see verifyCcbillRequest). The route always answers 2xx for a valid,
// authenticated event it has handled or deliberately ignored, so CCBill does not retry it, and 5xx
// only when a database write failed, so CCBill retries.
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import {
  ccbillEventKey,
  ccbillEventTime,
  decideEffect,
  parseCcbillBody,
  passThroughUserId,
  verifyCcbillRequest,
  type Effect,
} from '@/lib/billing/ccbill';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

type ProfileRow = {
  id: string;
  plus_expires_at: string | null;
  current_period_end: string | null;
  ccbill_subscription_id: string | null;
};

type SubscriptionRow = {
  subscription_id: string;
  user_id: string;
  status: string;
  current_period_end: string | null;
  last_event_at: string;
};

function adminClient() {
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
    auth: { persistSession: false },
  });
}

/** The later of two ISO timestamps (null means "no date"). */
function laterOf(a: string | null | undefined, b: Date): Date {
  const other = a ? new Date(a) : null;
  return other && Number.isFinite(other.getTime()) && other > b ? other : b;
}

function respond(outcome: string, status = 200) {
  return NextResponse.json({ received: true, outcome }, { status });
}

export async function POST(req: NextRequest) {
  const now = new Date();
  const url = new URL(req.url);
  const raw = await req.text();

  const parsed = parseCcbillBody(req.headers.get('content-type'), raw, url.searchParams);
  if (!parsed.ok) {
    return NextResponse.json({ received: false, error: parsed.reason }, { status: parsed.status });
  }
  const fields = parsed.fields;

  const auth = verifyCcbillRequest(url.searchParams, fields, process.env);
  if (!auth.ok) {
    console.warn('[ccbill] rejected postback:', auth.reason);
    const body = auth.status === 503 ? { received: false, error: 'not configured' } : { received: false, error: 'unauthorized' };
    return NextResponse.json(body, { status: auth.status });
  }

  const key = ccbillEventKey(fields);
  if (!key) return NextResponse.json({ received: false, error: 'event cannot be identified' }, { status: 400 });

  const effect: Effect = decideEffect(fields, now);
  const eventType = fields.eventType;
  const subscriptionId = fields.subscriptionId || null;

  if (!process.env.SUPABASE_SERVICE_ROLE_KEY || !process.env.NEXT_PUBLIC_SUPABASE_URL) {
    return NextResponse.json({ received: false, error: 'server not configured' }, { status: 503 });
  }
  const admin = adminClient();

  // Replay: an event already processed is acknowledged without changing anything.
  const seen = await admin.from('ccbill_webhook_events').select('event_key').eq('event_key', key).maybeSingle();
  if (seen.error) {
    console.error('[ccbill] dedupe read failed:', seen.error.message);
    return NextResponse.json({ received: false }, { status: 500 });
  }
  if (seen.data) return respond('duplicate');

  const recordEvent = async (outcome: string) => {
    const { error } = await admin
      .from('ccbill_webhook_events')
      .upsert({ event_key: key, event_type: eventType, subscription_id: subscriptionId, outcome }, { onConflict: 'event_key', ignoreDuplicates: true });
    if (error) console.error('[ccbill] event log failed:', error.message);
  };

  if (effect.kind === 'ignore') {
    await recordEvent('ignored');
    return respond('ignored');
  }

  const eventAt = ccbillEventTime(fields, now);

  // Which member: the subscription we already know, or the pass-through id on a new sale.
  const { data: subRow, error: subErr } = await admin
    .from('ccbill_subscriptions')
    .select('subscription_id, user_id, status, current_period_end, last_event_at')
    .eq('subscription_id', effect.subscriptionId)
    .maybeSingle();
  if (subErr) {
    console.error('[ccbill] subscription read failed:', subErr.message);
    return NextResponse.json({ received: false }, { status: 500 });
  }
  const sub = subRow as SubscriptionRow | null;

  const passedUser = passThroughUserId(fields);
  if (sub && passedUser && passedUser !== sub.user_id) {
    console.warn('[ccbill] pass-through member does not match subscription; ignored');
    await recordEvent('mismatch');
    return respond('mismatch');
  }
  const userId = sub?.user_id ?? (effect.kind === 'grant' ? passedUser : null);
  if (!userId) {
    await recordEvent('unmatched');
    return respond('unmatched');
  }

  // Newer state wins: an older event that arrives late does not undo a newer one.
  if (sub && new Date(sub.last_event_at).getTime() > eventAt.getTime()) {
    await recordEvent('stale');
    return respond('stale');
  }

  const { data: profileRow, error: profileErr } = await admin
    .from('profiles')
    .select('id, plus_expires_at, current_period_end, ccbill_subscription_id')
    .eq('id', userId)
    .maybeSingle();
  if (profileErr) {
    console.error('[ccbill] profile read failed:', profileErr.message);
    return NextResponse.json({ received: false }, { status: 500 });
  }
  const profile = profileRow as ProfileRow | null;
  if (!profile) {
    await recordEvent('unmatched');
    return respond('unmatched');
  }

  // Work out the change to the member's profile and subscription row.
  let newStatus: string;
  let periodEnd: Date;
  let profilePatch: Record<string, unknown> | null = null;
  // A cancel or revoke only touches the profile when it is about the member's current subscription
  // (an upgrade can leave the old subscription id reporting after the new one has taken over).
  const isCurrent = profile.ccbill_subscription_id === effect.subscriptionId;

  if (effect.kind === 'grant') {
    newStatus = 'active';
    periodEnd = effect.periodEnd;
    profilePatch = {
      is_plus: true,
      subscription_status: 'active',
      current_period_end: periodEnd.toISOString(),
      plus_expires_at: laterOf(profile.plus_expires_at, periodEnd).toISOString(),
      ccbill_subscription_id: effect.subscriptionId,
    };
  } else if (effect.kind === 'cancel') {
    newStatus = 'canceled';
    periodEnd = sub?.current_period_end ? new Date(sub.current_period_end) : profile.current_period_end ? new Date(profile.current_period_end) : now;
    if (isCurrent) {
      profilePatch = {
        subscription_status: 'canceled',
        current_period_end: periodEnd.toISOString(),
        // Plus stays on until the paid period ends; expire_complimentary_plus() turns it off then.
        plus_expires_at: laterOf(profile.plus_expires_at, periodEnd).toISOString(),
      };
    }
  } else {
    newStatus = effect.status;
    periodEnd = now;
    if (isCurrent) {
      profilePatch = {
        is_plus: false,
        subscription_status: effect.status,
        current_period_end: now.toISOString(),
        plus_expires_at: now.toISOString(),
        ccbill_subscription_id: null,
      };
    }
  }

  if (profilePatch) {
    const { data: updated, error: updErr } = await admin
      .from('profiles')
      .update({ ...profilePatch, updated_at: now.toISOString() })
      .eq('id', userId)
      .select('id');
    if (updErr || !updated || updated.length === 0) {
      console.error('[ccbill] profile update failed:', updErr?.message ?? 'no row');
      return NextResponse.json({ received: false }, { status: 500 });
    }
  }

  const { error: writeErr } = await admin.from('ccbill_subscriptions').upsert(
    {
      subscription_id: effect.subscriptionId,
      user_id: userId,
      status: newStatus,
      current_period_end: periodEnd.toISOString(),
      last_event_at: eventAt.toISOString(),
      updated_at: now.toISOString(),
    },
    { onConflict: 'subscription_id' }
  );
  if (writeErr) {
    console.error('[ccbill] subscription write failed:', writeErr.message);
    return NextResponse.json({ received: false }, { status: 500 });
  }

  const outcome = profilePatch ? 'applied' : 'recorded';
  await recordEvent(outcome);
  return respond(outcome);
}
