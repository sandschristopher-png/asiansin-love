// app/api/profile/route.ts
//   PATCH { bio?, reply_pace?, relocation_readiness?, timeline_intent?, ...member-editable fields }
//
// Saves the member's own profile with the service role. Public free text (bio, "looking for",
// occupation) is screened for contact details, scams, solicitation and slurs first; after
// 20261106_reputation_rhythm.sql runs, members can no longer write `bio` from the browser.
//
// The service role bypasses guard_profile_protected_columns, so ONLY the keys listed in
// TEXT_FIELDS / the explicit handlers below are ever written. Never forward other keys.
import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { createClient as createSessionClient } from '@/lib/supabase/server';
import { evaluateBioModeration } from '@/lib/moderation';
import { BIO_REJECTION_MESSAGE, validateBio } from '@/lib/moderation/textFilter';
import { isRhythmValue, RHYTHM_FIELDS, type RhythmField } from '@/lib/rhythm';
import { resolveCountry } from '@/lib/countries';
import { canonicalCountry } from '@/lib/constants/countries';
import { isPlusProfile } from '@/lib/plus';

export const runtime = 'nodejs';

const MAX_BIO_CHARS = 500;
const RHYTHM_KEYS = Object.keys(RHYTHM_FIELDS) as RhythmField[];

/** Plain member-editable text columns and their max length. `screen` = public text to moderate. */
const TEXT_FIELDS: Record<string, { max: number; screen?: boolean; label: string }> = {
  display_name: { max: 40, label: 'Name' },
  full_name: { max: 60, label: 'Name' },
  location: { max: 120, label: 'City & Country' },
  city: { max: 80, label: 'City' },
  looking_for: { max: 200, screen: true, label: '"What I\'m looking for"' },
  occupation: { max: 80, screen: true, label: 'Occupation' },
  profession: { max: 80, screen: true, label: 'Occupation' },
  relationship_intent: { max: 60, label: 'Future plans' },
  intentions: { max: 60, label: 'Future plans' },
  relationship_goal: { max: 60, label: 'Relationship goal' },
  religion: { max: 60, label: 'Beliefs' },
  marital_status: { max: 60, label: 'Marital status' },
  has_kids: { max: 60, label: 'Children' },
  wants_kids: { max: 60, label: 'Wants children' },
  relocation: { max: 80, label: 'Relocation' },
  languages: { max: 200, label: 'Languages' },
  height: { max: 20, label: 'Height' },
  weight: { max: 20, label: 'Weight' },
  drinking: { max: 40, label: 'Drinking' },
  smoking: { max: 40, label: 'Smoking' },
};

const RHYTHM_COLUMN_RE = /reply_pace|relocation_readiness|timeline_intent/;

