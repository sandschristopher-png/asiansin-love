'use client'

import { useState } from 'react'
import { createClient } from '@/utils/supabase/client'
import Link from 'next/link'
import { Logo } from '@/components/Logo'
import { Mail, Lock, ArrowRight, ShieldCheck, CheckCircle2 } from 'lucide-react'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isSignUp, setIsSignUp] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')
  const [loading, setLoading] = useState(false)
  const [signupSuccess, setSignupSuccess] = useState(false)

  const supabase = createClient()

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMsg('')
    setLoading(true)

    try {
      if (isSignUp) {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/auth/callback?next=/onboarding`,
          },
        })

        if (error) throw error

        // If email confirmation is required by Supabase
        if (data?.user && !data.session) {
          setSignupSuccess(true)
        } else {
          // Direct login fallback if email confirmation is disabled
          window.location.href = '/onboarding'
        }
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        })
        if (error) throw error
        window.location.href = '/browse'
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'An error occurred during authentication.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-dvh bg-zinc-950 font-sans text-zinc-100 flex flex-col justify-between selection:bg-rose-500 selection:text-white">
      <header className="px-6 py-4 border-b border-zinc-900 bg-zinc-950/80 backdrop-blur-md flex items-center justify-between">
        <Link href="/" className="hover:opacity-90 transition">
          <Logo className="h-6 w-6" textSize="text-base" />
        </Link>
        <Link href="/browse" className="text-xs font-medium text-zinc-400 hover:text-zinc-200 transition">
          Browse Directory
        </Link>
      </header>

      <main className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-sm space-y-6">

          {signupSuccess ? (
            <div className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-6 text-center space-y-4 backdrop-blur-md shadow-xl">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
                <CheckCircle2 className="h-6 w-6" />
              </div>
              <h2 className="text-lg font-bold text-white tracking-tight">Confirm Your Email</h2>
              <p className="text-xs text-zinc-400 leading-relaxed">
                We sent a secure verification link to <strong className="text-zinc-200">{email}</strong>.
              </p>
              <div className="rounded-xl border border-zinc-800/80 bg-zinc-950/60 p-3 text-[11px] text-zinc-400 text-left space-y-1">
                <p>1. Open the email from <strong>asiansin.love</strong>.</p>
                <p>2. Tap the confirmation button to verify you're human.</p>
                <p>3. You'll be taken directly to enter your profile details.</p>
              </div>
              <button
                type="button"
                onClick={() => { setSignupSuccess(false); setIsSignUp(false); }}
                className="w-full rounded-xl border border-zinc-800 bg-zinc-900 px-4 py-2.5 text-xs font-semibold text-zinc-300 hover:text-white transition"
              >
                Back to Sign In
              </button>
            </div>
          ) : (
            <div className="rounded-2xl border border-zinc-800/80 bg-zinc-900/40 p-6 sm:p-7 backdrop-blur-md shadow-xl space-y-5">
              
              <div className="text-center space-y-1">
                <h1 className="text-xl font-bold tracking-tight text-white">
                  {isSignUp ? 'Create Your Account' : 'Welcome Back'}
                </h1>
                <p className="text-xs text-zinc-400">
                  {isSignUp
                    ? 'Join a community built for serious romance and marriage.'
                    : 'Sign in to access your Sparks and conversations.'}
                </p>
              </div>

              {errorMsg && (
                <div className="rounded-lg border border-rose-500/20 bg-rose-500/10 p-3 text-xs text-rose-300 text-center">
                  {errorMsg}
                </div>
              )}

              <form onSubmit={handleAuth} className="space-y-3.5">
                <div>
                  <label className="block text-[11px] font-semibold uppercase tracking-wider text-zinc-400 mb-1.5">
                    Email Address
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-zinc-500" />
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="name@example.com"
                      className="w-full rounded-lg border border-zinc-800 bg-zinc-950/70 pl-9 pr-3 py-2 text-xs text-white placeholder-zinc-500 focus:border-rose-500 focus:outline-none transition"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold uppercase tracking-wider text-zinc-400 mb-1.5">
                    Password
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-zinc-500" />
                    <input
                      type="password"
                      required
                      minLength={6}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full rounded-lg border border-zinc-800 bg-zinc-950/70 pl-9 pr-3 py-2 text-xs text-white placeholder-zinc-500 focus:border-rose-500 focus:outline-none transition"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full rounded-xl bg-rose-600 py-2.5 text-xs font-bold uppercase tracking-wider text-white hover:bg-rose-500 transition shadow-sm flex items-center justify-center gap-1.5 disabled:opacity-50 mt-2"
                >
                  <span>{loading ? 'Please wait...' : isSignUp ? 'Sign Up & Verify' : 'Sign In'}</span>
                  {!loading && <ArrowRight className="h-3.5 w-3.5" />}
                </button>
              </form>

              <div className="text-center pt-2">
                <button
                  type="button"
                  onClick={() => { setIsSignUp(!isSignUp); setErrorMsg(''); }}
                  className="text-xs text-zinc-400 hover:text-white transition"
                >
                  {isSignUp ? (
                    <span>Already have an account? <strong className="text-rose-400">Sign in</strong></span>
                  ) : (
                    <span>Don't have an account? <strong className="text-rose-400">Join free</strong></span>
                  )}
                </button>
              </div>

              <div className="pt-2 border-t border-zinc-800/80 flex items-center justify-center gap-1.5 text-[10px] text-zinc-500">
                <ShieldCheck className="h-3 w-3 text-emerald-500" />
                <span>Smart Guardian Scam Shield Active</span>
              </div>

            </div>
          )}

        </div>
      </main>

      <footer className="py-4 text-center text-[11px] text-zinc-600">
        &copy; 2026 asiansin.love &bull; All rights reserved.
      </footer>
    </div>
  )
}
