import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createServerClient } from '@supabase/ssr';
import { createClient } from '@supabase/supabase-js';
import { evaluateSubstantiveConversation } from '@/lib/moderation';
import { REPUTATION_RULES, canSendMessage, decideMessageOutcome, isRestricted, scoreOf } from '@/lib/reputation';
import { applyContactRevealMask, CONTACT_UNLOCK_TURNS } from '@/lib/safety';
import { createClient as createSessionClient } from '@/lib/supabase/server';
import { sendPushToUser } from '@/lib/pushSender';

const isUUID = (str: unknown) =>
  typeof str === 'string' &&
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str);


export async function GET(req: Request) {
  try {
    const sessionClient = await createSessionClient();
    const {
      data: { user },
    } = await sessionClient.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const targetUserId = searchParams.get('target_user_id');

    if (!targetUserId || !isUUID(targetUserId) || targetUserId === user.id) {
      return NextResponse.json({ error: 'Invalid target.' }, { status: 400 });
    }

    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!serviceRoleKey) {
      console.error('Server configuration error: SUPABASE_SERVICE_ROLE_KEY is missing.');
      return NextResponse.json({ error: 'Unable to load messages right now.' }, { status: 500 });
    }
    const serviceClient = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, serviceRoleKey);

    const pairFilter = [user.id, targetUserId];

    // Single consolidated query: fetch latest 60 messages descending. Voice-note columns come
    // from 20261105_voice_features.sql; until that migration runs, fall back to text-only.
    const BASE_COLS = 'id, sender_id, receiver_id, content, created_at, is_quarantined, is_read';
    const fetchThread = (cols: string) =>
      serviceClient
        .from('messages')
        .select(cols)
        .in('sender_id', pairFilter)
        .in('receiver_id', pairFilter)
        .eq('is_quarantined', false)
        .order('created_at', { ascending: false })
        .limit(60);
    let { data: rawMessages, error: fetchError } = await fetchThread(BASE_COLS + ', audio_path, audio_duration_ms');
    if (fetchError && /audio_path|audio_duration_ms/.test(fetchError.message)) {
      ({ data: rawMessages, error: fetchError } = await fetchThread(BASE_COLS));
    }

    if (fetchError) {
      return NextResponse.json({ error: fetchError.message }, { status: 500 });
    }

    // Chronological order for the UI
    const messages = ((rawMessages || []) as any[]).reverse();

    // Same unlock rule as the POST send gate: both members sent 3 distinct substantive (15+ char)
    // messages within the latest 40.
    const gate = evaluateSubstantiveConversation(messages.slice(-40), user.id, targetUserId, 15, CONTACT_UNLOCK_TURNS);
    const mutualCount = Math.min(gate.senderSubstantiveCount, gate.receiverSubstantiveCount);

    // Mask contact info and retain is_read status
    const maskedMessages = messages.map((msg) => {
      const maskResult = applyContactRevealMask(msg.content || '', mutualCount);
      return {
        id: msg.id,
        sender: msg.sender_id === user.id ? 'me' : 'them',
        text: maskResult.text,
        createdAt: msg.created_at,
        read: Boolean(msg.is_read),
        wasMasked: maskResult.hasBlockedContent,
        // Voice notes: the client fetches a signed URL from /api/messages/voice?id=...
        hasAudio: Boolean(msg.audio_path),
        audioDurationMs: msg.audio_duration_ms ?? null,
      };
    });

    return NextResponse.json({
      success: true,
      messages: maskedMessages,
      mutualCount,
      // Safety-gate progress for the chat composer badge.
      senderCount: Math.min(gate.senderSubstantiveCount, CONTACT_UNLOCK_TURNS),
      partnerCount: Math.min(gate.receiverSubstantiveCount, CONTACT_UNLOCK_TURNS),
      contactUnlocked: gate.isUnlocked,
    });
  } catch (err: any) {
    console.error('GET /api/messages error:', err);
    return NextResponse.json({ error: 'Internal error.' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    // 1. Session auth - sender identity comes strictly from the cookie
    const cookieStore = await cookies();
    const sessionClient = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll();
          },
          setAll(toSet) {
            toSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          },
        },
      }
    );

    const {
      data: { user },
    } = await sessionClient.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { receiverId } = body;
    const content = typeof body.content === 'string' ? body.content.trim() : '';

    if (!receiverId || !content) {
      return NextResponse.json({ error: 'Missing message parameters.' }, { status: 400 });
    }

    if (!isUUID(receiverId) || receiverId === user.id) {
      return NextResponse.json({ error: 'Invalid recipient.' }, { status: 400 });
    }

    const senderId = user.id;

    // Service client for atomic RPCs and quarantine writes
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!serviceRoleKey) {
      console.error('Server configuration error: SUPABASE_SERVICE_ROLE_KEY is missing.');
      return NextResponse.json(
        { error: 'Unable to deliver message right now. Please try again in a moment.' },
        { status: 500 }
      );
    }

    const serviceClient = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      serviceRoleKey
    );

    // 1.5 Sender standing: reputation-based hourly limit (server-enforced)
    const { data: senderProfile } = await serviceClient
      .from('profiles')
      .select('is_plus, gender, is_verified, reputation_score')
      .eq('id', senderId)
      .maybeSingle();
    const senderRep = scoreOf(senderProfile?.reputation_score);

    if (isRestricted(senderRep)) {
      const { count: sentLastHour } = await serviceClient
        .from('messages')
        .select('id', { count: 'exact', head: true })
        .eq('sender_id', senderId)
        .gte('created_at', new Date(Date.now() - 60 * 60 * 1000).toISOString());
      if (!canSendMessage(senderRep, sentLastHour ?? 0)) {
        return NextResponse.json(
          {
            error: `Your account is under review, so you can send up to ${REPUTATION_RULES.restrictedMessagesPerHour} messages per hour. Keep conversations friendly and your reputation recovers over time.`,
            code: 'REPUTATION_RATE_LIMIT',
          },
          { status: 429 }
        );
      }
    }

    // 2. Daily Outreach Limits
    const isPlus = Boolean(senderProfile?.is_plus);
    const isVerifiedWoman =
      senderProfile?.is_verified && senderProfile?.gender === 'female';

    if (!isPlus && !isVerifiedWoman) {
      const { data: mutualReply } = await serviceClient
        .from('messages')
        .select('id')
        .eq('sender_id', receiverId)
        .eq('receiver_id', senderId)
        .limit(1)
        .maybeSingle();

      // A mutual Spark (both sparked each other) is a match: messaging it is unlimited for everyone.
      const { data: theirSpark } = mutualReply
        ? { data: null }
        : await serviceClient
            .from('sparks')
            .select('id')
            .eq('sender_id', receiverId)
            .eq('receiver_id', senderId)
            .limit(1)
            .maybeSingle();
      const { data: mySpark } = mutualReply || !theirSpark
        ? { data: null }
        : await serviceClient
            .from('sparks')
            .select('id')
            .eq('sender_id', senderId)
            .eq('receiver_id', receiverId)
            .limit(1)
            .maybeSingle();
      const isMutualMatch = Boolean(theirSpark && mySpark);

      if (!mutualReply && !isMutualMatch) {
        const startOfToday = new Date();
        startOfToday.setUTCHours(0, 0, 0, 0);

        const { data: messagesToday } = await serviceClient
          .from('messages')
          .select('receiver_id')
          .eq('sender_id', senderId)
          .gte('created_at', startOfToday.toISOString());

        const uniqueRecipients = new Set((messagesToday || []).map((m: any) => m.receiver_id));

        if (!uniqueRecipients.has(receiverId) && uniqueRecipients.size >= 5) {
          return NextResponse.json(
            {
              error: 'Daily limit reached (5/5). Upgrade to AIL Plus for unlimited introductions.',
              code: 'OUTREACH_LIMIT_REACHED',
            },
            { status: 403 }
          );
        }
      }
    }

    // 3. Substantive Courtship & Contact Gate + Moderation (raw, normalized and collapsed text)
    const { data: threadHistory } = await serviceClient
      .from('messages')
      .select('sender_id, content')
      .in('sender_id', [senderId, receiverId])
      .in('receiver_id', [senderId, receiverId])
      .eq('is_quarantined', false)
      .order('created_at', { ascending: false })
      .limit(40);

    const substantiveCheck = evaluateSubstantiveConversation(
      threadHistory || [],
      senderId,
      receiverId,
      15,
      CONTACT_UNLOCK_TURNS
    );

    const decision = decideMessageOutcome(content, substantiveCheck.isUnlocked);
    const applyPenalty = async () => {
      if (decision.deduction <= 0) return null;
      const { error: penErr } = await serviceClient.rpc('apply_moderation_penalty', {
        p_user_id: senderId,
        p_deduction: decision.deduction,
        p_action: decision.outcome,
        p_category: decision.category,
        p_flagged: decision.flagged.join(' | ').slice(0, 300),
      });
      if (penErr) console.error('Moderation penalty RPC failed:', penErr.message);
      return penErr;
    };

    // High severity (scam, solicitation, explicit request, slur, threat): silently quarantine
    if (decision.outcome === 'quarantine') {
      if (await applyPenalty()) {
        return NextResponse.json({ error: 'Message could not be sent.' }, { status: 503 });
      }
      await serviceClient
        .from('messages')
        .insert([{ sender_id: senderId, receiver_id: receiverId, content, is_quarantined: true }]);

      return NextResponse.json({ success: true, delivered: true });
    }

    // Contact details before both members sent 3 substantive messages: friendly soft block
    // (obfuscated attempts also cost reputation).
    if (decision.outcome === 'soft_block') {
      await applyPenalty();
      return NextResponse.json(
        {
          error: `To protect our members from impersonation and off-platform scams, external contact sharing unlocks after both of you have exchanged at least ${CONTACT_UNLOCK_TURNS} substantive messages (15+ characters). Progress: You (${substantiveCheck.senderSubstantiveCount}/${CONTACT_UNLOCK_TURNS}) • Partner (${substantiveCheck.receiverSubstantiveCount}/${CONTACT_UNLOCK_TURNS}).`,
          courtshipLocked: true,
          progress: {
            sender: substantiveCheck.senderSubstantiveCount,
            partner: substantiveCheck.receiverSubstantiveCount,
            required: CONTACT_UNLOCK_TURNS,
          },
        },
        { status: 400 }
      );
    }

    // Medium severity: deliver, receiver sees a caution banner
    const warning =
      decision.outcome === 'deliver_with_warning'
        ? 'Safety advisory: conversation partner messages triggered caution filters.'
        : undefined;
    if (warning) await applyPenalty();

    // 4. Delivery
    const { data: message, error: insertError } = await serviceClient
      .from('messages')
      .insert([{ sender_id: senderId, receiver_id: receiverId, content, is_quarantined: false }])
      .select()
      .single();

    if (insertError) {
      return NextResponse.json({ error: insertError.message }, { status: 500 });
    }

    try {
      const { data: sender } = await serviceClient
        .from('profiles')
        .select('username, avatar_url')
        .eq('id', senderId)
        .maybeSingle();
      const senderName = sender?.username || 'Someone';
      await serviceClient.from('notifications').insert({
        user_id: receiverId,
        actor_id: senderId,
        type: 'message',
        title: 'New Message',
        description: senderName + ' sent you a message.',
        link_url: '/messages',
      });
      await sendPushToUser({
        userId: receiverId,
        type: 'message',
        conversationId: senderId,
      }).catch((e) => console.error('[Push] message error:', e));
    } catch {
      // Non-blocking notification dispatch
    }

    // Daily reputation recovery (+1, once per UTC day) for unflagged mutual chatting. The RPC checks
    // mutuality and flags itself; it is missing until 20261106_reputation_rhythm.sql runs.
    if (!warning && senderRep < REPUTATION_RULES.max) {
      const { error: recErr } = await serviceClient.rpc('apply_reputation_recovery', {
        p_user_id: senderId,
        p_partner_id: receiverId,
      });
      if (recErr && !/apply_reputation_recovery|function/i.test(recErr.message)) {
        console.warn('[messages] reputation recovery failed:', recErr.message);
      }
    }

    return NextResponse.json(warning ? { success: true, message, warning } : { success: true, message });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Internal Server Error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
