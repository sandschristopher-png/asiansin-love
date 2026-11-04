// app/api/cron/expire-plus/route.ts
// Fallback for the hourly pg_cron job: turns off complimentary (Day 1) Plus once
// plus_expires_at has passed, via expire_complimentary_plus() (20261108_release_features.sql).
// Auth: "Authorization: Bearer <CRON_SECRET>" - Vercel Cron sends this automatically when the
// CRON_SECRET env var is set. Without CRON_SECRET the route refuses every call.
import { NextResponse } from 'next/server';
import { timingSafeEqual } from 'crypto';
import { createClient } from '@supabase/supabase-js';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function authorized(req: Request): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  const given = Buffer.from(req.headers.get('authorization') || '');
  const expected = Buffer.from(`Bearer ${secret}`);
  return given.length === expected.length && timingSafeEqual(given, expected);
}

async function run(req: Request) {
  if (!process.env.CRON_SECRET) {
    return NextResponse.json({ ok: false, error: 'CRON_SECRET is not configured' }, { status: 503 });
  }
  if (!authorized(req)) {
    return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 });
  }

  const admin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
    auth: { persistSession: false },
  });
  const startedAt = new Date().toISOString();
  const { data, error } = await admin.rpc('expire_complimentary_plus');

  if (error) {
    console.error('[cron/expire-plus] failed:', error.message);
    return NextResponse.json({ ok: false, error: error.message, startedAt }, { status: 500 });
  }

  const expired = typeof data === 'number' ? data : 0;
  console.log(`[cron/expire-plus] expired ${expired} complimentary Plus account(s) at ${startedAt}`);
  return NextResponse.json({ ok: true, expired, startedAt });
}

export const GET = run;
export const POST = run;
