'use client'

import { useState, useEffect, useRef, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { createClient } from '@/utils/supabase/client'
import Link from 'next/link'
import { Logo } from '@/components/Logo'
import { ArrowLeft, Send, ShieldAlert, Loader2, User } from 'lucide-react'

interface Message {
  id: string
  sender_id: string
  receiver_id: string
  content: string
  created_at: string
}

interface ChatContact {
  id: string
  display_name: string
  avatar_url: string
  city: string
  country: string
}

function MessagesComponent() {
  const searchParams = useSearchParams()
  const targetUserId = searchParams.get('user')
  const router = useRouter()
  const supabase = createClient()

  const [currentUserId, setCurrentUserId] = useState<string | null>(null)
  const [activePartner, setActivePartner] = useState<ChatContact | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [inputContent, setInputContent] = useState('')
  const [sending, setSending] = useState(false)
  const [warningMsg, setWarningMsg] = useState('')

  const scrollRef = useRef<HTMLDivElement>(null)

  // 1. Authenticate user & load contact
  useEffect(() => {
    async function initUser() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/login')
        return
      }
      setCurrentUserId(user.id)

      if (targetUserId) {
        const { data: partner } = await supabase
          .from('profiles')
          .select('id, display_name, avatar_url, city, country')
          .eq('id', targetUserId)
          .maybeSingle()

        if (partner) setActivePartner(partner)
      }
    }
    initUser()
  }, [router, supabase, targetUserId])

  // 2. Fetch existing message thread & listen to Realtime updates
  useEffect(() => {
    if (!currentUserId || !targetUserId) return

    async function fetchMessages() {
      const { data } = await supabase
        .from('messages')
        .select('*')
        .or(`and(sender_id.eq.${currentUserId},receiver_id.eq.${targetUserId}),and(sender_id.eq.${targetUserId},receiver_id.eq.${currentUserId})`)
        .order('created_at', { ascending: true })

      if (data) setMessages(data)
    }

    fetchMessages()

    const channel = supabase
      .channel('public:messages')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' }, (payload) => {
        const newMsg = payload.new as Message
        if (
          (newMsg.sender_id === currentUserId && newMsg.receiver_id === targetUserId) ||
          (newMsg.sender_id === targetUserId && newMsg.receiver_id === currentUserId)
        ) {
          setMessages((prev) => [...prev, newMsg])
        }
      })
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [currentUserId, targetUserId, supabase])

  // Scroll to bottom on new messages
  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // 3. Smart Guardian scam keyword & off-platform redirect interceptor
  const screenMessageForScams = (text: string): string | null => {
    const lower = text.toLowerCase()
    const triggers = ['crypto', 'usdt', 'binance', 'telegram', 'whatsapp', 'investment', 'western union', 'send money']
    for (const trigger of triggers) {
      if (lower.includes(trigger)) {
        return `Guardian Shield: For your safety, sharing external financial handles (${trigger}) is flagged to protect users against wire fraud and scams.`
      }
    }
    return null
  }

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!inputContent.trim() || !currentUserId || !targetUserId) return

    setWarningMsg('')
    const guardWarning = screenMessageForScams(inputContent)
    if (guardWarning) {
      setWarningMsg(guardWarning)
    }

    setSending(true)
    const textToSend = inputContent.trim()
    setInputContent('')

    const { error } = await supabase.from('messages').insert({
      sender_id: currentUserId,
      receiver_id: targetUserId,
      content: textToSend,
    })

    setSending(false)
    if (error) {
      setWarningMsg(error.message)
    }
  }

  return (
    <div className="flex h-dvh flex-col bg-[#fafaf9] font-sans text-stone-900 selection:bg-rose-500 selection:text-white">
      {/* Header */}
      <header className="flex h-14 shrink-0 items-center justify-between border-b border-stone-200 bg-white px-4">
        <div className="flex items-center gap-3">
          <Link href="/browse" className="text-stone-500 hover:text-stone-900 transition">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          {activePartner ? (
            <div className="flex items-center gap-2">
              <img
                src={activePartner.avatar_url || '/placeholder.png'}
                alt={activePartner.display_name}
                className="h-8 w-8 rounded-full object-cover border border-stone-200"
              />
              <div>
                <h2 className="text-xs font-bold leading-tight text-stone-900">{activePartner.display_name}</h2>
                <span className="text-[10px] text-stone-500 leading-none">{activePartner.city}, {activePartner.country}</span>
              </div>
            </div>
          ) : (
            <Logo className="h-6 w-6" textSize="text-base" />
          )}
        </div>
        <Link href="/browse" className="text-xs font-semibold text-rose-600 hover:underline">
          Directory
        </Link>
      </header>

      {/* Message Stream */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {warningMsg && (
          <div className="sticky top-2 z-10 flex items-start gap-2 rounded-xl border border-amber-300 bg-amber-50 p-3 text-xs text-amber-900 shadow-sm">
            <ShieldAlert className="h-4 w-4 shrink-0 text-amber-600 mt-0.5" />
            <div className="leading-snug">{warningMsg}</div>
          </div>
        )}

        {messages.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center text-center text-xs text-stone-400 space-y-2">
            <User className="h-8 w-8 text-stone-300" />
            <p>Start a respectful and authentic conversation with {activePartner?.display_name || 'this member'}.</p>
          </div>
        ) : (
          messages.map((m) => {
            const isMe = m.sender_id === currentUserId
            return (
              <div key={m.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                <div
                  className={`max-w-[75%] rounded-2xl px-4 py-2.5 text-xs leading-relaxed shadow-2xs ${
                    isMe
                      ? 'bg-rose-600 text-white rounded-br-xs'
                      : 'border border-stone-200 bg-white text-stone-800 rounded-bl-xs'
                  }`}
                >
                  {m.content}
                </div>
              </div>
            )
          })
        )}
        <div ref={scrollRef} />
      </div>

      {/* Compose Bar */}
      <footer className="border-t border-stone-200 bg-white p-3">
        <form onSubmit={handleSendMessage} className="mx-auto flex max-w-2xl items-center gap-2">
          <input
            type="text"
            value={inputContent}
            onChange={(e) => setInputContent(e.target.value)}
            placeholder="Type a respectful message..."
            className="flex-1 rounded-xl border border-stone-300 bg-[#fafaf9] px-4 py-2.5 text-xs text-stone-900 placeholder-stone-400 focus:border-rose-500 focus:bg-white focus:outline-none transition"
          />
          <button
            type="submit"
            disabled={sending || !inputContent.trim()}
            className="flex h-9 w-9 items-center justify-center rounded-xl bg-rose-600 text-white hover:bg-rose-500 transition disabled:opacity-50"
          >
            {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          </button>
        </form>
      </footer>
    </div>
  )
}

export default function MessagesPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-xs text-stone-400">Loading messages...</div>}>
      <MessagesComponent />
    </Suspense>
  )
}