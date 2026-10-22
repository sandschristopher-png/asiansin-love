import { NextResponse } from 'next/server';
import { createClient as createSessionClient } from '@/lib/supabase/server';
import { generatePoseSequence } from '@/lib/verification';

export async function POST() {
  try {
    const supabase = await createSessionClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Already verified?
    const { data: profile } = await supabase
      .from('profiles')
      .select('is_verified')
      .eq('id', user.id)
      .single();
    if (profile?.is_verified) {
      return NextResponse.json({ error: 'Already verified' }, { status: 400 });
    }

    // Blocked by strikes?
    const { count: strikeCount } = await supabase
      .from('verification_strikes')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id);
    if ((strikeCount ?? 0) >= 3) {
      return NextResponse.json(
        { error: 'Too many failed attempts. Verification is locked for this account.' },
        { status: 403 }
      );
    }

    // Resume today's pending attempt or create a new one
    const { data: existing } = await supabase
      .from('verification_attempts')
      .select('id, pose_sequence, photo_paths, status, submitted_at')
      .eq('user_id', user.id)
      .order('submitted_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    const today = new Date().toISOString().slice(0, 10);
    if (existing && existing.submitted_at.slice(0, 10) === today) {
      if (existing.photo_paths && existing.photo_paths.length > 0) {
        return NextResponse.json(
          { error: 'Already submitted today. Try again tomorrow.' },
          { status: 429 }
        );
      }
      // Pending, unfinished attempt: hand back the same sequence
      return NextResponse.json({
        attemptId: existing.id,
        sequence: existing.pose_sequence,
      });
    }

    const sequence = generatePoseSequence();
    const { data: inserted, error } = await supabase
      .from('verification_attempts')
      .insert({ user_id: user.id, pose_sequence: sequence })
      .select('id')
      .single();

    if (error) {
      console.error('verify/start insert failed:', error.message);
      return NextResponse.json({ error: 'Failed to start verification' }, { status: 500 });
    }

    return NextResponse.json({ attemptId: inserted.id, sequence });
  } catch (err) {
    console.error('verify/start error:', err);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}