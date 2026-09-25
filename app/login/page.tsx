'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      if (isSignUp) {
        const { error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;
        setSuccessMsg('Registration successful! Please check your email to confirm your account.');
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        router.push('/discover');
        router.refresh();
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'An error occurred during authentication.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="max-w-md mx-auto w-full px-4 py-12 flex-1 flex flex-col justify-center">
      <div className="p-6 sm:p-8 rounded-3xl bg-[#241E2F] border border-[#725A7A]/35 shadow-2xl space-y-6">
        
        <div className="text-center">
          <h1 className="text-2xl font-extrabold text-white tracking-tight font-[family-name:var(--font-nunito)]">
            {isSignUp ? 'Join asiansin.love' : 'Sign In to Your Account'}
          </h1>
          <p className="text-xs sm:text-sm text-[#DDD8D4] mt-1">
            {isSignUp
              ? 'Connect with verified singles seeking genuine marriage.'
              : 'Welcome back. Enter your credentials below.'}
          </p>
        </div>

        {errorMsg && (
          <div className="p-3 rounded-xl bg-rose-950/80 border border-rose-500/50 text-rose-200 text-xs text-center font-medium">
            {errorMsg}
          </div>
        )}

        {successMsg && (
          <div className="p-3 rounded-xl bg-emerald-950/80 border border-emerald-500/50 text-emerald-200 text-xs text-center font-medium">
            {successMsg}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-[#B8AAC3] block mb-1">
              Email Address
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="w-full px-4 py-3 rounded-xl bg-[#17131F] border border-[#725A7A]/35 text-white text-sm focus:outline-none focus:border-[#978FA8]"
            />
          </div>

          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-[#B8AAC3] block mb-1">
              Password
            </label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full px-4 py-3 rounded-xl bg-[#17131F] border border-[#725A7A]/35 text-white text-sm focus:outline-none focus:border-[#978FA8]"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 rounded-xl bg-[#653C87] hover:bg-[#7A49A2] disabled:opacity-40 text-white font-bold text-sm shadow-md transition-all active:scale-[0.98]"
          >
            {loading ? 'Please wait...' : isSignUp ? 'Create Account' : 'Sign In'}
          </button>
        </form>

        <div className="text-center pt-2 border-t border-[#725A7A]/25">
          <button
            type="button"
            onClick={() => setIsSignUp(!isSignUp)}
            className="text-xs text-[#DDD8D4] hover:text-white transition-colors"
          >
            {isSignUp
              ? 'Already have an account? Sign In'
              : "Don't have an account? Create one now"}
          </button>
        </div>

      </div>
    </main>
  );
}
