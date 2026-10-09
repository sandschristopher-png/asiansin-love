// app/api/feedback/date-review/route.ts
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createServerClient } from '@supabase/ssr';
import { createClient } from '@supabase/supabase-js';

export async function POST(req: Request) {
  try {
    // 1. Session Auth via Cookie SSR Client (Anon Key only)
    const cookieStore = await cookies();
    const sessionClient = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll();
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          },
        },
      }
    );

    const { data: { user } } = await sessionClient.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const {
      targetUserId,
      interactionType,
      photosMatched,
      identityAccurate,
      solicitedMoney,
      wasRespectful,
      notes,
    } = body;

    if (!targetUserId || !interactionType) {
      return NextResponse.json(
        { error: 'Target user ID and interaction type are required.' },
        { status: 400 }
      );
    }

    if (user.id === targetUserId) {
      return NextResponse.json(
        { error: 'Cannot review your own profile.' },
        { status: 400 }
      );
    }

    // 2. Service Role Client for Privileged DB Ops
    const serviceClient = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    // 3. Validation: target exists, verify message history (sender_id / receiver_id), pre-check duplicates
    const [targetProfileRes, interactionRes, existingReviewRes] = await Promise.all([
      serviceClient.from('profiles').select('id').eq('id', targetUserId).maybeSingle(),
      serviceClient
        .from('messages')
        .select('id')
        .or(`and(sender_id.eq.${user.id},receiver_id.eq.${targetUserId}),and(sender_id.eq.${targetUserId},receiver_id.eq.${user.id})`)
        .limit(1),
      serviceClient
        .from('date_reviews')
        .select('id')
        .eq('reviewer_id', user.id)
        .eq('target_user_id', targetUserId)
        .maybeSingle(),
    ]);

    if (!targetProfileRes.data) {
      return NextResponse.json({ error: 'Target profile not found.' }, { status: 404 });
    }

    if (!interactionRes.data || interactionRes.data.length === 0) {
      return NextResponse.json(
        { error: 'Proof of interaction required: you can only review members you have messaged.' },
        { status: 403 }
      );
    }

    if (existingReviewRes.data) {
      return NextResponse.json(
        { error: 'You have already submitted feedback for this member.' },
        { status: 409 }
      );
    }

    // 4. Strict Type Normalization: Keep nulls as null to prevent accidental false allegations
    const cleanPhotosMatched = typeof photosMatched === 'boolean' ? photosMatched : null;
    const cleanIdentityAccurate = typeof identityAccurate === 'boolean' ? identityAccurate : null;
    const cleanSolicitedMoney = typeof solicitedMoney === 'boolean' ? solicitedMoney : null;
    const cleanWasRespectful = typeof wasRespectful === 'boolean' ? wasRespectful : null;
    const cleanNotes = typeof notes === 'string' ? notes.trim().slice(0, 500) : null;

    // 5. Insert Review with 23505 Duplicate-Race Handling
    const { error: insertErr } = await serviceClient
      .from('date_reviews')
      .insert([
        {
          reviewer_id: user.id,
          target_user_id: targetUserId,
          interaction_type: interactionType,
          photos_matched: cleanPhotosMatched,
          identity_accurate: cleanIdentityAccurate,
          solicited_money: cleanSolicitedMoney,
          was_respectful: cleanWasRespectful,
          notes: cleanNotes,
        },
      ]);

    if (insertErr) {
      if (insertErr.code === '23505') {
        return NextResponse.json(
          { error: 'You have already submitted feedback for this member.' },
          { status: 409 }
        );
      }
      return NextResponse.json({ error: insertErr.message }, { status: 500 });
    }

    // 6. Aggregate historical reports for community advisory pills
    const { data: recentReports } = await serviceClient
      .from('date_reviews')
      .select('photos_matched, identity_accurate, solicited_money, was_respectful')
      .eq('target_user_id', targetUserId);

    let photoMismatches = 0;
    let identityMismatches = 0;
    let moneySolicitations = 0;
    let disrespectReports = 0;

    recentReports?.forEach((r) => {
      if (r.photos_matched === false) photoMismatches++;
      if (r.identity_accurate === false) identityMismatches++;
      if (r.solicited_money === true) moneySolicitations++;
      if (r.was_respectful === false) disrespectReports++;
    });

    let newTrustStatus = 'clear';
    let advisoryPill: string | null = null;
    let advisoryMessage: string | null = null;

    if (disrespectReports >= 2 || moneySolicitations >= 2) {
      newTrustStatus = 'under_review';
      advisoryPill = 'Profile Paused';
      advisoryMessage = 'This account is currently paused while our team reviews recent community feedback.';
    } else if (moneySolicitations >= 1) {
      newTrustStatus = 'financial_caution';
      advisoryPill = 'Never Send Money';
      advisoryMessage = 'Reminder: Never send money, emergency aid, or monetary gifts to anyone on this platform.';
    } else if (photoMismatches >= 1 || identityMismatches >= 1) {
      newTrustStatus = 'visual_discrepancy';
      advisoryPill = 'Video Call First';
      advisoryMessage = 'Members recommend having a live video call before making travel or date arrangements.';
    }

    // 7. Calculate score delta
    let delta = 0;
    if (cleanSolicitedMoney === true) {
      delta = -35;
    } else if (cleanWasRespectful === false) {
      delta = -20;
    } else if (cleanPhotosMatched === false || cleanIdentityAccurate === false) {
      delta = -15;
    } else if (cleanWasRespectful === true) {
      delta = 5;
    }

    // 8. Atomic Score Update via Database RPC
    const { data: updatedScore, error: rpcErr } = await serviceClient.rpc('apply_date_review', {
      p_target_user_id: targetUserId,
      p_delta: delta,
      p_trust_status: newTrustStatus,
      p_trust_pill: advisoryPill,
      p_trust_advisory: advisoryMessage,
    });

    if (rpcErr) {
      console.error('[date-review] apply_date_review RPC failed:', rpcErr);
      return NextResponse.json(
        { error: 'Reputation system error. Unable to update member trust status.' },
        { status: 503 }
      );
    }

    return NextResponse.json({
      success: true,
      trustStatus: newTrustStatus,
      reputationScore: updatedScore,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Internal Server Error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}