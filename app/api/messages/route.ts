import { createClient } from '@/utils/supabase/server'
import { containsEarlyOffPlatformInfo } from '@/utils/guardian'
import { NextResponse } from 'next/server'

export async function POST(req: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { recipientId, content } = await req.json()

  if (!recipientId || !content?.trim()) {
    return NextResponse.json({ error: 'Missing recipient or content' }, { status: 400 })
  }

  // Check previous messages between users
  const { data: previousMessages } = await supabase
    .from('messages')
    .select('id, sender_id')
    .or(`and(sender_id.eq.${user.id},recipient_id.eq.${recipientId}),and(sender_id.eq.${recipientId},recipient_id.eq.${user.id})`)

  const mySentCount = previousMessages?.filter((m) => m.sender_id === user.id).length || 0
  const partnerSentCount = previousMessages?.filter((m) => m.sender_id === recipientId).length || 0

  const isEarlyChat = mySentCount < 3 || partnerSentCount < 3

  if (isEarlyChat && containsEarlyOffPlatformInfo(content)) {
    return NextResponse.json(
      {
        error: 'To prevent spam and keep members safe, phone numbers and WhatsApp handles can only be shared after both members exchange at least 3 messages.',
      },
      { status: 400 }
    )
  }

  // Insert message directly into Supabase
  const { data: message, error } = await supabase
    .from('messages')
    .insert({
      sender_id: user.id,
      recipient_id: recipientId,
      content: content.trim(),
    })
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ data: message })
}