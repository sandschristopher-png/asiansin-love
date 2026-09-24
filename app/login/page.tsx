'use client'

import { useState } from 'react'
import { createClient } from '@/utils/supabase/client'
import { useRouter } from 'next/navigation'

export default function LoginPage() {
  const router = useRouter()
  const supabase = createClient()
  const [isSignUp, setIsSignUp] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [successMsg, setSuccessMsg] = useState<string | null>(null)

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setErrorMsg(null)
    setSuccessMsg(null)

    if (isSignUp) {
      const { error } = await supabase.auth.signUp({
        email,
        password,
      })
      if (error) {
        setErrorMsg(error.message)
      } else {
        setSuccessMsg('Check your email for the confirmation link.')
      }
    } else {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })
      if (error) {
        setErrorMsg(error.message)
      } else {
        router.push('/onboarding')
        router.refresh()
      }
    }
    setLoading(false)
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-950 p-4 font-sans text-zinc-100">
      <div className="w-full max-w-md rounded-2xl border border-zinc-800 bg-zinc-900/60 p-8 shadow-xl backdrop-blur-xl">
        <div className="mb-6 text-center">
          <h1 className="text-2xl font-bold tracking-tight text-white">asiansin.love</h1>
          <p className="mt-1 text-sm text-zinc-400">
            {isSignUp ? 'Create an account to start connecting' : 'Sign in to your account'}
          </p>
        </div>

        {errorMsg && (
          <div className="mb-4 rounded-lg bg-red-950/50 border border-red-800 p-3 text-sm text-red-200">
            {errorMsg}
          </div>
        )}

        {successMsg && (
          <div className="mb-4 rounded-lg bg-emerald-950/50 border border-emerald-800 p-3 text-sm text-emerald-200">
            {successMsg}
          </div>
        )}

        <form onSubmit={handleAuth} className="space-y-4">
          <div>
            <label className="block text-xs font-medium uppercase tracking-wider text-zinc-400">
              Email
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1 w-full rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-white placeholder-zinc-500 focus:border-rose-500 focus:outline-none focus:ring-1 focus:ring-rose-500"
              placeholder="you@example.com"
            />
          </div>

          <div>
            <label className="block text-xs font-medium uppercase tracking-wider text-zinc-400">
              Password
            </label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1 w-full rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-white placeholder-zinc-500 focus:border-rose-500 focus:outline-none focus:ring-1 focus:ring-rose-500"
              placeholder="••••••••"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-rose-600 py-2.5 text-sm font-semibold text-white transition hover:bg-rose-500 disabled:opacity-50"
          >
            {loading ? 'Processing...' : isSignUp ? 'Sign Up' : 'Log In'}
          </button>
        </form>

        <div className="mt-6 text-center text-xs text-zinc-400">
          {isSignUp ? 'Already have an account?' : "Don't have an account?"}{' '}
          <button
            type="button"
            onClick={() => setIsSignUp(!isSignUp)}
            className="text-rose-400 hover:underline font-medium"
          >
            {isSignUp ? 'Log in' : 'Sign up'}
          </button>
        </div>
      </div>
    </div>
  )
}