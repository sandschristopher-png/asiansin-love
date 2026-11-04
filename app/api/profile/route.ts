// app/api/profile/route.ts
//   PATCH { bio?, reply_pace?, relocation_readiness?, timeline_intent?, ...member-editable fields }
//
// Saves the member's own profile with the service role. Public free text (bio, "looking for",
// occupation) goes through lib/moderation/profileModerator: contact details are masked and the
// cleaned text is saved; payment / commercial terms block the save; newly introduced violations
// cost reputation (lib/moderation/profilePenalty). Slurs / conduct still use lib/moderation. After
// 20261106_reputation_rhythm.sql runs, members can no longer write `bio` from the browser.
//
// The service role bypasses guard_profile_protected_columns, so ONLY the keys listed in
// TEXT_FIELDS / the explicit handlers below are ever written. Never forward other keys.
import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { createClient as createSessionClient } from '@/lib/supabase/server';
import { evaluateBioModeration } from '@/lib/moderation';
import { BIO_REJECTION_MESSAGE, validateBio } from '@/lib/moderation/textFilter';
import { PROFILE_BLOCK_MESSAGE } from '@/lib/moderation/profileModerator';
import {
  chargeProfileViolations,
  isBlocked,
  sanitizedNotice,
  screenText,
  type ScreenedText,
} from '@/lib/moderation/profilePenalty';
import { isRhythmValue, RHYTHM_FIELDS, type RhythmField } from '@/lib/rhythm';
import { resolveCountry } from '@/lib/countries';
import { canonicalCountry } from '@/lib/constants/countries';
import { isPlusProfile } from '@/lib/plus';
import { normalizeLanguages } from '@/lib/constants/languages';
import {
  HEIGHT_MAX_CM,
  HEIGHT_MIN_CM,
  LIFESTYLE_KEYS,
  NEW_LIFESTYLE_COLUMNS,
  isLifestyleValue,
  normalizeDrinking,
  normalizeSmoking,
} from '@/lib/lifestyle';

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
};

