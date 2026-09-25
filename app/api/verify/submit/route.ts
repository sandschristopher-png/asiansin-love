// app/api/verify/submit/route.ts
import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabaseClient';
import { sendTelegramVerificationAlert } from '@/lib/adminAlerts';

export async function POST(req: Request) {
  try {
    const { userId, poseRequested, selfieUrl } = await req.json();

    if (!userId || !poseRequested || !selfieUrl) {
      return NextResponse.json({ error: 'Missing required parameters' }, { status: 400 });
    }

    const { data: profile, error: profileErr } = await supabase
      .from('profiles')
      .select('avatar_url, full_name')
      .eq('id', userId)
      .single();

    if (profileErr || !profile) {
      return NextResponse.json({ error: 'User profile not found' }, { status: 404 });
    }

    const { error: updateErr } = await supabase
      .from('profiles')
      .update({
        verification_status: 'pending',
        verification_pose_requested: poseRequested,
        verification_submitted_at: new Date().toISOString(),
      })
      .eq('id', userId);

    if (updateErr) {
      return NextResponse.json({ error: updateErr.message }, { status: 500 });
    }

    await sendTelegramVerificationAlert({
      userId,
      poseRequested,
      selfieUrl,
      avatarUrl: profile.avatar_url || 'No avatar provided',
    });

    return NextResponse.json({ success: true, status: 'pending' });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Internal Server Error' }, { status: 500 });
  }
}
