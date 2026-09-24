'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/utils/supabase/client'
import { Heart, User, LogOut } from 'lucide-react'

export default function Navbar() {
  const router = useRouter()
  const supabase = createClient()

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  return (
    <header className="border-b border-zinc-800 bg-zinc-950/80 backdrop-blur sticky top-0 z-50">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
        <Link href="/browse" className="flex items-center gap-2">
          <Heart className="h-5 w-5 text-rose-500 fill-rose-500" />
          <span className="text-xl font-bold tracking-tight text-white">asiansin.love</span>
        </Link>

        <div className="flex items-center gap-3">
          <Link
            href="/onboarding"
            className="flex items-center gap-1.5 rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-1.5 text-xs font-medium text-zinc-300 hover:border-zinc-700 hover:text-white transition"
          >
            <User className="h-3.5 w-3.5" />
            <span>Profile</span>
          </Link>
          <button
            onClick={handleSignOut}
            className="flex items-center gap-1.5 rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-1.5 text-xs font-medium text-zinc-400 hover:border-red-900 hover:text-red-300 transition"
          >
            <LogOut className="h-3.5 w-3.5" />
            <span>Log Out</span>
          </button>
        </div>
      </div>
    </header>
  )
}