// app/api/photos/upload/route.ts
import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabaseClient';
import { sendTelegramPhotoReviewAlert } from '@/lib/adminAlerts';

export async function POST(req: Request) {
  try {
    const { userId, photoUrl, isPrimaryAvatar = true } = await req.json();

    if (!userId || !photoUrl) {
      return NextResponse.json({ error: 'User ID and photo URL required' }, { status: 400 });
    }

    // 1. Fetch user's gender profile
    const { data: profile, error: profileErr } = await supabase
      .from('profiles')
      .select('gender, full_name')
      .eq('id', userId)
      .single();

    const isFemale = profile?.gender?.toLowerCase() === 'female' || profile?.gender?.toLowerCase() === 'woman';

    // 2. If it's a woman's photo, set status to pending_review and trigger Telegram approval
    // (If not female, you can choose to auto-approve or still route through Telegram)
    const requiresReview = isFemale || true; // Set to true to screen all photos for complete safety

    if (isPrimaryAvatar) {
      await supabase
        .from('profiles')
        .update({
          avatar_url: photoUrl,
          avatar_status: requiresReview ? 'pending_review' : 'approved',
        })
        .eq('id', userId);
    }

    if (requiresReview) {
      await sendTelegramPhotoReviewAlert({
        userId,
        userGender: profile?.gender || 'female',
        photoUrl,
        photoId: `${userId}_${Date.now()}`,
        isPrimaryAvatar,
      });
    }

    return NextResponse.json({ 
      success: true, 
      status: requiresReview ? 'pending_review' : 'approved' 
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Internal Server Error' }, { status: 500 });
  }
}
