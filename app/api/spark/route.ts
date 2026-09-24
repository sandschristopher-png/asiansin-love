import { createClient } from '@/utils/supabase/server'
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

    // Insert new spark
    const { error: insertError } = await supabase.from('sparks').insert({
      sender_id: user.id,
      receiver_id: targetUserId,
    })

    if (insertError) {
      return NextResponse.json({ error: insertError.message }, { status: 500 })
    }

    // Log notification for recipient
    await supabase.from('notifications').insert({
      user_id: targetUserId,
      actor_id: user.id,
      type: 'spark',
    })

    // Check if mutual spark exists
    const { data: mutual } = await supabase
      .from('sparks')
      .select('id')
      .eq('sender_id', targetUserId)
      .eq('receiver_id', user.id)
      .maybeSingle()

    return NextResponse.json({ sparked: true, mutual: !!mutual })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
