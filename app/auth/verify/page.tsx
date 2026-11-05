'use client';

import React, { Suspense, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import type { EmailOtpType } from '@supabase/supabase-js';
import { CheckCircle2, Loader2, MailCheck } from 'lucide-react';
import { supabase } from '@/lib/supabase/client';
import { BrandLogo } from '@/components/BrandLogo';
import { safeReturnTo } from '@/lib/authRedirect';
import { routeAfterSignIn } from '@/lib/routeAfterSignIn';

const OTP_TYPES: EmailOtpType[] = ['email', 'magiclink', 'signup', 'recovery', 'invite', 'email_change'];
const RESEND_COOLDOWN_S = 60;
const callbackUrl = () => `${window.location.origin}/auth/callback`;

/**
 * Email verification.
 *   Link: /auth/verify?token_hash=...&type=email|magiclink|signup|recovery[&next=/path]
 *     verifies automatically (works across devices, unlike the PKCE code flow).
 *   Code: /auth/verify?email=you@example.com  (or type it in), 6-digit code from the same email;
 *     submits as soon as the sixth digit is in.
 * Success goes straight on: recovery to /reset-password, new members to /onboarding, everyone else
 * to `next` or /discover.
 */
function VerifyContent() {
  const params = useSearchParams();
  const tokenHash = params.get('token_hash');
  const rawType = params.get('type') as EmailOtpType | null;
  const linkType: EmailOtpType = rawType && OTP_TYPES.includes(rawType) ? rawType : 'email';
  const next = safeReturnTo(params.get('next'));

  const [email, setEmail] = useState(params.get('email') || '');
  const [code, setCode] = useState('');
  const [status, setStatus] = useState<'idle' | 'verifying' | 'success' | 'error'>(tokenHash ? 'verifying' : 'idle');
  const [error, setError] = useState<string | null>(null);
  const [cooldown, setCooldown] = useState(0);
  const linkTried = useRef(false);

  useEffect(() => {
    if (cooldown <= 0) return;
    const t = window.setTimeout(() => setCooldown((s) => s - 1), 1000);
    return () => window.clearTimeout(t);
  }, [cooldown]);

  const finish = async (userId: string, type: EmailOtpType) => {
    setStatus('success');
    if (type === 'recovery') {
      window.location.href = '/reset-password';
      return;
    }
    await routeAfterSignIn(userId, next);
  };

  // Email link: verify the token hash once.
  useEffect(() => {
    if (!tokenHash || linkTried.current) return;
    linkTried.current = true;
    supabase.auth.verifyOtp({ token_hash: tokenHash, type: linkType }).then(({ data, error: err }) => {
      if (err || !data.user) {
        setStatus('error');
        setError('This link has expired or was already used. Enter the 6-digit code from the email, or request a new one.');
        return;
      }
      void finish(data.user.id, linkType);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps -- run once for the link in the URL
  }, [tokenHash]);

  const cleanEmail = email.trim().toLowerCase();
  const emailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail);

  const verifyCode = async (token: string) => {
    if (!emailValid || token.length !== 6) return;
    setStatus('verifying'); // instant feedback while the request runs
    setError(null);
    const { data, error: err } = await supabase.auth.verifyOtp({ email: cleanEmail, token, type: 'email' });
    if (err || !data.user) {
      setStatus('error');
      setError('That code is incorrect or has expired. Check the latest email or request a new code.');
      setCode('');
      return;
    }
    await finish(data.user.id, 'email');
  };

  const resend = async () => {
    if (!emailValid || cooldown > 0) return;
    setError(null);
    const { error: err } = await supabase.auth.signInWithOtp({ email: cleanEmail, options: { emailRedirectTo: callbackUrl() } });
    if (err) {
      setError(/rate limit|security purposes/i.test(err.message) ? 'Too many requests. Please wait a minute and try again.' : err.message);
      return;
    }
    setCooldown(RESEND_COOLDOWN_S);
  };

  const busy = status === 'verifying' || status === 'success';

  return (
    <div className="min-h-[100dvh] w-full bg-white flex items-center justify-center p-4 sm:p-6 font-sans antialiased">
      <main className="w-full max-w-[420px] bg-white rounded-3xl border border-[#D5C6EC] shadow-brand-md p-7 sm:p-9 space-y-6">
        <div className="flex justify-center">
          <BrandLogo size="md" href="/" />
        </div>

        {status === 'success' ? (
          <div className="text-center space-y-3" role="status">
            <div className="w-14 h-14 mx-auto rounded-2xl bg-emerald-50 border border-emerald-200 text-[#10B981] flex items-center justify-center">
              <CheckCircle2 className="w-7 h-7" aria-hidden />
            </div>
            <h1 className="text-xl font-extrabold text-[#51376D] tracking-tight">You&apos;re verified</h1>
            <p className="text-xs text-[#51376D]/75">Taking you in...</p>
          </div>
        ) : tokenHash && status === 'verifying' ? (
          <div className="text-center space-y-3" role="status">
            <Loader2 className="w-7 h-7 mx-auto animate-spin text-[#72519A]" aria-hidden />
            <p className="text-sm font-semibold text-[#51376D]">Verifying your email...</p>
          </div>
        ) : (
          <form
            className="space-y-4"
            onSubmit={(e) => {
              e.preventDefault();
              void verifyCode(code);
            }}
          >
            <div className="text-center space-y-2">
              <div className="w-12 h-12 mx-auto rounded-2xl bg-[#E8DFF5]/60 border border-[#D5C6EC] text-[#72519A] flex items-center justify-center">
                <MailCheck className="w-6 h-6" aria-hidden />
              </div>
              <h1 className="text-2xl font-extrabold text-[#51376D] tracking-tight">Enter your code</h1>
              <p className="text-xs text-[#51376D]/75 leading-relaxed">
                We sent a 6-digit code to your email. It works once and expires after a short while.
              </p>
            </div>

            {!params.get('email') && (
              <div className="space-y-1.5">
                <label htmlFor="verify-email" className="text-xs font-bold text-[#51376D] block">
                  Email address
                </label>
                <input
                  id="verify-email"
                  type="email"
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="h-12 w-full rounded-full border border-[#D5C6EC] bg-white px-4 text-base sm:text-sm text-[#51376D] placeholder:text-[#51376D]/40 focus:outline-none focus:border-[#72519A] focus:ring-2 focus:ring-[#72519A]/30"
                />
              </div>
            )}

            <div className="space-y-1.5">
              <label htmlFor="verify-code" className="text-xs font-bold text-[#51376D] block">
                6-digit code
              </label>
              <input
                id="verify-code"
                inputMode="numeric"
                autoComplete="one-time-code"
                pattern="[0-9]*"
                maxLength={6}
                value={code}
                disabled={busy}
                onChange={(e) => {
                  const digits = e.target.value.replace(/\D/g, '').slice(0, 6);
                  setCode(digits);
                  if (status === 'error') setStatus('idle');
                  if (digits.length === 6) void verifyCode(digits); // no extra tap needed
                }}
                placeholder="000000"
                aria-invalid={status === 'error'}
                className="h-14 w-full rounded-2xl border border-[#D5C6EC] bg-white text-center font-mono text-2xl tracking-[0.5em] text-[#51376D] placeholder:text-[#D5C6EC] focus:outline-none focus:border-[#72519A] focus:ring-2 focus:ring-[#72519A]/30 disabled:opacity-60"
              />
            </div>

            {error && (
              <p role="alert" className="text-xs font-semibold text-[#DC2626] bg-red-50 border border-red-200 rounded-xl px-3.5 py-2.5">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={busy || code.length !== 6 || !emailValid}
              className="h-12 w-full rounded-full bg-gradient-to-r from-[#72519A] to-[#9474C3] text-white font-semibold text-sm shadow-brand-glow hover:opacity-95 transition-opacity flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {status === 'verifying' && <Loader2 className="w-4 h-4 animate-spin" aria-hidden />}
              {status === 'verifying' ? 'Verifying...' : 'Verify'}
            </button>

            <button
              type="button"
              onClick={() => void resend()}
              disabled={!emailValid || cooldown > 0 || busy}
              className="w-full text-xs font-semibold text-[#72519A] hover:underline disabled:opacity-50 disabled:no-underline"
            >
              {cooldown > 0 ? `Send a new code in ${cooldown}s` : 'Send a new code'}
            </button>
          </form>
        )}

        <div className="pt-2 text-center text-xs text-[#51376D]/75 border-t border-[#D5C6EC]">
          <span className="inline-block pt-3">
            Wrong account?{' '}
            <Link href="/login" className="font-bold text-[#72519A] hover:underline">
              Back to sign in
            </Link>
          </span>
        </div>
      </main>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={<div className="min-h-[100dvh] w-full bg-white" />}>
      <VerifyContent />
    </Suspense>
  );
}
