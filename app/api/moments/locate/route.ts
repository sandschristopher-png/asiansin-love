// POST /api/moments/locate  { lat, lng }  -> { city, country, token }
//
// "Use current location" in the Moment composer. The GPS fix must be inside Southeast Asia (within
// 100 km of a listed city), the connection must be able to prove presence (a VPN, proxy or datacenter
// cannot: lib/safety/vpnCheck.ts) and the edge IP country, when the platform reports one, must also
// be in Southeast Asia, so a spoofed fix sent from elsewhere is refused. The answer carries a signed
// token that POST /api/moments turns into location_verified = true for that city only.
import { NextResponse, after } from 'next/server';
import { createClient as createServiceClient } from '@supabase/supabase-js';
import { createClient } from '@/lib/supabase/server';
import { notifyAdmins } from '@/lib/adminNotify';
import { assessNetwork, canProvePresence, recordNetworkRisk } from '@/lib/safety/vpnCheck';
import { SEA_COUNTRY_CODES, countryOfCity, nearestSeaCity } from '@/lib/seaLocations';
import { signLocationToken } from '@/lib/momentLocation';

export const runtime = 'nodejs';

export async function POST(req: Request) {
  const session = await createClient();
  const { data: { user } } = await session.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized', code: 'UNAUTHORIZED' }, { status: 401 });

  const body = await req.json().catch(() => null);
  const lat = Number(body?.lat);
  const lng = Number(body?.lng);
  if (!body || !Number.isFinite(lat) || !Number.isFinite(lng)) {
    return NextResponse.json({ error: 'Invalid location.', code: 'INVALID_INPUT' }, { status: 400 });
  }

  const admin = createServiceClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, { auth: { persistSession: false } });

  const net = await assessNetwork(req.headers, { userId: user.id, db: admin });
  await recordNetworkRisk(admin, user.id, net, {
    event: 'moment_locate',
    onAlert: () => after(() => notifyAdmins({ kind: 'moderation', ref: user.id, actorId: user.id })),
  });
  if (!canProvePresence(net.tier, net.trusted)) {
    return NextResponse.json({ error: 'Location cannot be confirmed from this connection.', code: 'LOCATION_NETWORK_MASKED' }, { status: 422 });
  }

  const near = nearestSeaCity(lat, lng);
  const edgeCountry = net.headerCountry;
  const edgeOutsideSea = Boolean(edgeCountry && !(SEA_COUNTRY_CODES as readonly string[]).includes(edgeCountry));
  if (!near || (edgeOutsideSea && !net.trusted)) {
    return NextResponse.json({ error: 'Not in Southeast Asia.', code: 'LOCATION_OUTSIDE_SEA' }, { status: 422 });
  }

  const token = signLocationToken(user.id, near.city);
  if (!token) return NextResponse.json({ error: 'Location check is unavailable right now.', code: 'DB_ERROR' }, { status: 503 });
  return NextResponse.json({ city: near.city, country: countryOfCity(near.city), token });
}
