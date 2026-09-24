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
        className="flex items-center gap-2 rounded-full border border-slate-200 bg-white p-1 pr-3 hover:border-slate-300 hover:shadow-xs transition"
      >
        <div className="h-7 w-7 rounded-full overflow-hidden bg-purple-50 flex items-center justify-center border border-purple-100">
          {avatarUrl ? (
            <img src={avatarUrl} alt={displayName} className="h-full w-full object-cover" />
          ) : (
            <User className="h-3.5 w-3.5 text-[#6d4aff]" />
          )}
        </div>
        <span className="text-xs font-semibold text-slate-700 max-w-[95px] truncate">{displayName}</span>
        <ChevronDown className={`h-3 w-3 text-slate-400 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-52 rounded-2xl border border-slate-200 bg-white/95 p-1.5 backdrop-blur-xl shadow-xl z-50 animate-in fade-in zoom-in-95 duration-100">
          <div className="px-3 py-2 border-b border-slate-100 mb-1">
            <p className="text-xs font-bold text-slate-900 truncate">{displayName}</p>
            <p className="text-[10px] text-emerald-600 flex items-center gap-1 mt-0.5 font-medium">
              <ShieldCheck className="h-3 w-3" />
              <span>Verified Account</span>
            </p>
          </div>

          <Link
            href={`/profile/${userId}`}
            onClick={() => setOpen(false)}
            className="flex items-center gap-2.5 rounded-xl px-2.5 py-1.5 text-xs text-slate-600 hover:bg-purple-50 hover:text-[#6d4aff] transition"
          >
            <User className="h-3.5 w-3.5" />
            <span>View My Profile</span>
          </Link>

          <Link
            href="/browse?filter=top-sparks"
            onClick={() => setOpen(false)}
            className="flex items-center gap-2.5 rounded-xl px-2.5 py-1.5 text-xs text-slate-600 hover:bg-purple-50 hover:text-[#6d4aff] transition"
          >
            <Heart className="h-3.5 w-3.5 text-[#6d4aff]" />
            <span>My Sparks & Matches</span>
          </Link>

          <Link
            href="/settings"
            onClick={() => setOpen(false)}
            className="flex items-center gap-2.5 rounded-xl px-2.5 py-1.5 text-xs text-slate-600 hover:bg-purple-50 hover:text-[#6d4aff] transition"
          >
            <Settings className="h-3.5 w-3.5" />
            <span>Account Settings</span>
          </Link>

          <div className="my-1 border-t border-slate-100" />

          <button
            onClick={handleSignOut}
            className="w-full flex items-center gap-2.5 rounded-xl px-2.5 py-1.5 text-xs text-rose-600 hover:bg-rose-50 transition font-medium"
          >
            <LogOut className="h-3.5 w-3.5" />
            <span>Sign Out</span>
          </button>
        </div>
      )}
    </div>
  )
}
