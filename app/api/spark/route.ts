import { createClient } from '@/lib/supabase/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'
import { sendPushToUser } from '@/lib/pushSender'
import { FREE_DAILY_SPARKS } from '@/lib/plusPlans'

// POST { targetUserId, action?: 'spark' | 'toggle' }
//   Writes public.sparks (sender_id = me, receiver_id = target); /favorites "You Sparked" reads
//   the same rows. 'spark' (default, Discover) is idempotent: an existing spark is kept, never
//   removed, so a stale card can't silently undo it. 'toggle' (profile page button) un-sparks.
//   -> { success, sparked, is_mutual, mutual }

export async function POST(req: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json().catch(() => ({}))
    const targetUserId: unknown = body?.targetUserId
    const action: 'spark' | 'toggle' = body?.action === 'toggle' ? 'toggle' : 'spark'
    if (typeof targetUserId !== 'string' || !targetUserId || targetUserId === user.id) {
      return NextResponse.json({ error: 'Invalid target user' }, { status: 400 })
    }

    // Every read this request needs, in one parallel round trip: my existing Spark, theirs (mutual),
    // the daily allowance and my username for the notification. Each is an indexed single-row
    // lookup (sparks: sender_id, created_at; get_spark_allowance exits early for exempt members).
    // Blocks are checked with the service role: a member's own session cannot see who blocked them.
    const service = createServiceClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
      auth: { persistSession: false },
    })
    const [{ data: existing }, { data: reverseSpark }, allowanceResult, { data: senderProfile }, { data: block }] = await Promise.all([
      supabase.from('sparks').select('id').eq('sender_id', user.id).eq('receiver_id', targetUserId).maybeSingle(),
      supabase.from('sparks').select('id').eq('sender_id', targetUserId).eq('receiver_id', user.id).maybeSingle(),
      supabase.rpc('get_spark_allowance', { p_user_id: user.id }),
      supabase.from('profiles').select('username').eq('id', user.id).maybeSingle(),
      service
        .from('user_blocks')
        .select('id')
        .or(`and(blocker_id.eq.${user.id},blocked_id.eq.${targetUserId}),and(blocker_id.eq.${targetUserId},blocked_id.eq.${user.id})`)
        .limit(1)
        .maybeSingle(),
    ])

    // Un-sparking is always allowed; a new Spark to or from a blocked member is not.
    if (block && !(existing && action === 'toggle')) {
      return NextResponse.json({ error: 'You cannot Spark this member.', code: 'BLOCKED' }, { status: 403 })
    }

    if (existing) {
      if (action === 'toggle') {
        const { error: deleteError } = await supabase.from('sparks').delete().eq('id', existing.id)
        if (deleteError) {
          console.error('[api/spark] un-spark failed:', deleteError.message)
          return NextResponse.json({ error: 'Could not remove your Spark.' }, { status: 500 })
        }
        return NextResponse.json({ success: true, sparked: false, is_mutual: false, mutual: false })
      }
      // Already sparked: keep it and report the current mutual state.
      return NextResponse.json({ success: true, sparked: true, is_mutual: !!reverseSpark, mutual: !!reverseSpark })
    }

    // The rolling 24h allowance lives in one place: public.get_spark_allowance (free: 30; Plus
    // members and women are exempt). If the check itself fails, the Spark still goes through.
    const { data: allowance, error: allowanceError } = allowanceResult
    if (allowanceError) console.error('[api/spark] allowance check failed:', allowanceError.message)
    if (!allowanceError && allowance?.allowed === false) {
      return NextResponse.json(
        {
          error: `You've used your ${FREE_DAILY_SPARKS} Sparks for today. Plus members get unlimited Sparks.`,
          code: 'QUOTA_EXCEEDED',
        },
        { status: 429 }
      )
    }

    // Insert new spark
    const { error: insertError } = await supabase.from('sparks').insert({
      sender_id: user.id,
      receiver_id: targetUserId,
    })

    // 23505: a second tap raced this one and its insert won; the Spark exists, so report success.
    if (insertError?.code === '23505') {
      return NextResponse.json({ success: true, sparked: true, is_mutual: !!reverseSpark, mutual: !!reverseSpark })
    }
    if (insertError) {
      console.error('[api/spark] insert into sparks failed:', insertError.code, insertError.message, insertError.details)
      return NextResponse.json({ error: 'Could not send your Spark. Please try again.' }, { status: 500 })
    }

    const mutual = reverseSpark
    const senderName = senderProfile?.username || 'Someone'

    if (mutual) {
      // It's a match - notify the recipient with match framing
      await supabase.from('notifications').insert({
        user_id: targetUserId,
        actor_id: user.id,
        type: 'match',
        title: "It's a Match!",
        description: `You and ${senderName} sparked each other. Say hi.`,
        link_url: '/chat/' + user.id,
      })
      await sendPushToUser({
        userId: targetUserId,
        type: 'match',
      }).catch((e) => console.error('[Push] spark match error:', e))
    } else {
      // Regular spark - actor-aware copy
      await supabase.from('notifications').insert({
        user_id: targetUserId,
        actor_id: user.id,
        type: 'favorite',
        title: 'New Spark',
        description: senderName + ' sparked your profile.',
        link_url: '/favorites',
      })
      await sendPushToUser({
        userId: targetUserId,
        type: 'spark',
      }).catch((e) => console.error('[Push] spark regular error:', e))
    }

    return NextResponse.json({ success: true, sparked: true, is_mutual: !!mutual, mutual: !!mutual })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

