// app/api/feedback/date-review/route.ts
import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabaseClient';

export async function POST(req: Request) {
  try {
    const {
      reviewerId,
      targetUserId,
      interactionType,
      photosMatched,
      identityAccurate,
      solicitedMoney,
      wasRespectful,
      notes,
    } = await req.json();

    if (!reviewerId || !targetUserId || !interactionType) {
      return NextResponse.json(
        { error: 'Reviewer, target ID, and interaction type are required.' },
        { status: 400 }
      );
    }

    const { error: insertErr } = await supabase
      .from('date_reviews')
      .insert([
        {
          reviewer_id: reviewerId,
          target_user_id: targetUserId,
          interaction_type: interactionType,
          photos_matched: photosMatched,
          identity_accurate: identityAccurate,
          solicited_money: solicitedMoney,
          was_respectful: wasRespectful,
          notes: notes?.trim() || null,
        },
      ]);

    if (insertErr) {
      return NextResponse.json({ error: insertErr.message }, { status: 500 });
    }

    const { data: recentReports } = await supabase
      .from('date_reviews')
      .select('photos_matched, solicited_money, was_respectful')
      .eq('target_user_id', targetUserId);

    let photoMismatches = 0;
    let moneySolicitations = 0;
    let disrespectReports = 0;

    recentReports?.forEach((r) => {
      if (r.photos_matched === false) photoMismatches++;
      if (r.solicited_money === true) moneySolicitations++;
      if (r.was_respectful === false) disrespectReports++;
    });

    let newTrustStatus = 'clear';
    let advisoryPill = null;
    let advisoryMessage = null;

    if (disrespectReports >= 2 || moneySolicitations >= 2) {
      newTrustStatus = 'under_review';
      advisoryPill = 'Profile Paused';
      advisoryMessage = 'This account is currently paused while our team reviews recent feedback.';
    } else if (moneySolicitations >= 1) {
      newTrustStatus = 'financial_caution';
      advisoryPill = 'Never Send Money';
      advisoryMessage = 'Reminder: Never send money, emergency aid, or gifts to anyone on this platform.';
    } else if (photoMismatches >= 1) {
      newTrustStatus = 'visual_discrepancy';
      advisoryPill = 'Video Call First';
      advisoryMessage = 'Members suggest hopping on a quick video call before making travel or date plans.';
    }

    await supabase
      .from('profiles')
      .update({
        trust_status: newTrustStatus,
        trust_pill: advisoryPill,
        trust_advisory: advisoryMessage,
        is_verified: newTrustStatus === 'under_review' ? false : undefined,
      })
      .eq('id', targetUserId);

    return NextResponse.json({ success: true, trustStatus: newTrustStatus });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Internal Server Error' }, { status: 500 });
  }
}
