// app/api/profile/check-username/route.ts
//   GET ?username=<handle> -> { available: boolean, error?: string, suggestions?: string[] }
//
// Exact, case-insensitive availability check for onboarding (and anywhere a handle is claimed).
// Underscores are escaped so "jen_88" doesn't match "jenx88" (in ILIKE "_" is a wildcard).
import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { createClient as createSessionClient } from '@/lib/supabase/server';

export const runtime = 'nodejs';

const HANDLE_RE = /^[a-zA-Z0-9_]{3,20}$/;
const RESERVED = new Set([
  'admin', 'administrator', 'support', 'help', 'moderator', 'mod', 'staff', 'team', 'official',
  'meetinasia', 'meetin', 'ail', 'ailplus', 'system', 'root', 'null', 'undefined', 'me',
]);

const escapeLike = (s: string) => s.replace(/[\\%_]/g, (c) => `\\${c}`);

export async function GET(req: Request) {
  const supabase = await createSessionClient();
  const { data, error: authError } = await supabase.auth.getUser();
  if (authError || !data?.user) {
    return NextResponse.json({ available: false, error: 'Unauthorized' }, { status: 401 });
  }
  const userId = data.user.id;

  const handle = (new URL(req.url).searchParams.get('username') || '').trim();
  if (!HANDLE_RE.test(handle)) {
    return NextResponse.json({
      available: false,
      error: 'Use 3 to 20 letters, numbers or underscores.',
    });
  }
  if (RESERVED.has(handle.toLowerCase())) {
    return NextResponse.json({ available: false, error: 'That username is reserved.' });
  }

  const admin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
    auth: { persistSession: false },
  });

  const { data: taken, error } = await admin
    .from('profiles')
    .select('id')
    .ilike('username', escapeLike(handle))
    .neq('id', userId)
    .limit(1);
  if (error) {
    return NextResponse.json({ available: false, error: 'Could not check that username right now.' }, { status: 500 });
  }
  if (!taken || taken.length === 0) return NextResponse.json({ available: true });

  const base = handle.slice(0, 15);
  const candidates = [`${base}_lv`, `${base}_${Math.floor(Math.random() * 89 + 10)}`, `real_${base}`.slice(0, 20), `${base}_ph`];
  const { data: takenCandidates } = await admin
    .from('profiles')
    .select('username')
    .in('username', candidates);
  const takenSet = new Set((takenCandidates || []).map((r) => String(r.username || '').toLowerCase()));
  return NextResponse.json({
    available: false,
    suggestions: candidates.filter((c) => !takenSet.has(c.toLowerCase())).slice(0, 3),
  });
}
