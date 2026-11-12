// app/api/profile/language/route.ts
//   POST { language } -> the app language the member picked.
//
// Always sets the mia_lang cookie (path=/, one year, SameSite=Lax), so the server renders the next
// request in that language. When a member is signed in it also saves profiles.preferred_language
// (written with the service role after the session is verified, so it works whatever the profile
// update policy says), which carries the choice to their other devices.
import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { createClient as createSessionClient } from '@/lib/supabase/server';
import { LOCALE_COOKIE, LOCALE_MAX_AGE, isLocale } from '@/lib/i18n/config';

export const runtime = 'nodejs';

export async function POST(req: Request) {
  let body: { language?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }
  const language = body?.language;
  if (!isLocale(language)) {
    return NextResponse.json({ error: 'Unsupported language' }, { status: 400 });
  }

  const res = NextResponse.json({ ok: true, language });
  res.cookies.set(LOCALE_COOKIE, language, {
    path: '/',
    maxAge: LOCALE_MAX_AGE,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    httpOnly: false, // the client also reads it
  });

  const supabase = await createSessionClient();
  const { data } = await supabase.auth.getUser();
  if (data?.user) {
    const admin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
      auth: { persistSession: false },
    });
    const { error } = await admin.from('profiles').update({ preferred_language: language }).eq('id', data.user.id);
    // Before 20261112_preferred_language.sql runs the column is missing: the cookie still works.
    if (error) console.warn('[profile/language] not saved to the profile:', error.message);
  }
  return res;
}
