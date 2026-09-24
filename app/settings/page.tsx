'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/utils/supabase/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Trash2, AlertTriangle, Loader2 } from 'lucide-react'
import { Logo } from '@/components/Logo'

export default function SettingsPage() {
  const router = useRouter()
  const supabase = createClient()

  const [loading, setLoading] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')

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
    <div className="min-h-dvh bg-zinc-950 font-sans text-zinc-100 selection:bg-rose-500 selection:text-white pb-20">
      <header className="sticky top-0 z-40 border-b border-zinc-900 bg-zinc-950/80 px-4 py-3 backdrop-blur-md flex items-center justify-between">
        <Link href="/browse" className="flex items-center gap-1.5 text-xs font-medium text-zinc-400 hover:text-white transition">
          <ArrowLeft className="h-4 w-4" />
          <span>Browse</span>
        </Link>
        <Link href="/browse" className="hover:opacity-90 transition">
          <Logo className="h-6 w-6" textSize="text-base" />
        </Link>
        <div className="w-12" />
      </header>

      <main className="mx-auto max-w-md px-4 py-8 space-y-6">
        <div>
          <h1 className="text-xl font-bold text-white tracking-tight">Account Settings</h1>
          <p className="text-xs text-zinc-400">Manage your preferences and profile data.</p>
        </div>

        {errorMsg && (
          <div className="rounded-xl border border-rose-500/20 bg-rose-500/10 p-3.5 text-xs text-rose-300">
            {errorMsg}
          </div>
        )}

        {/* Danger Zone */}
        <div className="rounded-2xl border border-rose-500/20 bg-rose-500/5 p-5 space-y-4">
          <div className="flex items-center gap-2 text-rose-400">
            <Trash2 className="h-4 w-4 shrink-0" />
            <h2 className="text-xs font-bold uppercase tracking-wider">Danger Zone</h2>
          </div>
          <p className="text-xs text-zinc-400 leading-relaxed">
            Permanently delete your profile, photos, sparks, and message history. This action cannot be undone.
          </p>

          {!showConfirm ? (
            <button
              type="button"
              onClick={() => setShowConfirm(true)}
              className="rounded-xl border border-rose-500/30 bg-rose-500/10 px-4 py-2.5 text-xs font-bold text-rose-300 hover:bg-rose-500/20 transition"
            >
              Delete My Profile &amp; Account
            </button>
          ) : (
            <div className="rounded-xl border border-rose-500/30 bg-zinc-950 p-4 space-y-3">
              <div className="flex items-center gap-2 text-rose-400 text-xs font-semibold">
                <AlertTriangle className="h-4 w-4 shrink-0" />
                <span>Are you completely sure?</span>
              </div>
              <p className="text-[11px] text-zinc-400">
                All data linked to your email will be wiped immediately.
              </p>
              <div className="flex items-center gap-2 pt-1">
                <button
                  type="button"
                  disabled={loading}
                  onClick={handleDelete}
                  className="rounded-lg bg-rose-600 px-3.5 py-2 text-xs font-bold text-white hover:bg-rose-500 transition disabled:opacity-50 flex items-center gap-1.5"
                >
                  {loading && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                  <span>Yes, Delete Everything</span>
                </button>
                <button
                  type="button"
                  disabled={loading}
                  onClick={() => setShowConfirm(false)}
                  className="rounded-lg border border-zinc-800 bg-zinc-900 px-3.5 py-2 text-xs font-semibold text-zinc-300 hover:text-white transition"
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
