'use client'

import { useEffect, useState, useRef, use } from 'react'
import { createClient } from '@/utils/supabase/client'
import { scanMessageForTriggers } from '@/utils/guardian'
import { Send, ArrowLeft, ShieldAlert } from 'lucide-react'
import Link from 'next/link'

export default function ChatConversation({ params }: { params: Promise<{ userId: string }> }) {
  const { userId: partnerId } = use(params)
  const supabase = createClient()

  const [currentUserId, setCurrentUserId] = useState<string | null>(null)
  const [partnerProfile, setPartnerProfile] = useState<any>(null)
  const [messages, setMessages] = useState<any[]>([])
  const [text, setText] = useState('')
  const [loading, setLoading] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    async function init() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      setCurrentUserId(user.id)

      // Fetch partner profile
      const { data: partner } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', partnerId)
        .single()
      setPartnerProfile(partner)

      // Fetch conversation history
      const { data: history } = await supabase
        .from('messages')
        .select('*')
        .or(`and(sender_id.eq.${user.id},recipient_id.eq.${partnerId}),and(sender_id.eq.${partnerId},recipient_id.eq.${user.id})`)
        .order('created_at', { ascending: true })

      if (history) setMessages(history)
    }

    init()

    // Listen for incoming messages in real-time
    const channel = supabase
      .channel(`chat-${partnerId}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'messages' },
        (payload) => {
          const newMsg = payload.new
          if (
            (newMsg.sender_id === partnerId && newMsg.recipient_id === currentUserId) ||
            (newMsg.sender_id === currentUserId && newMsg.recipient_id === partnerId)
          ) {
            setMessages((prev) => [...prev, newMsg])
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [partnerId, currentUserId, supabase])

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!text.trim() || loading) return

    setLoading(true)

    const res = await fetch('/api/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ recipientId: partnerId, content: text }),
    })

    if (res.ok) {
      setText('')
    } else {
      const err = await res.json()
      alert(err.error || 'Failed to send message.')
    }
    setLoading(false)
  }

  return (
    <div className="flex h-screen flex-col bg-zinc-950 font-sans text-zinc-100">
      {/* Top Header */}
      <div className="flex items-center justify-between border-b border-zinc-800 bg-zinc-900/70 px-4 py-3 backdrop-blur">
        <div className="flex items-center space-x-3">
          <Link href="/inbox" className="rounded-lg p-1 text-zinc-400 hover:bg-zinc-800 hover:text-white">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div className="h-9 w-9 overflow-hidden rounded-full bg-zinc-800">
            {partnerProfile?.avatar_url ? (
              <img src={partnerProfile.avatar_url} alt="" className="h-full w-full object-cover" />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-xs text-zinc-500">?</div>
            )}
          </div>
          <div>
            <h2 className="text-sm font-semibold text-white">{partnerProfile?.display_name || 'Member'}</h2>
            <p className="text-[11px] text-zinc-400">{partnerProfile?.city ? `${partnerProfile.city}, ` : ''}{partnerProfile?.country || ''}</p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-2.5 py-1 text-[11px] font-medium text-emerald-400">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
          <span>Guardian Active</span>
        </div>
      </div>

      {/* Messages Feed */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((m) => {
          const isMe = m.sender_id === currentUserId
          const trigger = !isMe ? scanMessageForTriggers(m.content) : null

          return (
            <div key={m.id} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
              <div
                className={`max-w-[80%] rounded-2xl px-4 py-2 text-sm leading-relaxed ${
                  isMe
                    ? 'bg-rose-600 text-white rounded-br-none'
                    : 'bg-zinc-900 border border-zinc-800 text-zinc-100 rounded-bl-none'
                }`}
              >
                {m.content}
              </div>

              {/* Smart Guardian Scam/External Advisory */}
              {trigger && (
                <div className="mt-1.5 flex max-w-[80%] items-start gap-2 rounded-xl border border-amber-900/60 bg-amber-950/40 p-2.5 text-xs text-amber-200">
                  <ShieldAlert className="h-4 w-4 shrink-0 text-amber-400 mt-0.5" />
                  <div>
                    <span className="font-semibold text-amber-300">{trigger.warningTitle}: </span>
                    <span>{trigger.warningAdvice}</span>
                  </div>
                </div>
              )}
            </div>
          )
        })}
        <div ref={scrollRef} />
      </div>

      {/* Input */}
      <form onSubmit={handleSend} className="border-t border-zinc-800 bg-zinc-900/80 p-3">
        <div className="flex items-center space-x-2">
          <input
            type="text"
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Type your message..."
            className="flex-1 rounded-full border border-zinc-700 bg-zinc-800 px-4 py-2 text-sm text-white placeholder-zinc-500 focus:border-rose-500 focus:outline-none"
          />
          <button
            type="submit"
            disabled={loading}
            className="flex h-9 w-9 items-center justify-center rounded-full bg-rose-600 text-white hover:bg-rose-500 disabled:opacity-50 transition"
          >
            <Send className="h-4 w-4" />
          </button>
        </div>
      </form>
    </div>
  )
}