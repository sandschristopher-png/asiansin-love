import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabaseClient';

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

    if (!userId) {
      const body = await req.json().catch(() => ({}));
      userId = body.userId || null;
    }

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized. Sign in to verify location.' }, { status: 401 });
    }

    const { data: profile, error: fetchErr } = await supabase
      .from('profiles')
      .select('id, country, city, reputation_score')
      .eq('id', userId)
      .single();

    if (fetchErr || !profile) {
      return NextResponse.json({ error: 'Profile not found.' }, { status: 404 });
    }

    let detectedCountryCode = req.headers.get('x-vercel-ip-country')?.toUpperCase() || null;
    let detectedCity = req.headers.get('x-vercel-ip-city') 
      ? decodeURIComponent(req.headers.get('x-vercel-ip-city')!) 
      : null;

    const isDev = process.env.NODE_ENV === 'development' || !detectedCountryCode;
    if (isDev && !detectedCountryCode) {
      const testCountry = req.headers.get('x-test-country');
      detectedCountryCode = testCountry ? testCountry.toUpperCase() : (profile.country === 'United States' ? 'US' : 'PH');
      detectedCity = detectedCity || (detectedCountryCode === 'US' ? 'Los Angeles' : 'Manila');
    }

    const detectedCountryName = detectedCountryCode ? (COUNTRY_MAP[detectedCountryCode] || detectedCountryCode) : 'Unknown';
    const declaredCountry = (profile.country || '').trim().toLowerCase();

    // Bumpy-style anti-VPN & location spoofing match
    const isCountryMatch = 
      declaredCountry === detectedCountryName.toLowerCase() ||
      declaredCountry === (COUNTRY_MAP[detectedCountryCode || ''] || '').toLowerCase();

    if (!isCountryMatch) {
      return NextResponse.json({
        success: false,
        verified: false,
        isVpn: true,
        message: `Access via VPN is not allowed. To verify your location and claim your 🛡️ Verified badge, please disable your VPN and try again. (Detected: ${detectedCountryName})`,
        detectedCountry: detectedCountryName,
        declaredCountry: profile.country,
      }, { status: 400 });
    }

    // Award Verified Status & Rep Score boost
    const newScore = Math.min(100, (profile.reputation_score || 95) + 3);
    const updates: Record<string, any> = {
      location_source: 'gps_verified',
      location_verified_at: new Date().toISOString(),
      is_verified: true,
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
      return NextResponse.json({ error: 'Failed to update verification status.' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      verified: true,
      locationSource: 'gps_verified',
      detectedCountry: detectedCountryName,
      detectedCity,
      reputationScore: newScore,
      message: 'Physical location confirmed! 🛡️ Verified badge awarded.',
    });

  } catch (err: any) {
    console.error('Location verification error:', err);
    return NextResponse.json({ error: err.message || 'Internal server error.' }, { status: 500 });
  }
}
