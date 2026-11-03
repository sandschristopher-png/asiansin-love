// app/api/onboarding/route.ts
//   GET  -> { blocked } early VPN / proxy heads-up for the onboarding screen
//   POST -> completes onboarding: VPN / proxy / datacenter gate, required fields check, then sets
//           profiles.onboarding_completed = true with the service role.
//
// Members can't set onboarding_completed from the browser once 20261107_launch_patch.sql runs,
// so this route is the only way past onboarding. The VPN gate applies here only, never to
// established members.
import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { createClient as createSessionClient } from '@/lib/supabase/server';
import { checkIpReputation, clientIpFromHeaders } from '@/lib/ipReputation';

export const runtime = 'nodejs';

const VPN_RESPONSE = {
  error: 'vpn_detected',
  message:
    'Please disable your VPN or proxy to complete onboarding. We enforce strict location integrity to protect our community.',
};

async function currentUserId(): Promise<string | null> {
  const supabase = await createSessionClient();
  const { data, error } = await supabase.auth.getUser();
  return error || !data?.user ? null : data.user.id;
}

export async function GET(req: Request) {
  if (!(await currentUserId())) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const verdict = await checkIpReputation(clientIpFromHeaders(req.headers));
  return NextResponse.json({ blocked: verdict.blocked });
}

export async function POST(req: Request) {
  const userId = await currentUserId();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const verdict = await checkIpReputation(clientIpFromHeaders(req.headers));
  if (verdict.blocked) {
    console.warn(`[onboarding] blocked ${verdict.reason} connection for ${userId}`);
    return NextResponse.json(VPN_RESPONSE, { status: 403 });
  }

  const admin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
    auth: { persistSession: false },
  });

  const { data: profile } = await admin
    .from('profiles')
    .select('username, gender, birthdate, avatar_url, onboarding_completed')
    .eq('id', userId)
    .maybeSingle();
  if (!profile) return NextResponse.json({ error: 'Profile not found.' }, { status: 404 });
  if (profile.onboarding_completed) return NextResponse.json({ success: true, alreadyCompleted: true });

  // Minimum to appear in Discover: a handle, gender, birth date and one main photo.
  const missing = [
    !profile.username || String(profile.username).startsWith('user_') ? 'username' : null,
    profile.gender !== 'male' && profile.gender !== 'female' ? 'gender' : null,
    !profile.birthdate ? 'birth date' : null,
    !profile.avatar_url ? 'main photo' : null,
  ].filter(Boolean);
  if (missing.length > 0) {
    return NextResponse.json({ error: `Please add your ${missing.join(', ')} to finish.` }, { status: 400 });
  }

  const { error } = await admin.from('profiles').update({ onboarding_completed: true }).eq('id', userId);
  if (error) {
    console.error('[onboarding] could not complete:', error.message);
    return NextResponse.json({ error: 'Could not complete onboarding. Please try again.' }, { status: 500 });
  }

  // Day 1 founding cohort (first 100 verified men + 100 verified women, 90 days of AIL+).
  // Atomic in SQL; a full cohort, an unverified member or a missing migration just returns null.
  let dayOneNumber: number | null = null;
  const { data: slot, error: slotErr } = await admin.rpc('claim_day_one_slot', { p_user_id: userId });
  if (slotErr) console.warn('[onboarding] day one claim skipped:', slotErr.message);
  else if (typeof slot === 'number') dayOneNumber = slot;

  return NextResponse.json({ success: true, dayOneNumber });
}
