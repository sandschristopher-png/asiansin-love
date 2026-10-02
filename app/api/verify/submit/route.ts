import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabaseServer';
import { sendTelegramVerificationAlert } from '@/lib/adminAlerts';
import { evaluateImageWithAI } from '@/lib/aiVision';

export async function POST(req: Request) {
  try {
    const supabase = await createServerSupabaseClient();

    // 1. Authoritative server-side auth check
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized. Please sign in.' }, { status: 401 });
    }

    const { poseRequested, selfieUrl } = await req.json();

    if (!poseRequested || !selfieUrl) {
      return NextResponse.json({ error: 'Missing required parameters (pose or photo URL)' }, { status: 400 });
    }

    // 2. Fetch user profile using session user.id
    const { data: profile, error: profileErr } = await supabase
      .from('profiles')
      .select('avatar_url, full_name')
      .eq('id', user.id)
      .single();

    if (profileErr || !profile) {
      return NextResponse.json({ error: 'User profile not found' }, { status: 404 });
    }

    // 3. Mark verification pending
    const { error: updateErr } = await supabase
      .from('profiles')
      .update({
        verification_status: 'pending',
        verification_pose_requested: poseRequested,
        verification_submitted_at: new Date().toISOString(),
      })
      .eq('id', user.id);

    if (updateErr) {
      return NextResponse.json({ error: updateErr.message }, { status: 500 });
    }

    // 4. Send notification & Telegram alert
    await supabase.from('notifications').insert({
      user_id: user.id,
      type: 'verification',
      title: 'Verification Submitted',
      description: 'Your selfie gesture is currently under review by our moderation team.',
      link_url: '/profile',
    });

    await sendTelegramVerificationAlert({
      userId: user.id,
      poseRequested,
      selfieUrl,
      avatarUrl: profile.avatar_url || 'No avatar provided',
    });

    return NextResponse.json({ success: true, status: 'pending' });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Internal Server Error' }, { status: 500 });
  }
}