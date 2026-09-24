'use client'

import { useState } from 'react'
import { createClient } from '@/utils/supabase/client'
import Link from 'next/link'
import { ArrowLeft, Trash2, AlertTriangle, Loader2 } from 'lucide-react'
import { Logo } from '@/components/Logo'

export default function SettingsPage() {
  const supabase = createClient()

  const [loading, setLoading] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')

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
    <div className="min-h-dvh bg-[#fafaf9] font-sans text-stone-900 selection:bg-rose-500 selection:text-white pb-20">
      <header className="sticky top-0 z-40 border-b border-stone-200 bg-[#fafaf9]/85 px-4 py-3 backdrop-blur-md flex items-center justify-between">
        <Link href="/browse" className="flex items-center gap-1.5 text-xs font-semibold text-stone-600 hover:text-stone-900 transition">
          <ArrowLeft className="h-4 w-4" />
          <span>Browse</span>
        </Link>
        <Link href="/" className="hover:opacity-90 transition">
          <Logo className="h-6 w-6" textSize="text-base" />
        </Link>
        <div className="w-12" />
      </header>

      <main className="mx-auto max-w-md px-4 py-8 space-y-6">
        <div>
          <h1 className="text-xl font-bold text-stone-900 tracking-tight">Account Settings</h1>
          <p className="text-xs text-stone-500">Manage your session, privacy, and profile data.</p>
        </div>

        {errorMsg && (
          <div className="rounded-xl border border-rose-200 bg-rose-50 p-3.5 text-xs text-rose-700">
            {errorMsg}
          </div>
        )}

        {/* Session Info */}
        <div className="rounded-2xl border border-stone-200 bg-white p-5 space-y-3 shadow-2xs">
          <h2 className="text-xs font-bold uppercase tracking-wider text-stone-600">Active Session</h2>
          <p className="text-xs text-stone-500">
            Signed in on this device. You can log out at any time.
          </p>
          <button
            onClick={handleSignOut}
            className="rounded-xl border border-stone-300 bg-[#fafaf9] px-4 py-2 text-xs font-semibold text-stone-800 hover:bg-stone-100 transition"
          >
            Sign Out
          </button>
        </div>

        {/* Danger Zone */}
        <div className="rounded-2xl border border-rose-200 bg-rose-50/50 p-5 space-y-4">
          <div className="flex items-center gap-2 text-rose-700">
            <Trash2 className="h-4 w-4 shrink-0" />
            <h2 className="text-xs font-bold uppercase tracking-wider">Danger Zone</h2>
          </div>
          <p className="text-xs text-stone-600 leading-relaxed">
            Permanently delete your profile, photos, sparks, and message history. This action cannot be undone.
          </p>

          {!showConfirm ? (
            <button
              type="button"
              onClick={() => setShowConfirm(true)}
              className="rounded-xl border border-rose-300 bg-white px-4 py-2 text-xs font-bold text-rose-700 hover:bg-rose-50 transition"
            >
              Delete My Profile &amp; Account
            </button>
          ) : (
            <div className="rounded-xl border border-rose-200 bg-white p-4 space-y-3">
              <div className="flex items-center gap-2 text-rose-700 text-xs font-bold">
                <AlertTriangle className="h-4 w-4 shrink-0" />
                <span>Are you completely sure?</span>
              </div>
              <p className="text-[11px] text-stone-600">
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
                  className="rounded-lg border border-stone-300 bg-stone-100 px-3.5 py-2 text-xs font-semibold text-stone-700 hover:text-stone-900 transition"
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
