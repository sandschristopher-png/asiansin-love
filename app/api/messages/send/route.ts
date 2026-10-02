import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabaseClient';
import { detectFinancialSolicitation } from '@/lib/moderation';

const isUUID = (str: string) =>
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str);

const DEMO_TARGET_UUID = '00000000-0000-0000-0000-000000000001';

export async function POST(req: Request) {
  try {
    const { senderId, receiverId, content } = await req.json();

    if (!senderId || !receiverId || !content?.trim()) {
      return NextResponse.json({ error: 'Missing message parameters.' }, { status: 400 });
    }

    // 1. Detect financial solicitation
    const solicitationCheck = detectFinancialSolicitation(content);

    if (solicitationCheck.hasViolation) {
      if (isUUID(senderId)) {
        const { data: senderProfile } = await supabase
          .from('profiles')
          .select('trust_status, financial_strikes')
          .eq('id', senderId)
          .maybeSingle();

        const currentStrikes = (senderProfile?.financial_strikes || 0) + 1;
        const newTrustStatus = currentStrikes >= 2 ? 'under_review' : 'financial_caution';
        const advisoryPill = currentStrikes >= 2 ? 'Profile Paused' : 'Never Send Money';
        const advisoryMessage =
          currentStrikes >= 2
            ? 'This account is paused for repeated financial solicitation.'
            : 'Reminder: Never send money, emergency aid, or gifts to anyone on this platform.';

        await supabase
          .from('profiles')
          .update({
            financial_strikes: currentStrikes,
            trust_status: newTrustStatus,
            trust_pill: advisoryPill,
            trust_advisory: advisoryMessage,
            is_verified: currentStrikes >= 2 ? false : undefined,
          })
          .eq('id', senderId);
      }

      return NextResponse.json(
        {
          error:
            'Message blocked: asiansin.love strictly prohibits requesting money, gifts, GCash, or financial transfers. Continued violations will result in permanent account termination.',
          code: 'SOLICITATION_BLOCKED',
        },
        { status: 403 }
      );
    }

    const targetReceiverId = isUUID(receiverId) ? receiverId : DEMO_TARGET_UUID;

    // 2. Hybrid Messaging Limit Enforcement
    if (isUUID(senderId)) {
      const { data: senderProfile } = await supabase
        .from('profiles')
        .select('membership_tier, gender, is_verified')
        .eq('id', senderId)
        .maybeSingle();

      const isPlus = senderProfile?.membership_tier === 'plus';
      const isVerifiedWoman =
        senderProfile?.is_verified &&
        (senderProfile?.gender?.toLowerCase() === 'female' || senderProfile?.gender?.toLowerCase() === 'woman');

      // Plus members and verified female profiles get unlimited messaging
      if (!isPlus && !isVerifiedWoman) {
        // Check if mutual conversation (has recipient ever replied?)
        const { data: mutualReply } = await supabase
          .from('messages')
          .select('id')
          .eq('sender_id', targetReceiverId)
          .eq('receiver_id', senderId)
          .limit(1)
          .maybeSingle();

        const isMutual = !!mutualReply;

        if (!isMutual) {
          // Check if conversation with this person was already started prior to today
          const startOfToday = new Date();
          startOfToday.setUTCHours(0, 0, 0, 0);

          const { data: pastMessageToThisUser } = await supabase
            .from('messages')
            .select('id')
            .eq('sender_id', senderId)
            .eq('receiver_id', targetReceiverId)
            .lt('created_at', startOfToday.toISOString())
            .limit(1)
            .maybeSingle();

          const isOngoingPreExisting = !!pastMessageToThisUser;

          // If brand new conversation start today: check daily cap of 5 new recipients
          if (!isOngoingPreExisting) {
            const { data: messagesToday } = await supabase
              .from('messages')
              .select('receiver_id')
              .eq('sender_id', senderId)
              .gte('created_at', startOfToday.toISOString());

            const uniqueRecipientsToday = new Set(
              (messagesToday || []).map((m: any) => m.receiver_id)
            );

            // If this is a 6th recipient not yet in today's unique set
            if (!uniqueRecipientsToday.has(targetReceiverId) && uniqueRecipientsToday.size >= 5) {
              return NextResponse.json(
                {
                  error:
                    'Daily conversation limit reached (5/5). Upgrade to Asians in Love Plus for unlimited new introductions.',
                  code: 'OUTREACH_LIMIT_REACHED',
                  upgradeUrl: '/pricing',
                },
                { status: 403 }
              );
            }
          }
        }
      }
    }

    // 3. Safe message insert into database
    const { data: message, error: insertError } = await supabase
      .from('messages')
      .insert([
        {
          sender_id: senderId,
          receiver_id: targetReceiverId,
          content: content.trim(),
          created_at: new Date().toISOString(),
        },
      ])
      .select()
      .single();

    if (insertError) {
      return NextResponse.json({ error: insertError.message }, { status: 500 });
    }

    if (isUUID(targetReceiverId) && targetReceiverId !== DEMO_TARGET_UUID) {
      await supabase.from('notifications').insert({
        user_id: targetReceiverId,
        type: 'message',
        title: 'New Message',
        description: 'You received a new message.',
        link_url: '/messages',
      });
    }

    return NextResponse.json({ success: true, message });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Internal Server Error' }, { status: 500 });
  }
}
