import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { sendPushToUser } from '@/lib/pushSender'
import { isPlusProfile } from '@/lib/plus'
import { FREE_DAILY_SPARKS, PLUS_DAILY_SPARK_FAIR_USE } from '@/lib/plusPlans'

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

    // Check if spark exists
    const { data: existing } = await supabase
      .from('sparks')
      .select('id')
      .eq('sender_id', user.id)
      .eq('receiver_id', targetUserId)
      .maybeSingle()

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
      const { data: mutualExisting } = await supabase
        .from('sparks')
        .select('id')
        .eq('sender_id', targetUserId)
        .eq('receiver_id', user.id)
        .maybeSingle()
      return NextResponse.json({ success: true, sparked: true, is_mutual: !!mutualExisting, mutual: !!mutualExisting })
    }

    // Anti-spam barrier: cap outbound sparks per rolling 24h window
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
    const { count: sparksLast24h } = await supabase
      .from('sparks')
      .select('id', { count: 'exact', head: true })
      .eq('sender_id', user.id)
      .gte('created_at', twentyFourHoursAgo)

    // Free: 20 Sparks / 24h. Plus: unlimited (a fair-use ceiling only stops scripted abuse).
    const { data: me } = await supabase.from('profiles').select('*').eq('id', user.id).maybeSingle()
    const plus = isPlusProfile(me)
    const DAILY_SPARK_CAP = plus ? PLUS_DAILY_SPARK_FAIR_USE : FREE_DAILY_SPARKS
    if ((sparksLast24h ?? 0) >= DAILY_SPARK_CAP) {
      return NextResponse.json(
        {
          error: plus
            ? 'You have sent a lot of Sparks today. Take a break and try again later.'
            : `You've used your ${FREE_DAILY_SPARKS} Sparks for today. Plus members get unlimited Sparks.`,
          code: plus ? 'SPARK_FAIR_USE' : 'SPARK_LIMIT_FREE',
        },
        { status: 429 }
      )
    }

    // Insert new spark
    const { error: insertError } = await supabase.from('sparks').insert({
      sender_id: user.id,
      receiver_id: targetUserId,
    })

    if (insertError) {
      console.error('[api/spark] insert into sparks failed:', insertError.code, insertError.message, insertError.details)
      return NextResponse.json({ error: 'Could not send your Spark. Please try again.' }, { status: 500 })
    }

    // Check if mutual spark exists
    const { data: mutual } = await supabase
      .from('sparks')
      .select('id')
      .eq('sender_id', targetUserId)
      .eq('receiver_id', user.id)
      .maybeSingle()

    // Hydrate sender identity for the notification copy
    const { data: senderProfile } = await supabase
      .from('profiles')
      .select('username, avatar_url')
      .eq('id', user.id)
      .maybeSingle()
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

