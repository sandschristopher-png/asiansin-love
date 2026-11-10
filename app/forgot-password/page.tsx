'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { Mail, CheckCircle2, Loader2, Send } from 'lucide-react';
import { supabase } from '@/lib/supabase/client';
import { BrandLogo } from '@/components/BrandLogo';

const RESEND_COOLDOWN_S = 60;

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [sentTo, setSentTo] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // Resend cooldown (Supabase also rate-limits recovery emails per address).
  const [cooldown, setCooldown] = useState(0);
  useEffect(() => {
    if (cooldown <= 0) return;
    const t = window.setTimeout(() => setCooldown((s) => s - 1), 1000);
    return () => window.clearTimeout(t);
  }, [cooldown]);

  const send = async (address: string) => {

    setIsLoading(true);
    setError(null);
    // The link lands on /auth/callback, which exchanges the recovery code for a session and
    // forwards to /reset-password.
    const { error: resetError } = await supabase.auth.resetPasswordForEmail(address, {
      redirectTo: `${window.location.origin}/auth/callback?next=/reset-password`,
    });
    setIsLoading(false);

    if (resetError) {
      setError(
        /rate limit|security purposes/i.test(resetError.message)
          ? 'Too many requests. Please wait a minute before trying again.'
          : resetError.message
      );
      return;
    }
    setSentTo(address);
    setCooldown(RESEND_COOLDOWN_S);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const address = email.trim();
    if (!address || cooldown > 0) return;
    await send(address);
  };

  return (
    <div className="min-h-screen w-full bg-white flex items-center justify-center p-4 sm:p-6 font-sans antialiased">
      <main className="w-full max-w-[420px] bg-white rounded-3xl border border-[#D0CDE1] shadow-brand-md p-7 sm:p-9 space-y-6">
        <div className="flex justify-center">
          <BrandLogo size="md" />
        </div>

        {sentTo ? (
          <div className="text-center space-y-3">
            <div className="w-14 h-14 mx-auto rounded-2xl bg-[#E8E6F1]/60 border border-[#D0CDE1] text-[#8574B7] flex items-center justify-center">
              <CheckCircle2 className="w-7 h-7" />
            </div>
            <h1 className="text-xl font-extrabold text-[#413B5E] tracking-tight">Check your inbox</h1>
            <p className="text-xs text-[#413B5E]/75 leading-relaxed">
              We&apos;ve sent a password reset link to{' '}
              <span className="font-semibold text-[#413B5E] break-all">{sentTo}</span>.
            </p>
            <p className="text-[11px] text-[#413B5E]/55 leading-relaxed bg-white border border-[#D0CDE1] rounded-xl px-3.5 py-2.5 text-left">
              Nothing after a couple of minutes? Check your spam or promotions folder.
            </p>
            {error && (
              <p role="alert" className="text-xs font-semibold text-[#DC2626] bg-red-50 border border-red-200 rounded-xl px-3.5 py-2.5">
                {error}
              </p>
            )}
            <button
              type="button"
              disabled={cooldown > 0 || isLoading}
              onClick={() => void send(sentTo)}
              className="w-full h-11 rounded-full border border-[#D0CDE1] bg-white text-sm font-medium text-[#413B5E] hover:bg-[#E8E6F1]/30 transition-colors disabled:opacity-60 disabled:cursor-not-allowed inline-flex items-center justify-center gap-2"
            >
              {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
              {cooldown > 0 ? `Resend link in ${cooldown}s` : 'Resend link'}
            </button>
            <button
              type="button"
              onClick={() => {
                setSentTo(null);
                setError(null);
              }}
              className="text-xs font-semibold text-[#8574B7] hover:underline"
            >
              Use a different email
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="text-center space-y-2">
              <h1 className="text-2xl font-extrabold text-[#413B5E] tracking-tight">Reset your password</h1>
              <p className="text-xs text-[#413B5E]/75 leading-relaxed">
                Enter your registered email address and we&apos;ll send you a recovery link.
              </p>
            </div>

            <div className="space-y-1.5 text-left">
              <label htmlFor="email" className="text-xs font-bold text-[#413B5E] block">
                Email address
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-[#413B5E]/55 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  id="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="w-full h-12 pl-10 pr-4 rounded-full bg-white border border-[#D0CDE1] text-base sm:text-sm text-[#413B5E] placeholder:text-[#413B5E]/40 focus:outline-none focus:border-[#8574B7] focus:ring-2 focus:ring-[#8574B7]/30 transition"
                />
              </div>
            </div>

            {error && (
              <p role="alert" className="text-xs font-semibold text-[#DC2626] bg-red-50 border border-red-200 rounded-xl px-3.5 py-2.5">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={isLoading || !email.trim() || cooldown > 0}
              className="w-full h-12 rounded-full bg-[#8574B7] hover:bg-[#534377] text-white text-sm font-semibold flex items-center justify-center gap-2 shadow-brand-glow active:scale-[0.99] transition cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              <span>{isLoading ? 'Sending...' : 'Send Reset Link'}</span>
            </button>
          </form>
        )}

        <div className="pt-2 text-center text-xs text-[#413B5E]/75 border-t border-[#D0CDE1]">
          <span className="inline-block pt-3">
            Remembered your password?{' '}
            <Link href="/login" className="font-bold text-[#8574B7] hover:underline">
              Sign in
            </Link>
          </span>
        </div>
      </main>
    </div>
  );
}
