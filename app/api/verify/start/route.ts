import { NextRequest, NextResponse } from 'next/server';
import { createClient as createSessionClient } from '@/lib/supabase/server';
import { POSE_POOL, SEQUENCE_LENGTH, signToken } from '@/lib/verify/token';

export const runtime = 'nodejs';

export async function POST(_req: NextRequest) {
  const session = await createSessionClient();
  const { data: { user } } = await session.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Random, non-repeating 2-pose sequence dictated entirely by the server.
  const pool = [...POSE_POOL];
  const sequence: string[] = [];
  while (sequence.length < SEQUENCE_LENGTH && pool.length > 0) {
    const idx = Math.floor(Math.random() * pool.length);
    sequence.push(pool.splice(idx, 1)[0]);
  }

  let attemptToken: string;
  try {
    attemptToken = signToken({
      userId: user.id,
      sequence,
      issuedAt: Date.now(),
    });
  } catch {
    return NextResponse.json({ error: 'Server not configured' }, { status: 500 });
  }

  return NextResponse.json({ attemptId: attemptToken, sequence });
}