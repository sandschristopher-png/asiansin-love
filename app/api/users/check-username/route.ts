import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabaseClient';

export async function POST(req: Request) {
  try {
    const { username } = await req.json();

    if (!username || typeof username !== 'string') {
      return NextResponse.json({ error: 'Username is required' }, { status: 400 });
    }

    const cleanUsername = username.trim().toLowerCase().replace(/[^a-z0-9_.]/g, '');

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

    // Query profiles to check availability
    const { data: existingUser, error } = await supabase
      .from('profiles')
      .select('username')
      .eq('username', cleanUsername)
      .maybeSingle();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
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

    const { data: takenSuggestions } = await supabase
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
  } catch {
    return NextResponse.json({ error: 'Server validation error' }, { status: 500 });
  }
}
