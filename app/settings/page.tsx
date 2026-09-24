'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/utils/supabase/client'
import Link from 'next/link'
import { ArrowLeft, Trash2, AlertTriangle, Loader2, Sparkles, AtSign, Check } from 'lucide-react'
import { Logo } from '@/components/Logo'

export default function SettingsPage() {
  const supabase = createClient()

  const [loading, setLoading] = useState(false)
  const [handleLoading, setHandleLoading] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [currentUsername, setCurrentUsername] = useState('')
  const [newUsername, setNewUsername] = useState('')
  const [handleSuccess, setHandleSuccess] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')

  useEffect(() => {
    async function loadProfile() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data: profile } = await supabase
        .from('profiles')
        .select('username')
        .eq('id', user.id)
        .maybeSingle()

      if (profile?.username) {
        setCurrentUsername(profile.username)
        setNewUsername(profile.username)
      }
    }
    loadProfile()
  }, [supabase])

  const handleUpdateUsername = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMsg('')
    setHandleSuccess(false)

    const cleaned = newUsername.toLowerCase().replace(/[^a-z0-9_.]/g, '')
    if (cleaned.length < 3) {
      setErrorMsg('Handle must be at least 3 characters.')
      return
    }

    setHandleLoading(true)

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { error } = await supabase
      .from('profiles')
      .update({ username: cleaned })
      .eq('id', user.id)

    setHandleLoading(false)

    if (error) {
      setErrorMsg('This handle is already in use by another member.')
    } else {
      setCurrentUsername(cleaned)
      setHandleSuccess(true)
      setTimeout(() => setHandleSuccess(false), 3000)
    }
  }

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    window.location.href = '/'
  }

  const handleDelete = async () => {
    setLoading(true)
    setErrorMsg('')

    try {
      const res = await fetch('/api/account/delete', {
        method: 'POST',
      })

      if (!res.ok) {
        const body = await res.json()
        throw new Error(body.error || 'Failed to delete account')
      }

      window.location.href = '/'
    } catch (err: any) {
      setErrorMsg(err.message || 'An error occurred while deleting your account.')
      setLoading(false)
    }
  }

  return (
    <div className="min-h-dvh bg-[#fdfdfd] font-sans text-[#1e192b] selection:bg-[#6d4aff] selection:text-white pb-20">
      <header className="sticky top-0 z-40 border-b border-purple-100 bg-[#fdfdfd]/85 px-4 py-3 backdrop-blur-md flex items-center justify-between">
        <Link href="/browse" className="flex items-center gap-1.5 text-xs font-bold text-stone-600 hover:text-[#6d4aff] transition">
          <ArrowLeft className="h-4 w-4" />
          <span>Browse</span>
        </Link>
        <Link href="/" className="hover:opacity-90 transition">
          <Logo className="h-7 w-7" textSize="text-base" />
        </Link>
        <div className="w-12" />
      </header>

      <main className="mx-auto max-w-md px-4 py-8 space-y-6">
        <div>
          <h1 className="text-xl font-bold text-[#1e192b] tracking-tight">Settings</h1>
          <p className="text-xs text-stone-500">Manage your handle, membership, and security.</p>
        </div>

        {errorMsg && (
          <div className="rounded-2xl border border-rose-200 bg-rose-50 p-3.5 text-xs text-rose-700">
            {errorMsg}
          </div>
        )}

        {/* VIP Card (Replaces intrusive banners) */}
        <div className="rounded-3xl border border-purple-200 bg-gradient-to-br from-purple-50/70 to-violet-50/40 p-5 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-xl bg-[#6d4aff] text-white">
                <Sparkles className="h-3.5 w-3.5" />
              </div>
              <div>
                <h2 className="text-xs font-bold text-[#1e192b]">asiansin.love VIP</h2>
                <span className="text-[10px] text-stone-500 block">Standard Membership</span>
              </div>
            </div>
            <Link
              href="/upgrade"
              className="rounded-full bg-[#6d4aff] px-3.5 py-1.5 text-xs font-bold text-white hover:bg-[#5b3adb] transition shadow-xs"
            >
              Explore VIP
            </Link>
          </div>
          <p className="text-xs text-stone-600 leading-relaxed">
            Get unlimited direct messaging, stealth browsing mode, and priority placement across member inboxes.
          </p>
        </div>

        {/* Change Handle / Username */}
        <div className="rounded-3xl border border-stone-200 bg-white p-5 space-y-3 shadow-2xs">
          <h2 className="text-xs font-bold uppercase tracking-wider text-stone-600">Your Handle</h2>
          <form onSubmit={handleUpdateUsername} className="space-y-3">
            <div className="relative">
              <AtSign className="absolute left-3.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-stone-400" />
              <input
                type="text"
                value={newUsername}
                onChange={(e) => setNewUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_.]/g, ''))}
                placeholder="your_handle"
                className="w-full rounded-2xl border border-stone-300 bg-[#fafaf9] pl-8 pr-3.5 py-2.5 text-xs text-stone-900 focus:border-[#6d4aff] focus:bg-white focus:outline-none transition font-mono"
              />
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[11px] text-stone-400">
                asiansin.love/@{currentUsername || 'handle'}
              </span>
              <button
                type="submit"
                disabled={handleLoading || newUsername === currentUsername}
                className="rounded-full bg-stone-900 px-4 py-1.5 text-xs font-bold text-white hover:bg-stone-800 transition disabled:opacity-50 flex items-center gap-1.5"
              >
                {handleLoading ? <Loader2 className="h-3 w-3 animate-spin" /> : handleSuccess ? <Check className="h-3 w-3 text-emerald-400" /> : null}
                <span>{handleSuccess ? 'Saved' : 'Update'}</span>
              </button>
            </div>
          </form>
        </div>

        {/* Session Info */}
        <div className="rounded-3xl border border-stone-200 bg-white p-5 space-y-3 shadow-2xs">
          <h2 className="text-xs font-bold uppercase tracking-wider text-stone-600">Active Session</h2>
          <p className="text-xs text-stone-500">
            Signed in on this device. You can log out safely at any time.
          </p>
          <button
            onClick={handleSignOut}
            className="rounded-full border border-stone-300 bg-[#fafaf9] px-4 py-2 text-xs font-bold text-stone-800 hover:bg-stone-100 transition"
          >
            Sign Out
          </button>
        </div>

        {/* Danger Zone */}
        <div className="rounded-3xl border border-rose-200 bg-rose-50/50 p-5 space-y-4">
          <div className="flex items-center gap-2 text-rose-700">
            <Trash2 className="h-4 w-4 shrink-0" />
            <h2 className="text-xs font-bold uppercase tracking-wider">Danger Zone</h2>
          </div>
          <p className="text-xs text-stone-600 leading-relaxed">
            Permanently delete your profile, handle, photos, sparks, and message history. This action cannot be undone.
          </p>

          {!showConfirm ? (
            <button
              type="button"
              onClick={() => setShowConfirm(true)}
              className="rounded-full border border-rose-300 bg-white px-4 py-2 text-xs font-bold text-rose-700 hover:bg-rose-50 transition"
            >
              Delete My Profile &amp; Account
            </button>
          ) : (
            <div className="rounded-2xl border border-rose-200 bg-white p-4 space-y-3">
              <div className="flex items-center gap-2 text-rose-700 text-xs font-bold">
                <AlertTriangle className="h-4 w-4 shrink-0" />
                <span>Are you completely sure?</span>
              </div>
              <p className="text-[11px] text-stone-600">
                All data linked to this account will be erased immediately.
              </p>
              <div className="flex items-center gap-2 pt-1">
                <button
                  type="button"
                  disabled={loading}
                  onClick={handleDelete}
                  className="rounded-full bg-rose-600 px-4 py-2 text-xs font-bold text-white hover:bg-rose-500 transition disabled:opacity-50 flex items-center gap-1.5"
                >
                  {loading && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                  <span>Yes, Delete Everything</span>
                </button>
                <button
                  type="button"
                  disabled={loading}
                  onClick={() => setShowConfirm(false)}
                  className="rounded-full border border-stone-300 bg-stone-100 px-4 py-2 text-xs font-bold text-stone-700 hover:text-stone-900 transition"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
