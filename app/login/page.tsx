'use client'

import { useState, Suspense } from 'react'
import { createClient } from '@/utils/supabase/client'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Logo } from '@/components/Logo'
import { Mail, Lock, Loader2, ArrowRight, ShieldCheck } from 'lucide-react'

function LoginForm() {
  const searchParams = useSearchParams()
  const initialMode = searchParams.get('mode') === 'signin' ? 'signin' : 'signup'

  const [mode, setMode] = useState<'signin' | 'signup'>(initialMode)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')
  const [successMsg, setSuccessMsg] = useState('')

  const supabase = createClient()

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setErrorMsg('')
    setSuccessMsg('')

    try {
      if (mode === 'signup') {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/auth/callback`,
          },
        })

        if (error) throw error

        if (data.session) {
          window.location.href = '/onboarding'
        } else {
          setSuccessMsg('Account created! Please check your email inbox to verify your account.')
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
      setErrorMsg(err.message || 'Authentication failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="w-full max-w-sm space-y-6">
      <div className="text-center space-y-2">
        <Link href="/" className="inline-block hover:opacity-90 transition">
          <Logo className="h-8 w-8" textSize="text-lg" />
        </Link>
        <p className="text-xs text-stone-500">
          {mode === 'signup'
            ? 'Join the high-trust community for Southeast Asia'
            : 'Welcome back to asiansin.love'}
        </p>
      </div>

      <div className="rounded-3xl border border-purple-100 bg-white p-7 shadow-sm">
        {/* Tab Toggle */}
        <div className="grid grid-cols-2 gap-1 rounded-full bg-purple-50 p-1 mb-6">
          <button
            type="button"
            onClick={() => { setMode('signup'); setErrorMsg(''); setSuccessMsg('') }}
            className={`rounded-full py-2 text-xs font-bold transition ${
              mode === 'signup'
                ? 'bg-white text-[#6d4aff] shadow-xs'
                : 'text-stone-500 hover:text-stone-900'
            }`}
          >
            Create Account
          </button>
          <button
            type="button"
            onClick={() => { setMode('signin'); setErrorMsg(''); setSuccessMsg('') }}
            className={`rounded-full py-2 text-xs font-bold transition ${
              mode === 'signin'
                ? 'bg-white text-[#6d4aff] shadow-xs'
                : 'text-stone-500 hover:text-stone-900'
            }`}
          >
            Sign In
          </button>
        </div>

        {errorMsg && (
          <div className="mb-4 rounded-2xl border border-rose-200 bg-rose-50 p-3 text-xs text-rose-700">
            {errorMsg}
          </div>
        )}

        {successMsg && (
          <div className="mb-4 rounded-2xl border border-emerald-200 bg-emerald-50 p-3 text-xs text-emerald-700 leading-relaxed">
            {successMsg}
          </div>
        )}

        <form onSubmit={handleAuth} className="space-y-4">
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-stone-600 mb-1.5">
              Email Address
            </label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-stone-400" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full rounded-2xl border border-stone-300 bg-[#fafaf9] pl-10 pr-3.5 py-2.5 text-xs text-stone-900 placeholder-stone-400 focus:border-[#6d4aff] focus:bg-white focus:outline-none transition"
              />
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-stone-600 mb-1.5">
              Password
            </label>
            <div className="relative">
              <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-stone-400" />
              <input
                type="password"
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full rounded-2xl border border-stone-300 bg-[#fafaf9] pl-10 pr-3.5 py-2.5 text-xs text-stone-900 placeholder-stone-400 focus:border-[#6d4aff] focus:bg-white focus:outline-none transition"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-full bg-[#6d4aff] py-3 text-xs font-bold text-white hover:bg-[#5b3adb] transition shadow-sm flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <>
                <span>{mode === 'signup' ? 'Get Started' : 'Sign In'}</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </>
            )}
          </button>
        </form>

        <div className="mt-5 pt-4 border-t border-purple-50 flex items-center justify-center gap-1.5 text-[11px] text-stone-500">
          <ShieldCheck className="h-3.5 w-3.5 text-[#6d4aff]" />
          <span>Protected by Smart Guardian Shield</span>
        </div>
      </div>
    </div>
  )
}

export default function LoginPage() {
  return (
    <div className="min-h-dvh bg-[#fdfdfd] font-sans text-[#1e192b] flex flex-col justify-center items-center py-12 px-4 selection:bg-[#6d4aff] selection:text-white relative overflow-hidden">
      <div className="pointer-events-none absolute -top-40 left-1/2 -translate-x-1/2 h-[400px] w-[600px] bg-gradient-to-b from-purple-200/40 via-violet-100/20 to-transparent blur-3xl opacity-75" />
      <div className="relative z-10 w-full flex justify-center">
        <Suspense fallback={<div className="text-xs text-stone-400">Loading...</div>}>
          <LoginForm />
        </Suspense>
      </div>
    </div>
  )
}