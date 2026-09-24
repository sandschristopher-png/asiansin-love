'use client'

import { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/utils/supabase/client'
import { User, Settings, LogOut, ChevronDown, ShieldCheck, Heart } from 'lucide-react'

interface UserMenuProps {
  displayName: string
  avatarUrl?: string | null
  userId: string
}

export function UserMenu({ displayName, avatarUrl, userId }: UserMenuProps) {
  const [open, setOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push('/')
    router.refresh()
  }

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 rounded-full border border-zinc-800 bg-zinc-900/80 p-1 pr-2.5 hover:border-zinc-700 hover:bg-zinc-800/80 transition shadow-sm"
      >
        <div className="h-7 w-7 rounded-full overflow-hidden bg-zinc-800 flex items-center justify-center border border-zinc-700">
          {avatarUrl ? (
            <img src={avatarUrl} alt={displayName} className="h-full w-full object-cover" />
          ) : (
            <User className="h-3.5 w-3.5 text-zinc-400" />
          )}
        </div>
        <span className="text-xs font-medium text-zinc-200 max-w-[90px] truncate">{displayName}</span>
        <ChevronDown className={`h-3 w-3 text-zinc-500 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-52 rounded-xl border border-zinc-800/90 bg-zinc-950/95 p-1.5 backdrop-blur-xl shadow-2xl z-50 animate-in fade-in zoom-in-95 duration-100">
          <div className="px-3 py-2 border-b border-zinc-900 mb-1">
            <p className="text-xs font-semibold text-white truncate">{displayName}</p>
            <p className="text-[10px] text-zinc-500 flex items-center gap-1 mt-0.5">
              <ShieldCheck className="h-3 w-3 text-emerald-400" />
              <span>Verified Account</span>
            </p>
          </div>

          <Link
            href={`/profile/${userId}`}
            onClick={() => setOpen(false)}
            className="flex items-center gap-2.5 rounded-lg px-2.5 py-1.5 text-xs text-zinc-300 hover:bg-zinc-900 hover:text-white transition"
          >
            <User className="h-3.5 w-3.5 text-zinc-400" />
            <span>View My Profile</span>
          </Link>

          <Link
            href="/browse?filter=top-sparks"
            onClick={() => setOpen(false)}
            className="flex items-center gap-2.5 rounded-lg px-2.5 py-1.5 text-xs text-zinc-300 hover:bg-zinc-900 hover:text-white transition"
          >
            <Heart className="h-3.5 w-3.5 text-rose-400" />
            <span>My Sparks & Matches</span>
          </Link>

          <Link
            href="/settings"
            onClick={() => setOpen(false)}
            className="flex items-center gap-2.5 rounded-lg px-2.5 py-1.5 text-xs text-zinc-300 hover:bg-zinc-900 hover:text-white transition"
          >
            <Settings className="h-3.5 w-3.5 text-zinc-400" />
            <span>Account Settings</span>
          </Link>

          <div className="my-1 border-t border-zinc-900" />

          <button
            onClick={handleSignOut}
            className="w-full flex items-center gap-2.5 rounded-lg px-2.5 py-1.5 text-xs text-rose-400 hover:bg-rose-500/10 transition"
          >
            <LogOut className="h-3.5 w-3.5" />
            <span>Sign Out</span>
          </button>
        </div>
      )}
    </div>
  )
}
