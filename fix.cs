using System;
using System.IO;
using System.Text;

class Fixer {
    static void Main() {
        // 1. Write clean UTF-8 quota route
        string quotaCode = @"import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabaseClient';

const isUUID = (str: string) =>
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str);

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const senderId = searchParams.get('senderId');
    const targetId = searchParams.get('targetId');

    if (!senderId || !isUUID(senderId)) {
      return NextResponse.json({ status: 'unauthenticated' });
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('membership_tier, gender, is_verified')
      .eq('id', senderId)
      .maybeSingle();

    const isPlus = profile?.membership_tier === 'plus';
    const isVerifiedWoman =
      profile?.is_verified &&
      (profile?.gender?.toLowerCase() === 'female' || profile?.gender?.toLowerCase() === 'woman');

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
";
        File.WriteAllText(@"C:\Users\sands\asiansin-love\app\api\messages\quota\route.ts", quotaCode, new UTF8Encoding(false));
        Console.WriteLine("Quota route written cleanly.");
    }
}
