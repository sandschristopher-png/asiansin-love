import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createServerClient } from '@supabase/ssr';
import { createClient } from '@supabase/supabase-js';
import { evaluateMessageModeration, hasContactSharingIntent, evaluateSubstantiveConversation } from '@/lib/moderation';
import { applyContactRevealMask } from '@/lib/safety';
import { createClient as createSessionClient } from '@/lib/supabase/server';

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

    // Single consolidated query: fetch latest 60 messages descending
    const { data: rawMessages, error: fetchError } = await serviceClient
      .from('messages')
      .select('id, sender_id, receiver_id, content, created_at, is_quarantined, is_read')
      .in('sender_id', pairFilter)
      .in('receiver_id', pairFilter)
      .eq('is_quarantined', false)
      .order('created_at', { ascending: false })
      .limit(60);

    if (fetchError) {
      return NextResponse.json({ error: fetchError.message }, { status: 500 });
    }

    // Chronological order for the UI
    const messages = (rawMessages || []).reverse();

    // Calculate substantive mutual count from the latest 40 messages
    const sample = messages.slice(-40);
    let senderCount = 0;
    let receiverCount = 0;
    for (const msg of sample) {
      if ((msg.content || '').trim().length >= 15) {
        if (msg.sender_id === user.id) senderCount++;
        else if (msg.sender_id === targetUserId) receiverCount++;
      }
    }
    const mutualCount = Math.min(senderCount, receiverCount);

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
      };
    });

    return NextResponse.json({
      success: true,
      messages: maskedMessages,
      mutualCount,
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

        // 1.5 Substantive Courtship & Contact Gate Check
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
      3
    );

    // If message contains contact sharing (phone, WA, TG, socials) and threshold is not met:
    if (hasContactSharingIntent(content) && !substantiveCheck.isUnlocked) {
      return NextResponse.json(
        {
          error: `To protect our members from impersonation and off-platform scams, external contact sharing unlocks after both of you have exchanged at least 3 substantive messages (15+ characters). Progress: You (${substantiveCheck.senderSubstantiveCount}/3) • Partner (${substantiveCheck.receiverSubstantiveCount}/3).`,
          courtshipLocked: true,
          progress: {
            sender: substantiveCheck.senderSubstantiveCount,
            partner: substantiveCheck.receiverSubstantiveCount,
            required: 3,
          },
        },
        { status: 400 }
      );
    }

    // 2. Moderation Evaluation
    const mod = evaluateMessageModeration(content, substantiveCheck.isUnlocked);

    if (!mod.isClean) {
      const { error: penErr } = await serviceClient.rpc('apply_moderation_penalty', {
        p_user_id: senderId,
        p_deduction: mod.totalDeduction,
        p_action: mod.recommendedAction,
        p_category: mod.violations.map((v: any) => v.category).join(','),
        p_flagged: mod.flaggedPhrases.join(' | ').slice(0, 300),
      });

      if (penErr) {
        console.error('Moderation penalty RPC failed:', penErr.message);
        return NextResponse.json({ error: 'Message could not be sent.' }, { status: 503 });
      }

      // Warn Tier: deliver message, receiver sees caution banner
      if (mod.recommendedAction === 'warn') {
        const { data: message, error: insertError } = await serviceClient
          .from('messages')
          .insert([{ sender_id: senderId, receiver_id: receiverId, content, is_quarantined: false }])
          .select()
          .single();

        if (insertError) {
          return NextResponse.json({ error: insertError.message }, { status: 500 });
        }

        return NextResponse.json({
          success: true,
          message,
          warning: 'Safety advisory: conversation partner messages triggered caution filters.',
        });
      }

      // Shadowban / Suspend Tier: Silently quarantine
      await serviceClient
        .from('messages')
        .insert([{ sender_id: senderId, receiver_id: receiverId, content, is_quarantined: true }]);

      return NextResponse.json({ success: true, delivered: true });
    }

    // 3. Daily Outreach Limits
    const { data: senderProfile } = await serviceClient
      .from('profiles')
      .select('is_plus, gender, is_verified')
      .eq('id', senderId)
      .maybeSingle();

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

      if (!mutualReply) {
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

    // 4. Clean Delivery
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
    } catch {
      // Non-blocking notification dispatch
    }

    return NextResponse.json({ success: true, message });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Internal Server Error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
