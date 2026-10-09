import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createServerClient } from '@supabase/ssr';
import { createClient } from '@supabase/supabase-js';
import { evaluateMessageModeration } from '@/lib/moderation';

const isUUID = (str: unknown) =>
  typeof str === 'string' &&
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str);

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
    const serviceClient = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // 2. Moderation Evaluation
    const mod = evaluateMessageModeration(content);

    if (!mod.isClean) {
      const { error: penErr } = await serviceClient.rpc('apply_moderation_penalty', {
        p_user_id: senderId,
        p_deduction: mod.totalDeduction,
        p_action: mod.recommendedAction,
        p_category: mod.violations.map((v) => v.category).join(','),
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
      senderProfile?.is_verified && senderProfile?.gender === 'woman';

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
      await serviceClient.from('notifications').insert({
        user_id: receiverId,
        type: 'message',
        title: 'New Message',
        description: 'You received a new message.',
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