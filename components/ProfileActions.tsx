'use client'

import { useState } from 'react'
import { createClient } from '@/utils/supabase/client'
import { Sparkles, Heart, Check, Loader2 } from 'lucide-react'

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
  const [sparked, setSparked] = useState(initialSparked)
  const [favorited, setFavorited] = useState(initialFavorited)
  const [sparkLoading, setSparkLoading] = useState(false)
  const [favLoading, setFavLoading] = useState(false)

  const supabase = createClient()

  const handleSpark = async () => {
    if (!isAuthenticated) {
      window.location.href = '/login?mode=signin'
      return
    }

    setSparkLoading(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      if (sparked) {
        await supabase
          .from('sparks')
          .delete()
          .eq('sender_id', user.id)
          .eq('receiver_id', targetUserId)
        setSparked(false)
      } else {
        await supabase
          .from('sparks')
          .insert({
            sender_id: user.id,
            receiver_id: targetUserId,
          })
        setSparked(true)
      }
    } catch (err) {
      console.error('Error toggling spark:', err)
    } finally {
      setSparkLoading(false)
    }
  }

  const handleFavorite = async () => {
    if (!isAuthenticated) {
      window.location.href = '/login?mode=signin'
      return
    }

    setFavLoading(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      if (favorited) {
        await supabase
          .from('favorites')
          .delete()
          .eq('user_id', user.id)
          .eq('favorite_id', targetUserId)
        setFavorited(false)
      } else {
        await supabase
          .from('favorites')
          .insert({
            user_id: user.id,
            favorite_id: targetUserId,
          })
        setFavorited(true)
      }
    } catch (err) {
      console.error('Error toggling favorite:', err)
    } finally {
      setFavLoading(false)
    }
  }

  return (
    <div className="grid grid-cols-2 gap-3">
      <button
        onClick={handleSpark}
        disabled={sparkLoading}
        className={`flex items-center justify-center gap-2 rounded-xl py-3 text-xs font-bold transition shadow-sm ${
          sparked
            ? 'bg-purple-50 border border-purple-200 text-[#6d4aff]'
            : 'bg-[#6d4aff] text-white hover:bg-[#5b3ae6]'
        }`}
      >
        {sparkLoading ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : sparked ? (
          <>
            <Check className="h-4 w-4" />
            <span>Sparked (✨)</span>
          </>
        ) : (
          <>
            <Sparkles className="h-4 w-4" />
            <span>Send Spark</span>
          </>
        )}
      </button>

      <button
        onClick={handleFavorite}
        disabled={favLoading}
        className={`flex items-center justify-center gap-2 rounded-xl border py-3 text-xs font-semibold transition shadow-xs ${
          favorited
            ? 'bg-rose-50 border-rose-200 text-rose-600'
            : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:text-slate-900'
        }`}
      >
        {favLoading ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <>
            <Heart className={`h-4 w-4 ${favorited ? 'fill-rose-500 text-rose-500' : 'text-slate-400'}`} />
            <span>{favorited ? 'Saved to Favorites' : 'Add to Favorites'}</span>
          </>
        )}
      </button>
    </div>
  )
}
