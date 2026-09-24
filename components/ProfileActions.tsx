'use client'

import { useState } from 'react'
import { Sparkles, Star } from 'lucide-react'
import { useRouter } from 'next/navigation'

interface ProfileActionsProps {
  targetUserId: string
  initialSparked: boolean
  initialFavorited: boolean
  isAuthenticated: boolean
}

export function ProfileActions({
  targetUserId,
  initialSparked,
  initialFavorited,
  isAuthenticated,
}: ProfileActionsProps) {
  const router = useRouter()
  const [sparked, setSparked] = useState(initialSparked)
  const [favorited, setFavorited] = useState(initialFavorited)
  const [loading, setLoading] = useState(false)

  const handleSparkToggle = async () => {
    if (!isAuthenticated) {
      router.push('/login')
      return
    }

    setLoading(true)
    try {
      const res = await fetch('/api/spark', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ targetUserId }),
      })
      const data = await res.json()
      if (res.ok) {
        setSparked(data.sparked)
      }
    } finally {
      setLoading(false)
    }
  }

  const handleFavoriteToggle = async () => {
    if (!isAuthenticated) {
      router.push('/login')
      return
    }

    // Local toggle visual feedback
    setFavorited(!favorited)
  }

  return (
    <div className="grid grid-cols-2 gap-2">
      <button
        type="button"
        disabled={loading}
        onClick={handleSparkToggle}
        className={`flex items-center justify-center gap-2 rounded-2xl border p-3 text-xs font-bold uppercase tracking-wider transition ${
          sparked
            ? 'border-rose-500/50 bg-rose-600/20 text-rose-300 shadow-lg shadow-rose-600/20'
            : 'border-zinc-800 bg-zinc-900/60 text-zinc-300 hover:border-rose-500 hover:text-white'
        }`}
      >
        <Sparkles className={`h-4 w-4 ${sparked ? 'text-rose-400 fill-rose-400 animate-pulse' : 'text-rose-400'}`} />
        <span>{sparked ? 'Sparked ?' : 'Send Spark'}</span>
      </button>

      <button
        type="button"
        onClick={handleFavoriteToggle}
        className={`flex items-center justify-center gap-2 rounded-2xl border p-3 text-xs font-semibold transition ${
          favorited
            ? 'border-amber-500/40 bg-amber-500/10 text-amber-300'
            : 'border-zinc-800 bg-zinc-900/60 text-zinc-300 hover:border-amber-500 hover:text-white'
        }`}
      >
        <Star className={`h-4 w-4 ${favorited ? 'fill-amber-400 text-amber-400' : 'text-amber-400'}`} />
        <span>{favorited ? 'Favorited' : 'Add Favorite'}</span>
      </button>
    </div>
  )
}
