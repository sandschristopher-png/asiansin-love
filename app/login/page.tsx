'use client'

import { useState, useEffect, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { createClient } from '@/utils/supabase/client'
import Link from 'next/link'
import { Logo } from '@/components/Logo'
import { Mail, Lock, ArrowRight, ShieldCheck, CheckCircle2 } from 'lucide-react'

function AuthForm() {
  const searchParams = useSearchParams()
  const initialMode = searchParams.get('mode') === 'signup'
  
  const [isSignUp, setIsSignUp] = useState(initialMode)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [errorMsg, setErrorMsg] = useState('')
  const [loading, setLoading] = useState(false)
  const [signupSuccess, setSignupSuccess] = useState(false)

  const supabase = createClient()

  useEffect(() => {
    setIsSignUp(searchParams.get('mode') === 'signup')
  }, [searchParams])

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

        if (data?.user && !data.session) {
          setSignupSuccess(true)
        } else {
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
    <div className="w-full max-w-sm space-y-6">
      {signupSuccess ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-6 text-center space-y-4 shadow-xl">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-emerald-50 border border-emerald-200 text-emerald-600">
            <CheckCircle2 className="h-6 w-6" />
          </div>
          <h2 className="text-lg font-bold text-slate-900 tracking-tight">Confirm Your Email</h2>
          <p className="text-xs text-slate-600 leading-relaxed">
            We sent a secure verification link to <strong className="text-slate-900">{email}</strong>.
          </p>
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-[11px] text-slate-600 text-left space-y-1">
            <p>1. Open the email from <strong>asiansin.love</strong>.</p>
            <p>2. Tap the confirmation button to verify your account.</p>
            <p>3. You will be routed directly to enter your profile details.</p>
          </div>
          <button
            type="button"
            onClick={() => { setSignupSuccess(false); setIsSignUp(false); }}
            className="w-full rounded-xl border border-slate-300 bg-white px-4 py-2 text-xs font-semibold text-slate-700 hover:text-slate-900 transition shadow-xs"
          >
            Back to Sign In
          </button>
        </div>
      ) : (
        <div className="rounded-2xl border border-slate-200 bg-white p-6 sm:p-7 shadow-xl space-y-5">
          <div className="text-center space-y-1">
            <h1 className="text-xl font-bold tracking-tight text-slate-900">
              {isSignUp ? 'Create Your Account' : 'Welcome Back'}
            </h1>
            <p className="text-xs text-slate-500">
              {isSignUp
                ? 'Join a community built for serious romance and marriage.'
                : 'Sign in to access your Sparks and conversations.'}
            </p>
          </div>

          {errorMsg && (
            <div className="rounded-lg border border-rose-200 bg-rose-50 p-3 text-xs text-rose-600 text-center">
              {errorMsg}
            </div>
          )}

          <form onSubmit={handleAuth} className="space-y-3.5">
            <div>
              <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-500 mb-1.5">
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  className="w-full rounded-xl border border-slate-200 bg-slate-50/50 pl-9 pr-3 py-2 text-xs text-slate-900 placeholder-slate-400 focus:border-[#6d4aff] focus:bg-white focus:outline-none transition shadow-xs"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-500 mb-1.5">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                <input
                  type="password"
                  required
                  minLength={6}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full rounded-xl border border-slate-200 bg-slate-50/50 pl-9 pr-3 py-2 text-xs text-slate-900 placeholder-slate-400 focus:border-[#6d4aff] focus:bg-white focus:outline-none transition shadow-xs"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-xl bg-[#6d4aff] py-2.5 text-xs font-bold uppercase tracking-wider text-white hover:bg-[#5b3ae6] transition shadow-md flex items-center justify-center gap-1.5 disabled:opacity-50 mt-2"
            >
              <span>{loading ? 'Please wait...' : isSignUp ? 'Sign Up & Verify' : 'Sign In'}</span>
              {!loading && <ArrowRight className="h-3.5 w-3.5" />}
            </button>
          </form>

          <div className="text-center pt-2">
            <button
              type="button"
              onClick={() => { setIsSignUp(!isSignUp); setErrorMsg(''); }}
              className="text-xs text-slate-500 hover:text-slate-900 transition"
            >
              {isSignUp ? (
                <span>Already have an account? <strong className="text-[#6d4aff]">Sign in</strong></span>
              ) : (
                <span>Don't have an account? <strong className="text-[#6d4aff]">Join free</strong></span>
              )}
            </button>
          </div>

          <div className="pt-2 border-t border-slate-100 flex items-center justify-center gap-1.5 text-[10px] text-slate-400">
            <ShieldCheck className="h-3 w-3 text-emerald-600" />
            <span>Smart Guardian Scam Shield Active</span>
          </div>
        </div>
      )}
    </div>
  )
}

export default function LoginPage() {
  return (
    <div className="min-h-dvh bg-[#fbfbfe] font-sans text-slate-900 flex flex-col justify-between selection:bg-[#6d4aff] selection:text-white">
      <header className="px-6 py-4 border-b border-slate-200/80 bg-white/80 backdrop-blur-md flex items-center justify-between">
        <Link href="/" className="hover:opacity-90 transition">
          <Logo className="h-6 w-6" textSize="text-base" />
        </Link>
        <Link href="/browse" className="text-xs font-medium text-slate-600 hover:text-slate-900 transition">
          Browse Directory
        </Link>
      </header>

      <main className="flex-1 flex items-center justify-center px-4 py-12">
        <Suspense fallback={<div className="text-xs text-slate-400">Loading...</div>}>
          <AuthForm />
        </Suspense>
      </main>

      <footer className="py-4 text-center text-[11px] text-slate-400">
        &copy; 2026 asiansin.love &bull; All rights reserved.
      </footer>
    </div>
  )
}
