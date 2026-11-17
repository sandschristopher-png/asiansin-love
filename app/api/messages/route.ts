import { NextResponse, after } from 'next/server';
import { notifyAdmins } from '@/lib/adminNotify';
import { assessNetwork, networkGate, recordNetworkRisk } from '@/lib/safety/vpnCheck';
import { titleForRecipient } from '@/lib/notificationTitles';
import { cookies } from 'next/headers';
import { createServerClient } from '@supabase/ssr';
import { createClient } from '@supabase/supabase-js';
import { evaluateSubstantiveConversation } from '@/lib/moderation';
import { REPUTATION_RULES, canSendMessage, decideMessageOutcome, isRestricted, scoreOf } from '@/lib/reputation';
import { applyContactRevealMask, CONTACT_UNLOCK_TURNS } from '@/lib/safety';
import { createClient as createSessionClient } from '@/lib/supabase/server';
import { sendPushToUser } from '@/lib/pushSender';
import { checkVelocity, reverificationBlocked, reverificationState } from '@/lib/verify/riskFlags';

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
    // from 20261105_voice_features.sql and deleted_by from 20261112_fix_delete_conversation.sql;
    // a column that is not migrated yet is dropped from the select and the query retried.
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
    let optionalCols = ['audio_path', 'audio_duration_ms', 'deleted_by', 'moment_id'];
    let { data: rawMessages, error: fetchError } = await fetchThread([BASE_COLS, ...optionalCols].join(', '));
    for (let attempt = 0; fetchError && attempt < optionalCols.length; attempt++) {
      const missing = optionalCols.find((c) => fetchError!.message.includes(c));
      if (!missing) break;
      optionalCols = optionalCols.filter((c) => c !== missing);
      ({ data: rawMessages, error: fetchError } = await fetchThread([BASE_COLS, ...optionalCols].join(', ')));
    }

    if (fetchError) {
      return NextResponse.json({ error: fetchError.message }, { status: 500 });
    }

    // Chronological order for the UI. The contact-unlock gate below reads the whole thread, deleted
    // messages included, so deleting a conversation never resets the safety gate.
    const messages = ((rawMessages || []) as any[]).reverse();
    const visibleMessages = messages.filter((m) => !(Array.isArray(m.deleted_by) && m.deleted_by.includes(user.id)));

    // Same unlock rule as the POST send gate: both members sent 3 distinct substantive (15+ char)
    // messages within the latest 40.
    const gate = evaluateSubstantiveConversation(messages.slice(-40), user.id, targetUserId, 15, CONTACT_UNLOCK_TURNS);
    const mutualCount = Math.min(gate.senderSubstantiveCount, gate.receiverSubstantiveCount);

    // Thumbnails for messages sent from a Moment (the photo that started the conversation).
    const momentIds = Array.from(new Set(visibleMessages.map((m) => m.moment_id).filter((v): v is string => typeof v === 'string')));
    const momentById = new Map<string, string>();
    if (momentIds.length > 0) {
      const { data: moments } = await serviceClient.from('moments').select('id, image_url, status').in('id', momentIds);
      for (const mo of (moments || []) as { id: string; image_url: string; status: string }[]) {
        if (mo.status === 'active') momentById.set(mo.id, mo.image_url);
      }
    }

    // Warning banners on the messages this member received (recipient-only table; none for their own).
    const incomingIds = visibleMessages.filter((m) => m.sender_id !== user.id).map((m) => m.id);
    const bannerByMessage = new Map<string, string>();
    if (incomingIds.length > 0) {
      const { data: flags } = await serviceClient
        .from('message_safety_flags')
        .select('message_id, category')
        .eq('receiver_id', user.id)
        .in('message_id', incomingIds);
      for (const f of (flags || []) as { message_id: string; category: string }[]) bannerByMessage.set(f.message_id, f.category);
    }

    // Mask contact info and retain is_read status
    const maskedMessages = visibleMessages.map((msg) => {
      const maskResult = applyContactRevealMask(msg.content || '', mutualCount);
      return {
        id: msg.id,
        sender: msg.sender_id === user.id ? 'me' : 'them',
        text: maskResult.text,
        createdAt: msg.created_at,
        read: Boolean(msg.is_read),
        wasMasked: maskResult.hasBlockedContent,
        safety: bannerByMessage.get(msg.id) ?? null,
        moment: msg.moment_id && momentById.has(msg.moment_id) ? { imageUrl: momentById.get(msg.moment_id) } : null,
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
    // "Spark this Moment": the photo that started the conversation (must belong to the recipient and be live).
    const momentId = typeof body.momentId === 'string' && isUUID(body.momentId) ? body.momentId : null;

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

    // 1.4 Blocks in either direction stop delivery (voice notes already check this).
    const { data: block } = await serviceClient
      .from('user_blocks')
      .select('id')
      .or(`and(blocker_id.eq.${senderId},blocked_id.eq.${receiverId}),and(blocker_id.eq.${receiverId},blocked_id.eq.${senderId})`)
      .limit(1)
      .maybeSingle();
    if (block) {
      return NextResponse.json({ error: 'You cannot message this member.' }, { status: 403 });
    }

    // 1.45 Unusual activity or a released safety hold: identity must be confirmed before sending (step-up check).
    if ((await reverificationState(serviceClient, senderId)).required) {
      return reverificationBlocked('Confirm your identity to send messages.');
    }
    after(() => checkVelocity(serviceClient, senderId)); // burst messaging / sparking flags the account

    // 1.5 Sender standing: reputation-based hourly limit (server-enforced)
    const { data: senderProfile } = await serviceClient
      .from('profiles')
      .select('is_plus, gender, is_verified, reputation_score')
      .eq('id', senderId)
      .maybeSingle();
    const senderRep = scoreOf(senderProfile?.reputation_score);

    // Network risk (lib/safety/vpnCheck.ts): a VPN asks an unverified member for a live selfie before they can
    // message; a Tor, proxy or datacenter connection also costs 15 reputation (once a day) and is flagged for
    // staff. Verified, trusted and staff accounts, and any lookup outage, are never gated.
    const net = await assessNetwork(req.headers, { userId: senderId, db: serviceClient });
    await recordNetworkRisk(serviceClient, senderId, net, {
      event: 'message',
      onAlert: () => after(() => notifyAdmins({ kind: 'moderation', ref: senderId, actorId: senderId })),
    });
    const gate = networkGate(net.tier, { verified: senderProfile?.is_verified === true, trusted: net.trusted });
    if (gate) {
      return NextResponse.json(
        { error: 'Verify with a live selfie to message from this connection.', code: gate.code },
        { status: gate.status }
      );
    }

    // Held for review after a zero-tolerance hit (account_freezes is server-only; missing table = no freezes).
    const { data: freeze } = await serviceClient
      .from('account_freezes')
      .select('user_id')
      .eq('user_id', senderId)
      .is('cleared_at', null)
      .maybeSingle();
    if (freeze) {
      return NextResponse.json(
        { error: 'Your account is under review, so messaging is paused for now.', code: 'ACCOUNT_UNDER_REVIEW' },
        { status: 403 }
      );
    }

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

        if (!isPlus && !uniqueRecipients.has(receiverId) && uniqueRecipients.size >= 5) {
          return NextResponse.json(
            {
              error: 'Daily limit reached (5/5). Upgrade to Plus for unlimited introductions.',
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

    // Zero tolerance (underage or extortion wording): nothing is sent, the score drops by 100, the account is
    // frozen for review and staff are alerted. The reply never says which words matched.
    if (decision.outcome === 'hard_block') {
      await applyPenalty();
      const { error: freezeErr } = await serviceClient
        .from('account_freezes')
        .upsert({ user_id: senderId, reason: `zero_tolerance: ${decision.flagged.join(' | ').slice(0, 200)}`, source: 'filter', cleared_at: null }, { onConflict: 'user_id' });
      if (freezeErr) console.error('[messages] could not freeze account:', freezeErr.message);
      after(() => notifyAdmins({ kind: 'moderation', ref: senderId, actorId: senderId }));
      return NextResponse.json({ error: "This message can't be sent.", code: 'SAFETY_BLOCKED' }, { status: 403 });
    }

    // High severity (scam, solicitation, explicit request, slur, threat): silently quarantine
    if (decision.outcome === 'quarantine') {
      if (await applyPenalty()) {
        return NextResponse.json({ error: 'Message could not be sent.' }, { status: 503 });
      }
      await serviceClient
        .from('messages')
        .insert([{ sender_id: senderId, receiver_id: receiverId, content, is_quarantined: true }]);
      // Staff alert: a quarantined message waits in the Chat moderation queue.
      after(() =>
        notifyAdmins({ kind: 'moderation', ref: senderId, actorId: senderId })
      );

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

    if (momentId && message?.id) {
      const { data: moment } = await serviceClient
        .from('moments')
        .select('id')
        .eq('id', momentId)
        .eq('user_id', receiverId)
        .eq('status', 'active')
        .maybeSingle();
      if (moment) {
        const { error: attachErr } = await serviceClient.from('messages').update({ moment_id: momentId }).eq('id', message.id);
        if (attachErr && !/moment_id|column/i.test(attachErr.message)) console.warn('[messages] moment attach failed:', attachErr.message);
      }
    }

    // Warning banner for the recipient: the matched category, or low reputation for a sender under review.
    // Stored apart from the message (message_safety_flags, recipient-only RLS) so the sender cannot probe it.
    const bannerCategory = decision.safetyCategory ?? (isRestricted(senderRep) ? 'low_reputation' : null);
    if (bannerCategory && message?.id) {
      const { error: flagErr } = await serviceClient
        .from('message_safety_flags')
        .insert({ message_id: message.id, receiver_id: receiverId, category: bannerCategory });
      if (flagErr && !/message_safety_flags|relation/i.test(flagErr.message)) console.warn('[messages] safety flag failed:', flagErr.message);
    }

    try {
      const { data: sender } = await serviceClient
        .from('profiles')
        .select('username, avatar_url')
        .eq('id', senderId)
        .maybeSingle();
      const senderName = sender?.username || 'Someone';
      const title = await titleForRecipient(serviceClient, receiverId, 'message', sender?.username);
      await serviceClient.from('notifications').insert({
        user_id: receiverId,
        actor_id: senderId,
        type: 'message',
        title,
        description: senderName + ' sent you a message.',
        link_url: '/messages',
      });
      await sendPushToUser({
        userId: receiverId,
        type: 'message',
        conversationId: senderId,
        actorId: senderId,
        // Composed title, then a one-line preview of the message.
        body: title + '\n' + (content.length > 120 ? content.slice(0, 117) + '...' : content),
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
