import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { MessageSquare, ArrowLeft, Heart } from 'lucide-react'

export default async function InboxPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    redirect('/login')
  }

  // Fetch all messages involving the current user
  const { data: messages } = await supabase
    .from('messages')
    .select('*, sender:profiles!messages_sender_id_fkey(id, display_name, avatar_url, country), recipient:profiles!messages_recipient_id_fkey(id, display_name, avatar_url, country)')
    .or(`sender_id.eq.${user.id},recipient_id.eq.${user.id}`)
    .order('created_at', { ascending: false })

  // Deduplicate conversations to show latest message per match
  const conversationMap = new Map<string, any>()

  messages?.forEach((msg) => {
    const isSender = msg.sender_id === user.id
    const partner = isSender ? msg.recipient : msg.sender
    if (partner && !conversationMap.has(partner.id)) {
      conversationMap.set(partner.id, {
        partner,
        lastMessage: msg.content,
        timestamp: msg.created_at,
      })
    }
  })

  const conversations = Array.from(conversationMap.values())

  return (
    <div className="min-h-screen bg-zinc-950 font-sans text-zinc-100">
      <header className="sticky top-0 z-50 border-b border-zinc-800 bg-zinc-950/80 backdrop-blur">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-3">
            <Link href="/browse" className="text-zinc-400 hover:text-white transition">
              <ArrowLeft className="h-5 w-5" />
            </Link>
            <h1 className="text-xl font-bold tracking-tight text-white">Messages</h1>
          </div>
          <Link href="/browse" className="text-xs text-rose-500 font-semibold hover:underline">
            Browse Members
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-6 py-6">
        <div className="space-y-2">
          {conversations.map(({ partner, lastMessage, timestamp }) => (
            <Link
              key={partner.id}
              href={`/chat/${partner.id}`}
              className="flex items-center justify-between rounded-2xl border border-zinc-800/80 bg-zinc-900/50 p-4 transition hover:border-zinc-700 hover:bg-zinc-900"
            >
              <div className="flex items-center space-x-3 overflow-hidden">
                <div className="h-12 w-12 shrink-0 overflow-hidden rounded-full bg-zinc-800">
                  {partner.avatar_url ? (
                    <img src={partner.avatar_url} alt="" className="h-full w-full object-cover" />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-xs text-zinc-500">?</div>
                  )}
                </div>
                <div className="overflow-hidden">
                  <h3 className="text-sm font-semibold text-white">{partner.display_name}</h3>
                  <p className="truncate text-xs text-zinc-400 max-w-xs sm:max-w-md">{lastMessage}</p>
                </div>
              </div>
              <div className="text-[11px] text-zinc-500 shrink-0 ml-3">
                {new Date(timestamp).toLocaleDateString([], { month: 'short', day: 'numeric' })}
              </div>
            </Link>
          ))}

          {conversations.length === 0 && (
            <div className="py-20 text-center">
              <MessageSquare className="mx-auto h-10 w-10 text-zinc-600 mb-3" />
              <p className="text-sm font-medium text-zinc-300">No conversations yet</p>
              <p className="mt-1 text-xs text-zinc-500">Go to Browse to start chatting with members.</p>
              <Link
                href="/browse"
                className="mt-4 inline-block rounded-xl bg-rose-600 px-4 py-2 text-xs font-semibold text-white hover:bg-rose-500 transition"
              >
                Find Members
              </Link>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}