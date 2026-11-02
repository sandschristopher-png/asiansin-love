'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Mail, CheckCircle2, Loader2, Send } from 'lucide-react';
import { supabase } from '@/lib/supabase/client';
import { BrandLogo } from '@/components/BrandLogo';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [sentTo, setSentTo] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const address = email.trim();
    if (!address) return;

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
  };

  return (
    <div className="min-h-screen w-full bg-[#FAF8FD] flex items-center justify-center p-4 sm:p-6 font-sans antialiased">
      <main className="w-full max-w-[420px] bg-white rounded-3xl border border-[#DDD7E5] shadow-xl shadow-[#1C1536]/5 p-7 sm:p-9 space-y-6">
        <div className="flex justify-center">
          <BrandLogo size="md" />
        </div>

        {sentTo ? (
          <div className="text-center space-y-3">
            <div className="w-14 h-14 mx-auto rounded-2xl bg-[#F3EFFC] border border-[#E2DBF0] text-[#6555B8] flex items-center justify-center">
              <CheckCircle2 className="w-7 h-7" />
            </div>
            <h1 className="text-xl font-black text-[#1C1924] tracking-tight">Check your inbox!</h1>
            <p className="text-xs text-[#6C637B] leading-relaxed">
              We&apos;ve sent a password reset link to{' '}
              <span className="font-semibold text-[#1C1924] break-all">{sentTo}</span>.
            </p>
            <p className="text-[11px] text-[#8C849B] leading-relaxed bg-[#F9F8FC] border border-[#ECE8F4] rounded-xl px-3.5 py-2.5 text-left">
              Nothing after a couple of minutes? Check your spam or promotions folder.
            </p>
            <button
              type="button"
              onClick={() => setSentTo(null)}
              className="text-xs font-semibold text-[#6555B8] hover:underline"
            >
              Use a different email
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="text-center space-y-2">
              <h1 className="text-2xl font-black text-[#1C1924] tracking-tight">Reset your password</h1>
              <p className="text-xs text-[#6C637B] leading-relaxed">
                Enter your registered email address and we&apos;ll send you a recovery link.
              </p>
            </div>

            <div className="space-y-1.5 text-left">
              <label htmlFor="email" className="text-xs font-bold text-[#1C1924] block">
                Email address
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-[#A8A1B5] absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  id="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="w-full py-3 pl-10 pr-4 rounded-2xl bg-white border border-[#DDD7E5] text-xs text-[#1C1924] placeholder:text-[#A8A1B5] focus:outline-none focus:border-[#6555B8] focus:ring-4 focus:ring-[#6555B8]/10 transition"
                />
              </div>
            </div>

            {error && (
              <p className="text-xs font-semibold text-rose-600 bg-rose-50 border border-rose-200 rounded-xl px-3.5 py-2.5">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={isLoading || !email.trim()}
              className="w-full py-3.5 px-6 rounded-2xl bg-[#6555B8] text-white text-xs font-bold flex items-center justify-center gap-2 shadow-md shadow-[#6555B8]/20 hover:bg-[#5444A0] active:scale-[0.99] transition cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              <span>{isLoading ? 'Sending...' : 'Send Reset Link'}</span>
            </button>
          </form>
        )}

        <div className="pt-2 text-center text-xs text-[#6C637B] border-t border-[#F0EDF5]">
          <span className="inline-block pt-3">
            Remembered your password?{' '}
            <Link href="/login" className="font-bold text-[#6555B8] hover:underline">
              Sign in
            </Link>
          </span>
        </div>
      </main>
    </div>
  );
}
