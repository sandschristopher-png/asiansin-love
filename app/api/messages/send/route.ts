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

    // 2. Resolve target receiver UUID
    const targetReceiverId = isUUID(receiverId) ? receiverId : DEMO_TARGET_UUID;

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

    return NextResponse.json({ success: true, message });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Internal Server Error' }, { status: 500 });
  }
}
