import { NextResponse } from 'next/server';
import { createClient as createSessionClient } from '@/lib/supabase/server';

const isUUID = (str: string) =>
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str);

export async function GET(req: Request) {
  try {
    // The sender is whoever is signed in. A senderId in the query string is ignored.
    const supabase = await createSessionClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ status: 'unauthenticated' });
    }
    const senderId = user.id;

    const { searchParams } = new URL(req.url);
    const targetId = searchParams.get('targetId');

    const { data: profile } = await supabase
      .from('profiles')
      .select('is_plus, gender, is_verified')
      .eq('id', senderId)
      .maybeSingle();

    const isPlus = Boolean(profile?.is_plus);
    const isVerifiedWoman =
      Boolean(profile?.is_verified) &&
      profile?.gender?.toLowerCase() === 'female';

    if (isPlus) {
      return NextResponse.json({ type: 'plus', unlimited: true, label: 'Plus Member - Unlimited' });
    }

    if (isVerifiedWoman) {
      return NextResponse.json({ type: 'verified_woman', unlimited: true, label: 'Verified Member - Unlimited' });
    }

    if (targetId && isUUID(targetId)) {
      const { data: mutualReply } = await supabase
        .from('messages')
        .select('id')
        .eq('sender_id', targetId)
        .eq('receiver_id', senderId)
        .limit(1)
        .maybeSingle();

      if (mutualReply) {
        return NextResponse.json({ type: 'mutual', unlimited: true, label: 'Mutual Match - Unlimited Replies' });
      }
    }

    const startOfToday = new Date();
    startOfToday.setUTCHours(0, 0, 0, 0);

    const { data: messagesToday } = await supabase
      .from('messages')
      .select('receiver_id')
      .eq('sender_id', senderId)
      .gte('created_at', startOfToday.toISOString());

    const uniqueRecipients = new Set((messagesToday || []).map((m: any) => m.receiver_id));
    const used = uniqueRecipients.size;
    const remaining = Math.max(0, 5 - used);

    return NextResponse.json({
      type: 'free_quota',
      unlimited: false,
      used,
      remaining,
      max: 5,
      label: `${remaining} of 5 new chats left today`,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
