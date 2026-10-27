import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function POST(req: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { targetUserId } = await req.json()
    if (!targetUserId || targetUserId === user.id) {
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
      // Toggle off / remove spark
      await supabase.from('sparks').delete().eq('id', existing.id)
      return NextResponse.json({ sparked: false })
    }

    // Anti-spam barrier: cap outbound sparks per rolling 24h window
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
    const { count: sparksLast24h } = await supabase
      .from('sparks')
      .select('id', { count: 'exact', head: true })
      .eq('sender_id', user.id)
      .gte('created_at', twentyFourHoursAgo)

    const DAILY_SPARK_CAP = 40
    if ((sparksLast24h ?? 0) >= DAILY_SPARK_CAP) {
      return NextResponse.json({ error: 'Daily spark limit reached. Try again later.' }, { status: 429 })
    }

    // Insert new spark
    const { error: insertError } = await supabase.from('sparks').insert({
      sender_id: user.id,
      receiver_id: targetUserId,
    })

    if (insertError) {
      return NextResponse.json({ error: insertError.message }, { status: 500 })
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
        description: "You and  sparked each other. Say hi.",
        link_url: '/chat/' + user.id,
      })
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
    }

    return NextResponse.json({ sparked: true, mutual: !!mutual })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

