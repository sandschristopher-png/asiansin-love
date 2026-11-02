import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const runtime = 'nodejs';

// Usernames are public handles, but profiles are only readable by signed-in members,
// and this check also runs for people who are signing up. So it uses the service role
// and returns nothing except availability + suggestions.
function getAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  );
}

async function check(username: unknown) {
  if (!username || typeof username !== 'string') {
    return NextResponse.json({ error: 'Username is required' }, { status: 400 });
  }

  const cleanUsername = username.trim().replace(/[^a-zA-Z0-9_.]/g, '');

  if (cleanUsername.length < 3) {
    return NextResponse.json({
      available: false,
      error: 'Username must be at least 3 characters.',
    });
  }

  if (cleanUsername.length > 20) {
    return NextResponse.json({
      available: false,
      error: 'Username must be 20 characters or fewer.',
    });
  }

  const admin = getAdmin();

  // Query profiles to check availability
  const { data: existingUser, error } = await admin
    .from('profiles')
    .select('username')
    .ilike('username', cleanUsername)
    .maybeSingle();

  if (error) {
    return NextResponse.json({ error: 'Could not check that username right now.' }, { status: 500 });
  }

  if (!existingUser) {
    return NextResponse.json({ available: true, username: cleanUsername });
  }

  // Username taken: generate 3 smart suggestions
  const candidates = [
    `${cleanUsername}_lv`,
    `${cleanUsername}.${Math.floor(Math.random() * 89 + 10)}`,
    `real_${cleanUsername}`,
    `${cleanUsername}_ph`,
  ];

  const { data: takenSuggestions } = await admin
    .from('profiles')
    .select('username')
    .in('username', candidates);

  const takenSet = new Set((takenSuggestions || []).map((u) => u.username));
  const suggestions = candidates.filter((c) => !takenSet.has(c)).slice(0, 3);

  return NextResponse.json({
    available: false,
    suggestions,
    message: 'Username is already taken.',
  });
}

export async function POST(req: Request) {
  try {
    const { username } = await req.json();
    return await check(username);
  } catch {
    return NextResponse.json({ error: 'Server validation error' }, { status: 500 });
  }
}

// The profile editor calls this as GET /api/users/check-username?username=...
export async function GET(req: Request) {
  try {
    return await check(new URL(req.url).searchParams.get('username'));
  } catch {
    return NextResponse.json({ error: 'Server validation error' }, { status: 500 });
  }
}
