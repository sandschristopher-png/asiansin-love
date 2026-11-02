// app/api/profile/route.ts
//   PATCH { bio?, reply_pace?, relocation_readiness?, timeline_intent? }
//
// Bios are public, so they are screened (contact details, scams, solicitation, slurs) and saved
// with the service role; after 20261106_reputation_rhythm.sql runs, members can no longer write
// `bio` from the browser. The rhythm badges are validated against their CHECK values here too.
// Only these fields are written: never forward other keys with the service role.
import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { createClient as createSessionClient } from '@/lib/supabase/server';
import { evaluateBioModeration } from '@/lib/moderation';
import { isRhythmValue, RHYTHM_FIELDS, type RhythmField } from '@/lib/rhythm';

export const runtime = 'nodejs';

const MAX_BIO_CHARS = 500;
const RHYTHM_KEYS = Object.keys(RHYTHM_FIELDS) as RhythmField[];

export async function PATCH(req: Request) {
  const supabase = await createSessionClient();
  const { data, error: authError } = await supabase.auth.getUser();
  if (authError || !data?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const userId = data.user.id;

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const updates: Record<string, string | null> = {};

  if ('bio' in body) {
    if (typeof body.bio !== 'string') {
      return NextResponse.json({ error: 'Bio must be text.' }, { status: 400 });
    }
    const bio = body.bio.trim();
    if (bio.length > MAX_BIO_CHARS) {
      return NextResponse.json({ error: `Bio can be up to ${MAX_BIO_CHARS} characters.`, field: 'bio' }, { status: 400 });
    }
    const verdict = evaluateBioModeration(bio);
    if (!verdict.ok) {
      return NextResponse.json({ error: verdict.reason, field: 'bio' }, { status: 422 });
    }
    updates.bio = bio;
  }

  const rhythm: Record<string, string | null> = {};
  for (const key of RHYTHM_KEYS) {
    if (!(key in body)) continue;
    const v = body[key];
    if (v !== null && !isRhythmValue(key, v)) {
      return NextResponse.json({ error: `Invalid ${key.replace(/_/g, ' ')}.`, field: key }, { status: 400 });
    }
    rhythm[key] = v as string | null;
  }

  if (Object.keys(updates).length === 0 && Object.keys(rhythm).length === 0) {
    return NextResponse.json({ success: true });
  }

  const service = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
    auth: { persistSession: false },
  });
  const save = (fields: Record<string, string | null>) =>
    service.from('profiles').update({ ...fields, updated_at: new Date().toISOString() }).eq('id', userId).select('id');

  let { data: rows, error } = await save({ ...updates, ...rhythm });
  let rhythmSaved = Object.keys(rhythm).length > 0;

  // Rhythm columns arrive with 20261106_reputation_rhythm.sql; until then save the bio alone.
  if (error && /reply_pace|relocation_readiness|timeline_intent/.test(error.message)) {
    rhythmSaved = false;
    ({ data: rows, error } = Object.keys(updates).length ? await save(updates) : { data: [{ id: userId }], error: null });
  }

  if (error) {
    console.error('[api/profile] update failed:', error.message);
    return NextResponse.json({ error: 'Could not save your profile.' }, { status: 500 });
  }
  if (!rows || rows.length === 0) {
    return NextResponse.json({ error: 'Profile not found.' }, { status: 404 });
  }

  return NextResponse.json({ success: true, rhythmSaved });
}
