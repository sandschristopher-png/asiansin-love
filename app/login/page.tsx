'use client'

import { useState } from 'react'
import { createClient } from '@/utils/supabase/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Logo } from '@/components/Logo'
import { AlertCircle, Lock, Mail } from 'lucide-react'

export default function LoginPage() {
  const supabase = createClient()
  const router = useRouter()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isSignUp, setIsSignUp] = useState(false)
  const [loading, setLoading] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  // 1. Google OAuth Sign In
  const handleGoogleLogin = async () => {
    setErrorMsg(null)
    setLoading(true)

    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    })

    if (error) {
      setErrorMsg(error.message)
      setLoading(false)
    }
  }

  // 2. Standard Email/Password
  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMsg(null)
    setLoading(true)

    if (isSignUp) {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      })
      setLoading(false)
      if (error) {
        setErrorMsg(error.message)
      } else {
        router.push('/onboarding')
      }
    } else {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })
      setLoading(false)
      if (error) {
        setErrorMsg(error.message)
      } else {
        router.push('/browse')
      }
    }
  }

  return (
    <div className="min-h-dvh bg-zinc-950 font-sans text-zinc-100 flex flex-col justify-center py-12 px-4 sm:px-6 relative overflow-hidden">
      <div className="pointer-events-none absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-rose-600/10 blur-3xl rounded-full" />

      <div className="sm:mx-auto sm:w-full sm:max-w-md relative z-10 text-center">
        <Link href="/" className="inline-block hover:opacity-90 transition mb-4">
          <Logo className="h-10 w-10 mx-auto" textSize="text-2xl" />
        </Link>
        <h2 className="text-xl font-bold tracking-tight text-white">
          {isSignUp ? 'Create your free account' : 'Welcome back'}
        </h2>
        <p className="mt-1 text-xs text-zinc-400">
          {isSignUp
            ? 'Connect with authentic singles across Southeast Asia'
            : 'Sign in to access your direct messages and Sparks'}
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md relative z-10">
        <div className="border border-zinc-800 bg-zinc-900/50 backdrop-blur-xl p-6 sm:rounded-3xl shadow-2xl space-y-4">
          
          {errorMsg && (
            <div className="flex items-start gap-2 rounded-xl border border-rose-500/20 bg-rose-500/10 p-3 text-xs text-rose-300">
              <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Google OAuth Button */}
          <button
            type="button"
            onClick={handleGoogleLogin}
            disabled={loading}
            className="flex items-center justify-center gap-3 w-full rounded-xl border border-zinc-700/80 bg-zinc-800/80 py-3 px-4 text-xs font-bold text-white hover:bg-zinc-700/80 transition shadow-sm"
          >
            <svg className="h-4 w-4" viewBox="0 0 24 24">
              <path
                fill="#EA4335"
                d="M12 5c1.6 0 3 .6 4.1 1.7l3.1-3.1C17.3 1.8 14.8 1 12 1 7.5 1 3.7 3.6 1.9 7.3l3.7 2.9C6.5 7.4 9 5 12 5z"
              />
              <path
                fill="#4285F4"
                d="M23.5 12.3c0-.8-.1-1.6-.2-2.3H12v4.6h6.5c-.3 1.5-1.1 2.8-2.4 3.7l3.7 2.9c2.2-2 3.7-5 3.7-8.9z"
              />
              <path
                fill="#FBBC05"
                d="M5.6 14.8c-.2-.7-.4-1.5-.4-2.3s.2-1.6.4-2.3L1.9 7.3C.7 9.7 0 12.3 0 15.2c0 2.8.7 5.5 1.9 7.8l3.7-2.9z"
              />
              <path
                fill="#34A853"
                d="M12 23.5c3.2 0 6-1.1 8-3l-3.7-2.9c-1.1.7-2.5 1.2-4.3 1.2-3 0-5.5-2.4-6.4-5.2L1.9 16.5C3.7 20.3 7.5 23.5 12 23.5z"
              />
            </svg>
            <span>Continue with Google</span>
          </button>

          <div className="flex items-center my-4">
            <div className="flex-1 border-t border-zinc-800" />
            <span className="px-3 text-[10px] font-semibold uppercase tracking-wider text-zinc-500">Or with email</span>
            <div className="flex-1 border-t border-zinc-800" />
          </div>

          {/* Email Form */}
          <form onSubmit={handleEmailAuth} className="space-y-3">
            <div>
              <label className="block text-[11px] font-semibold uppercase tracking-wider text-zinc-400">Email Address</label>
              <div className="relative mt-1">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="w-full rounded-xl border border-zinc-700 bg-zinc-800 pl-10 pr-3 py-2 text-base sm:text-sm text-white placeholder-zinc-500 focus:border-rose-500 focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-semibold uppercase tracking-wider text-zinc-400">Password</label>
              <div className="relative mt-1">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full rounded-xl border border-zinc-700 bg-zinc-800 pl-10 pr-3 py-2 text-base sm:text-sm text-white placeholder-zinc-500 focus:border-rose-500 focus:outline-none"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-xl bg-rose-600 py-3 text-xs font-bold uppercase tracking-wider text-white hover:bg-rose-500 disabled:opacity-50 transition shadow mt-2"
            >
              {loading ? 'Processing...' : (isSignUp ? 'Create Free Account' : 'Sign In')}
            </button>
          </form>

          <div className="pt-3 border-t border-zinc-800 text-center">
            <button
              type="button"
              onClick={() => {
                setIsSignUp(!isSignUp)
                setErrorMsg(null)
              }}
              className="text-xs text-zinc-400 hover:text-white transition"
            >
              {isSignUp ? 'Already have an account? Sign in' : "Don't have an account? Sign up free"}
            </button>
          </div>

        </div>
      </div>
    </div>
  )
}
