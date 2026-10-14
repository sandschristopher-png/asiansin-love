import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabaseClient';

// ISO 3166-1 alpha-2 mapping to match the database country names
const COUNTRY_MAP: Record<string, string> = {
  PH: 'Philippines',
  US: 'United States',
  TH: 'Thailand',
  VN: 'Vietnam',
  ID: 'Indonesia',
  MY: 'Malaysia',
  SG: 'Singapore',
  JP: 'Japan',
  KR: 'South Korea',
  TW: 'Taiwan',
  HK: 'Hong Kong',
  MO: 'Macau',
  KH: 'Cambodia',
  MM: 'Myanmar',
  LA: 'Laos',
  BN: 'Brunei',
  AE: 'United Arab Emirates',
  SA: 'Saudi Arabia',
  QA: 'Qatar',
  KW: 'Kuwait',
  BH: 'Bahrain',
  OM: 'Oman',
  CA: 'Canada',
  AU: 'Australia',
  GB: 'United Kingdom',
  NZ: 'New Zealand',
  DE: 'Germany',
  FR: 'France',
  IT: 'Italy',
  ES: 'Spain',
  NL: 'Netherlands',
  IE: 'Ireland',
  SE: 'Sweden',
  CH: 'Switzerland',
  NO: 'Norway',
};

export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization');
    const token = authHeader?.replace(/^Bearer\s+/i, '');

    let userId: string | null = null;

    if (token) {
      const { data: { user }, error: authErr } = await supabase.auth.getUser(token);
      if (!authErr && user) {
        userId = user.id;
      }
    }

    // Fallback: Check if userId is passed in body if no Bearer token
    if (!userId) {
      const body = await req.json().catch(() => ({}));
      userId = body.userId || null;
    }

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized. Sign in to verify location.' }, { status: 401 });
    }

    // 1. Fetch current profile
    const { data: profile, error: fetchErr } = await supabase
      .from('profiles')
      .select('id, country, city, reputation_score, verified, location_source')
      .eq('id', userId)
      .single();

    if (fetchErr || !profile) {
      return NextResponse.json({ error: 'Profile not found.' }, { status: 404 });
    }

    // 2. Extract Vercel Edge Geolocation Headers
    let detectedCountryCode = req.headers.get('x-vercel-ip-country')?.toUpperCase() || null;
    let detectedCity = req.headers.get('x-vercel-ip-city') 
      ? decodeURIComponent(req.headers.get('x-vercel-ip-city')!) 
      : null;

    // Localhost / Development fallback support
    const isDev = process.env.NODE_ENV === 'development' || !detectedCountryCode;
    if (isDev && !detectedCountryCode) {
      // Allow testing header or match user country for dev environment
      const testCountry = req.headers.get('x-test-country');
      detectedCountryCode = testCountry ? testCountry.toUpperCase() : 'PH';
      detectedCity = detectedCity || 'Manila (Local Dev)';
    }

    const detectedCountryName = detectedCountryCode ? (COUNTRY_MAP[detectedCountryCode] || detectedCountryCode) : 'Unknown';
    const declaredCountry = (profile.country || '').trim().toLowerCase();

    // 3. Match Evaluation
    const isCountryMatch = 
      declaredCountry === detectedCountryName.toLowerCase() ||
      declaredCountry === (COUNTRY_MAP[detectedCountryCode || ''] || '').toLowerCase();

    if (!isCountryMatch) {
      return NextResponse.json({
        success: false,
        verified: false,
        message: `Location discrepancy: Connected from ${detectedCountryName}, but profile country is set to ${profile.country || 'unspecified'}.`,
        detectedCountry: detectedCountryName,
        declaredCountry: profile.country,
      }, { status: 400 });
    }

    // 4. Update Profile: Award verified badge and boost reputation score
    const newScore = Math.min(100, (profile.reputation_score || 95) + 3);
    const updates: Record<string, any> = {
      location_source: 'gps_verified',
      verified: true,
      reputation_score: newScore,
      updated_at: new Date().toISOString(),
    };

    if (detectedCity && !profile.city) {
      updates.city = detectedCity;
    }

    const { error: updateErr } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', userId);

    if (updateErr) {
      return NextResponse.json({ error: 'Failed to update profile verification status.' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      verified: true,
      locationSource: 'gps_verified',
      detectedCountry: detectedCountryName,
      detectedCity,
      reputationScore: newScore,
      message: 'Location verified successfully! Badge awarded.',
    });

  } catch (err: any) {
    console.error('Location verification error:', err);
    return NextResponse.json({ error: err.message || 'Internal server error.' }, { status: 500 });
  }
}
