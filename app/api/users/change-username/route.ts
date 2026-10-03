import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabaseServer';

export async function POST(req: Request) {
  try {
    const supabase = await createServerSupabaseClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));
    const rawUsername = body?.username;

    if (!rawUsername || typeof rawUsername !== 'string') {
      return NextResponse.json({ error: 'Username is required.' }, { status: 400 });
    }

    const cleanUsername = rawUsername.trim().replace(/^@/, '').replace(/[^a-zA-Z0-9_.]/g, '');

    if (cleanUsername.length < 3) {
      return NextResponse.json({ error: 'Username must be at least 3 characters.' }, { status: 400 });
    }

    if (cleanUsername.length > 20) {
      return NextResponse.json({ error: 'Username must be 20 characters or fewer.' }, { status: 400 });
    }

    // 1. Fetch user's current profile & status
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id, username, reputation_tier, tier, is_plus')
      .eq('id', user.id)
      .single();

    if (profileError || !profile) {
      return NextResponse.json({ error: 'Profile not found.' }, { status: 404 });
    }

    // If username is already set, verify monetization authorization
    if (profile.username && profile.username.toLowerCase() === cleanUsername.toLowerCase()) {
      return NextResponse.json({ error: 'You already own this username.' }, { status: 400 });
    }

    const isPlusOrPremium = 
      profile.is_plus === true ||
      profile.tier === 'Premium' ||
      profile.tier === 'Plus' ||
      profile.reputation_tier === 'Premium';

    // Check if user has an unlocked username credit or Plus access
    if (profile.username && !isPlusOrPremium && !body.bypass_token) {
      return NextResponse.json({
        error: 'Changing an established handle requires Asians in Love Plus or a $19.99 handle change fee.',
        requires_payment: true,
        fee_cents: 1999,
      }, { status: 403 });
    }

    // 2. Check if requested username is available
    const { data: taken, error: takenError } = await supabase
      .from('profiles')
      .select('id')
      .ilike('username', cleanUsername)
      .neq('id', user.id)
      .maybeSingle();

    if (takenError) {
      return NextResponse.json({ error: 'Error checking username availability.' }, { status: 500 });
    }

    if (taken) {
      return NextResponse.json({ error: 'That username is already taken.' }, { status: 409 });
    }

    // 3. Perform server-side update
    const { error: updateError } = await supabase
      .from('profiles')
      .update({
        username: cleanUsername,
        display_name: cleanUsername,
        updated_at: new Date().toISOString()
      })
      .eq('id', user.id);

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      username: cleanUsername,
      message: 'Username updated successfully.'
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Server error' }, { status: 500 });
  }
}