const RHYTHM_COLUMN_RE = /reply_pace|relocation_readiness|timeline_intent/;
const LIFESTYLE_COLUMN_RE = /tattoos|piercings|fitness_rhythm/;

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
  const screened: ScreenedText[] = [];

  const service = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
    auth: { persistSession: false },
  });

  // Stored values of the public text fields in this save ("newly introduced" comparison).
  const SCREENED_KEYS = ['bio', ...Object.keys(TEXT_FIELDS).filter((k) => TEXT_FIELDS[k].screen)];
  const editing = SCREENED_KEYS.filter((k) => typeof body[k] === 'string' && (body[k] as string).trim());
  let stored: Record<string, unknown> = {};
  if (editing.length) {
    const { data: row } = await service.from('profiles').select(editing.join(', ')).eq('id', userId).maybeSingle();
    stored = (row as Record<string, unknown> | null) || {};
  }

  /** Mask contact details, block payment / commercial terms, then the conduct (slur) check. */
  const screen = (key: string, label: string, text: string): NextResponse | string => {
    const item = screenText(key, text, typeof stored[key] === 'string' ? (stored[key] as string) : null);
    if (item.result.violations.length) screened.push(item);
    if (isBlocked(item)) return bad(`${label}: ${PROFILE_BLOCK_MESSAGE}`, key, 422);
    const verdict = evaluateBioModeration(item.result.sanitizedText);
    if (!verdict.ok) return bad(`${label}: ${verdict.reason || 'Please revise this text.'}`, key, 422);
    return item.result.sanitizedText;
  };

  /** Charges a blocked attempt before answering (re-submitting the same text is free). */
  const reject = async (res: NextResponse) => {
    const blocked = screened.filter(isBlocked);
    if (blocked.length) await chargeProfileViolations(service, userId, blocked, 'profile_blocked');
    return res;
  };

  if ('bio' in body) {
    if (typeof body.bio !== 'string') return bad('Bio must be text.', 'bio');
    const bio = body.bio.trim();
    if (bio.length > MAX_BIO_CHARS) return bad(`Bio can be up to ${MAX_BIO_CHARS} characters.`, 'bio');
    const out = bio ? screen('bio', 'Bio', bio) : '';
    if (out instanceof NextResponse) return reject(out);
    updates.bio = out;
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
      const out = screen(key, spec.label, text);
      if (out instanceof NextResponse) return reject(out);
      updates[key] = out;
      continue;
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

  // Languages: canonical text[] of offered languages (lib/constants/languages.ts).
  if ('languages' in body) {
    updates.languages = normalizeLanguages(body.languages);
  }

  // Height in cm (the legacy free-text `height` column is kept in sync for older readers).
  // Weight is intentionally not accepted: no numeric weight on asiansin.love.
  if ('height_cm' in body) {
    const raw = body.height_cm;
    const cm = raw === null || raw === '' ? null : Math.round(Number(raw));
    if (cm !== null && (!Number.isFinite(cm) || cm < HEIGHT_MIN_CM || cm > HEIGHT_MAX_CM)) {
      return bad(`Height must be between ${HEIGHT_MIN_CM} and ${HEIGHT_MAX_CM} cm.`, 'height_cm');
    }
    updates.height_cm = cm;
    updates.height = cm === null ? null : `${cm} cm`;
  }

  // Lifestyle enums (drinking / smoking also accept older free labels and store the enum).
  for (const key of LIFESTYLE_KEYS) {
    if (!(key in body)) continue;
    const v = body[key];
    if (v === null || v === '') {
      updates[key] = null;
      continue;
    }
    const value = key === 'drinking' ? normalizeDrinking(v) : key === 'smoking' ? normalizeSmoking(v) : v;
    if (!isLifestyleValue(key, value)) return bad(`Invalid ${key.replace(/_/g, ' ')}.`, key);
    updates[key] = value as string;
  }

  for (const key of RHYTHM_KEYS) {
    if (!(key in body)) continue;
    const v = body[key];
    if (v !== null && !isRhythmValue(key, v)) return bad(`Invalid ${key.replace(/_/g, ' ')}.`, key);
    updates[key] = v as string | null;
  }

  // "Visiting:" travel notice (Plus). Columns from 20261108_release_features.sql.
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
        if (!isPlusProfile(me)) return bad('Travel notice is an Plus feature.', 'is_travel_mode_active', 403);
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
  let lifestyleSaved = NEW_LIFESTYLE_COLUMNS.some((k) => k in updates);
  let pending: Updates = updates;
  let { data: rows, error } = await save(pending);

  // Optional columns that arrive with later migrations: until they run, save everything else.
  //   rhythm (reply_pace, ...)              20261106_reputation_rhythm.sql
  //   tattoos / piercings / fitness_rhythm  20261109_lifestyle_attributes.sql
  const OPTIONAL_GROUPS: { re: RegExp; keys: string[]; onDrop: () => void }[] = [
    { re: RHYTHM_COLUMN_RE, keys: RHYTHM_KEYS, onDrop: () => (rhythmSaved = false) },
    { re: LIFESTYLE_COLUMN_RE, keys: NEW_LIFESTYLE_COLUMNS, onDrop: () => (lifestyleSaved = false) },
  ];
  for (let attempt = 0; attempt < OPTIONAL_GROUPS.length && error; attempt++) {
    const group = OPTIONAL_GROUPS.find((g) => g.re.test(error!.message) && g.keys.some((k) => k in pending));
    if (!group) break;
    group.onDrop();
    pending = Object.fromEntries(Object.entries(pending).filter(([k]) => !group.keys.includes(k)));
    if (Object.keys(pending).length) {
      ({ data: rows, error } = await save(pending));
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

  // Saved: charge newly introduced (masked) contact violations and tell the member what changed.
  const penalty = screened.length ? await chargeProfileViolations(service, userId, screened, 'profile_sanitized') : 0;
  const sanitized = Object.fromEntries(
    screened.filter((it) => it.result.sanitizedText !== it.raw.trim()).map((it) => [it.field, it.result.sanitizedText])
  );
  return NextResponse.json({
    success: true,
    rhythmSaved,
    lifestyleSaved,
    ...(Object.keys(sanitized).length ? { sanitized, notice: sanitizedNotice(screened), penalty } : {}),
  });
}
