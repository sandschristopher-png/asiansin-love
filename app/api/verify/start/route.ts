import { NextResponse } from 'next/server';
import { createClient as createSessionClient } from '@/lib/supabase/server';
import { signToken, POSE_POOL, SEQUENCE_LENGTH, VerifyTokenPayload } from '@/lib/verify/token';

export async function POST() {
  const supabase = await createSessionClient();
  const { data, error } = await supabase.auth.getUser();
  if (error || !data?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Random distinct poses from the canonical pool
  const pool = [...POSE_POOL];
  const sequence: string[] = [];
  while (sequence.length < SEQUENCE_LENGTH && pool.length > 0) {
    const idx = Math.floor(Math.random() * pool.length);
    sequence.push(pool.splice(idx, 1)[0]);
  }

  const payload: VerifyTokenPayload = {
    userId: data.user.id,
    sequence,
    issuedAt: Date.now(),
  };

  const attemptId = signToken(payload);
  return NextResponse.json({ attemptId, sequence });
}