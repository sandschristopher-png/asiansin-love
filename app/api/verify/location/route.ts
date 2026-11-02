import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { createClient as createSessionClient } from '@/lib/supabase/server';
import { COUNTRY_NAMES, normalizeCountry } from '@/lib/countries';

export const runtime = 'nodejs';

const COUNTRY_MAP = COUNTRY_NAMES;

const REPUTATION_BOOST = 3;
const RECHECK_WINDOW_MS = 30 * 24 * 60 * 60 * 1000;

/** The caller is whoever the Supabase session (cookie) or Bearer token proves - never the request body. */
async function getAuthedUserId(req: NextRequest): Promise<string | null> {
  const token = req.headers.get('authorization')?.replace(/^Bearer\s+/i, '');
  if (token) {
    const anon = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      { auth: { persistSession: false } }
    );
    const { data, error } = await anon.auth.getUser(token);
    return !error && data?.user ? data.user.id : null;
  }
  const session = await createSessionClient();
  const { data, error } = await session.auth.getUser();
  return !error && data?.user ? data.user.id : null;
}

export async function POST(req: NextRequest) {
  try {
    const userId = await getAuthedUserId(req);
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized. Sign in to verify location.' }, { status: 401 });
    }

    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!serviceKey) {
      console.error('verify/location: SUPABASE_SERVICE_ROLE_KEY missing');
      return NextResponse.json({ error: 'Location check is unavailable right now.' }, { status: 503 });
    }
    const admin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, serviceKey, {
      auth: { persistSession: false },
    });

    const { data: profile, error: fetchErr } = await admin
      .from('profiles')
      .select('id, country, city, reputation_score, location_verified_at')
      .eq('id', userId)
      .single();

    if (fetchErr || !profile) {
      return NextResponse.json({ error: 'Profile not found.' }, { status: 404 });
    }

    // Country comes from the hosting platform's IP geolocation headers.
    // Test overrides exist ONLY in local development.
    const isDev = process.env.NODE_ENV === 'development';
    let detectedCountryCode = req.headers.get('x-vercel-ip-country')?.toUpperCase() || null;
    let detectedCity = req.headers.get('x-vercel-ip-city')
      ? decodeURIComponent(req.headers.get('x-vercel-ip-city')!)
      : null;

    if (isDev && !detectedCountryCode) {
      const testCountry = req.headers.get('x-test-country');
      detectedCountryCode = testCountry
        ? testCountry.toUpperCase()
        : normalizeCountry(profile.country) === 'United States'
          ? 'US'
          : 'PH';
      detectedCity = detectedCity || (detectedCountryCode === 'US' ? 'Los Angeles' : 'Manila');
    }

    if (!detectedCountryCode) {
      return NextResponse.json(
        { error: 'We could not determine your location from this connection. Please try again.' },
        { status: 503 }
      );
    }

    const detectedCountryName = COUNTRY_MAP[detectedCountryCode] || detectedCountryCode;
    const declaredCountry = normalizeCountry(profile.country); // "US" and "United States" must match
    const isCountryMatch = declaredCountry.toLowerCase() === detectedCountryName.toLowerCase();

    if (!isCountryMatch) {
      return NextResponse.json(
        {
          error: 'Location does not match your profile.',
          message: `Your connection appears to be in ${detectedCountryName}, but your profile lists ${declaredCountry || 'no country'}. Update your profile country, or try again from your usual connection (turn off any VPN).`,
          locationMismatch: true,
          detectedCountry: detectedCountryName,
          declaredCountry: profile.country,
        },
        { status: 422 }
      );
    }

    // Reputation boost only once per recheck window so repeated calls cannot farm score.
    const lastCheck = profile.location_verified_at ? new Date(profile.location_verified_at).getTime() : 0;
    const eligibleForBoost = !lastCheck || Date.now() - lastCheck > RECHECK_WINDOW_MS;
    const baseScore = typeof profile.reputation_score === 'number' ? profile.reputation_score : 95;
    const newScore = eligibleForBoost ? Math.min(100, baseScore + REPUTATION_BOOST) : baseScore;

    // NOTE: this does NOT set is_verified. The verified badge is only granted by an admin
    // after reviewing the photo verification.
    const updates: Record<string, unknown> = {
      location_source: 'gps_verified', // kept for existing UI; means "country confirmed from network location"
      location_verified_at: new Date().toISOString(),
      reputation_score: newScore,
      updated_at: new Date().toISOString(),
    };
    if (detectedCity && !profile.city) {
      updates.city = detectedCity;
    }

    const { error: updateErr } = await admin.from('profiles').update(updates).eq('id', userId);
    if (updateErr) {
      console.error('verify/location update failed:', updateErr.message);
      return NextResponse.json({ error: 'Failed to update location status.' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      locationVerified: true,
      locationSource: 'gps_verified',
      detectedCountry: detectedCountryName,
      detectedCity,
      declaredCountry: profile.country,
      reputationScore: newScore,
      message: 'Location confirmed from your connection. A location badge was added to your profile.',
    });
  } catch (err: unknown) {
    console.error('Location verification error:', err);
    return NextResponse.json({ error: 'Internal server error.' }, { status: 500 });
  }
}