type Updates = Record<string, string | number | boolean | string[] | null>;
const bad = (error: string, field: string, status = 400) => NextResponse.json({ error, field }, { status });

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

  const updates: Updates = {};

  if ('bio' in body) {
    if (typeof body.bio !== 'string') return bad('Bio must be text.', 'bio');
    const bio = body.bio.trim();
    if (bio.length > MAX_BIO_CHARS) return bad(`Bio can be up to ${MAX_BIO_CHARS} characters.`, 'bio');
    const rules = validateBio(bio);
    if (!rules.ok) return NextResponse.json({ error: BIO_REJECTION_MESSAGE, field: 'bio', code: 'bio_rule', category: rules.category }, { status: 400 });
    const verdict = evaluateBioModeration(bio);
    if (!verdict.ok) return bad(verdict.reason || 'Please revise your bio.', 'bio', 422);
    updates.bio = bio;
  }

  for (const [key, spec] of Object.entries(TEXT_FIELDS)) {
    if (!(key in body)) continue;
    const v = body[key];
    if (v === null || v === '') {
      updates[key] = null;
      continue;
    }
    if (typeof v !== 'string') return bad(`${spec.label} must be text.`, key);
    const text = v.trim();
    if (text.length > spec.max) return bad(`${spec.label} can be up to ${spec.max} characters.`, key);
    if (spec.screen) {
      const verdict = evaluateBioModeration(text);
      if (!verdict.ok) return bad(`${spec.label}: ${verdict.reason}`, key, 422);
    }
    updates[key] = text;
  }

  if ('country' in body) {
    const country = typeof body.country === 'string' ? body.country.trim().slice(0, 80) : '';
    const city = typeof updates.city === 'string' ? updates.city : '';
    updates.country = country ? resolveCountry(city, country) || country : null;
  }

  if ('age' in body) {
    const age = body.age === null || body.age === '' ? null : Math.round(Number(body.age));
    if (age !== null && (!Number.isFinite(age) || age < 18 || age > 99)) return bad('Age must be between 18 and 99.', 'age');
    updates.age = age;
  }

  if ('interests' in body) {
    const list = Array.isArray(body.interests) ? body.interests : null;
    if (!list || list.length > 30 || list.some((t) => typeof t !== 'string' || t.length > 60)) {
      return bad('Invalid interests.', 'interests');
    }
    updates.interests = Array.from(new Set(list.map((t) => (t as string).trim()).filter(Boolean)));
  }

  for (const key of ['latitude', 'longitude'] as const) {
    if (!(key in body) || body[key] === null) continue;
    const n = Number(body[key]);
    const limit = key === 'latitude' ? 90 : 180;
    if (!Number.isFinite(n) || Math.abs(n) > limit) return bad('Invalid location.', key);
    updates[key] = n;
  }

  // Location can only be downgraded to self-reported here; GPS verification is granted by
  // /api/verify/location alone.
  if (body.location_source === 'self_reported') {
    updates.location_source = 'self_reported';
    updates.location_verified_at = null;
  }

  for (const key of RHYTHM_KEYS) {
    if (!(key in body)) continue;
    const v = body[key];
    if (v !== null && !isRhythmValue(key, v)) return bad(`Invalid ${key.replace(/_/g, ' ')}.`, key);
    updates[key] = v as string | null;
  }

  const service = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
    auth: { persistSession: false },
  });

  // "Visiting:" travel notice (AIL+). Columns from 20261108_release_features.sql.
  const travelKeys = ['visiting_city', 'visiting_country', 'visiting_dates', 'is_travel_mode_active'];
  if (travelKeys.some((k) => k in body)) {
    for (const [key, max, label] of [
      ['visiting_city', 80, 'Destination city'],
      ['visiting_country', 80, 'Destination country'],
      ['visiting_dates', 40, 'Travel dates'],
    ] as const) {
      if (!(key in body)) continue;
      const v = body[key];
      if (v === null || v === '') {
        updates[key] = null;
        continue;
      }
      if (typeof v !== 'string') return bad(`${label} must be text.`, key);
      const text = v.trim();
      if (text.length > max) return bad(`${label} can be up to ${max} characters.`, key);
      if (!validateBio(text).ok) return bad(`${label}: ${BIO_REJECTION_MESSAGE}`, key);
      updates[key] = key === 'visiting_country' ? canonicalCountry(text) : text;
    }
    if ('is_travel_mode_active' in body) {
      const on = body.is_travel_mode_active === true;
      if (on) {
        const { data: me } = await service.from('profiles').select('*').eq('id', userId).maybeSingle();
        if (!isPlusProfile(me)) return bad('Travel notice is an AIL+ feature.', 'is_travel_mode_active', 403);
        const city = 'visiting_city' in updates ? updates.visiting_city : me?.visiting_city;
        if (!city) return bad('Add the city you are visiting first.', 'visiting_city');
      }
      updates.is_travel_mode_active = on;
    }
  }

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ success: true });
  }
  const save = (fields: Updates) =>
    service.from('profiles').update({ ...fields, updated_at: new Date().toISOString() }).eq('id', userId).select('id');

  let rhythmSaved = RHYTHM_KEYS.some((k) => k in updates);
  let { data: rows, error } = await save(updates);

  // Rhythm columns arrive with 20261106_reputation_rhythm.sql; until then save everything else.
  if (error && RHYTHM_COLUMN_RE.test(error.message)) {
    rhythmSaved = false;
    const withoutRhythm = Object.fromEntries(Object.entries(updates).filter(([k]) => !RHYTHM_KEYS.includes(k as RhythmField)));
    if (Object.keys(withoutRhythm).length) {
      ({ data: rows, error } = await save(withoutRhythm));
    } else {
      rows = [{ id: userId }];
      error = null;
    }
  }

  if (error && /visiting_|is_travel_mode_active/.test(error.message)) {
    return NextResponse.json({ error: 'Travel notice is not available yet. Please try again later.' }, { status: 503 });
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
