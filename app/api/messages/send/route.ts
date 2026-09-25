// app/api/messages/send/route.ts
import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabaseClient';
import { detectFinancialSolicitation } from '@/lib/moderation';

export async function POST(req: Request) {
  try {
    const { senderId, receiverId, content } = await req.json();

    if (!senderId || !receiverId || !content?.trim()) {
      return NextResponse.json({ error: 'Missing message parameters.' }, { status: 400 });
    }

    // 1. Hard Filter: Detect financial solicitation
    const solicitationCheck = detectFinancialSolicitation(content);

    if (solicitationCheck.hasViolation) {
      // Fetch sender profile to log violation
      const { data: senderProfile } = await supabase
        .from('profiles')
        .select('trust_status, financial_strikes')
        .eq('id', senderId)
        .single();

      const currentStrikes = (senderProfile?.financial_strikes || 0) + 1;
      let newTrustStatus = senderProfile?.trust_status || 'clear';
      let advisoryPill = null;
      let advisoryMessage = null;

      if (currentStrikes >= 2) {
        newTrustStatus = 'under_review';
        advisoryPill = 'Profile Paused';
        advisoryMessage = 'This account is paused for repeated financial solicitation.';
      } else {
        newTrustStatus = 'financial_caution';
        advisoryPill = 'Never Send Money';
        advisoryMessage = 'Reminder: Never send money, emergency aid, or gifts to anyone on this platform.';
      }

      // Log strike and apply penalty
      await supabase
        .from('profiles')
        .update({
          financial_strikes: currentStrikes,
          trust_status: newTrustStatus,
          trust_pill: advisoryPill,
          trust_advisory: advisoryMessage,
          is_verified: newTrustStatus === 'under_review' ? false : undefined,
        })
        .eq('id', senderId);

      // Block message dispatch completely
      return NextResponse.json(
        {
          error: 'Message blocked: asiansin.love strictly prohibits requesting money, gifts, GCash, or financial transfers. Continued violations will result in permanent account termination.',
          code: 'SOLICITATION_BLOCKED'
        },
        { status: 403 }
      );
    }

    // 2. Safe message: insert into database
    const { data: message, error: insertError } = await supabase
      .from('messages')
      .insert([
        {
          sender_id: senderId,
          receiver_id: receiverId,
          content: content.trim(),
          created_at: new Date().toISOString(),
        }
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
