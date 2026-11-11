'use client';

import { Suspense, useEffect, useRef, useState } from 'react';
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

function VerifyContent() {
  const params = useSearchParams();
  const tokenHash = params.get('token_hash');
  const rawType = params.get('type') as EmailOtpType | null;
  const linkType: EmailOtpType = rawType && OTP_TYPES.includes(rawType) ? rawType : 'email';
  const next = safeReturnTo(params.get('next'));

  const [email, setEmail] = useState(params.get('email') || '');
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

  useEffect(() => {
    if (!tokenHash || linkTried.current) return;
    linkTried.current = true;
    supabase.auth.verifyOtp({ token_hash: tokenHash, type: linkType }).then(({ data, error: err }) => {
      if (err || !data.user) {
        setStatus('error');
        setError('This link has expired or was already used. Request a new sign-in link.');
        return;
      }
      void finish(data.user.id, linkType);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tokenHash]);

  const cleanEmail = email.trim().toLowerCase();
  const emailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail);

  const resend = async () => {
    if (!emailValid || cooldown > 0) return;
    setError(null);
    const { error: err } = await supabase.auth.signInWithOtp({
      email: cleanEmail,
      options: { emailRedirectTo: callbackUrl() },
    });
    if (err) {
      setError(
        /rate limit|security purposes/i.test(err.message)
          ? 'Too many requests. Please wait a minute and try again.'
          : err.message
      );
      return;
    }
    setCooldown(RESEND_COOLDOWN_S);
  };

  const busy = status === 'verifying' || status === 'success';

  return (
    <div className="min-h-[100dvh] w-full bg-white flex items-center justify-center p-4 sm:p-6 font-sans antialiased">
      <main className="w-full max-w-[420px] bg-white rounded-3xl border border-[#D0CDE1] shadow-sm p-7 sm:p-9 space-y-6">
        <div className="flex justify-center">
          <BrandLogo size="md" href="/" />
        </div>

        {status === 'success' ? (
          <div className="text-center space-y-3" role="status">
            <div className="w-14 h-14 mx-auto rounded-2xl bg-emerald-50 border border-emerald-200 text-[#10B981] flex items-center justify-center">
              <CheckCircle2 className="w-7 h-7" aria-hidden />
            </div>
            <h1 className="text-xl font-semibold text-[#413B5E] tracking-tight">You&apos;re verified</h1>
            <p className="text-xs text-slate-600">Taking you in...</p>
          </div>
        ) : tokenHash && status === 'verifying' ? (
          <div className="text-center space-y-3" role="status">
            <Loader2 className="w-7 h-7 mx-auto animate-spin text-[#9A93BC]" aria-hidden />
            <p className="text-sm font-semibold text-[#413B5E]">Verifying your email...</p>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="text-center space-y-2">
              <div className="w-12 h-12 mx-auto rounded-2xl bg-[#E8E6F1] border border-[#D0CDE1] text-[#9A93BC] flex items-center justify-center">
                <MailCheck className="w-6 h-6" aria-hidden />
              </div>
              <h1 className="text-2xl font-semibold text-[#413B5E] tracking-tight">Verify Your Email</h1>
              <p className="text-xs text-slate-600 leading-relaxed">
                Click the secure link in your email to sign in instantly.
              </p>
            </div>

            {!params.get('email') && (
              <div className="space-y-1.5">
                <label htmlFor="verify-email" className="text-xs font-semibold text-[#413B5E] block">
                  Email address
                </label>
                <input
                  id="verify-email"
                  type="email"
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="h-12 w-full rounded-full border border-[#D0CDE1] bg-white px-4 text-base sm:text-sm text-[#413B5E] placeholder:text-[#413B5E]/40 focus:outline-none focus:border-[#9A93BC] focus:ring-2 focus:ring-[#9A93BC]/30"
                />
              </div>
            )}

            {error && (
              <p
                role="alert"
                className="text-xs font-semibold text-[#DC2626] bg-red-50 border border-red-200 rounded-xl px-3.5 py-2.5"
              >
                {error}
              </p>
            )}

            <button
              type="button"
              onClick={() => void resend()}
              disabled={!emailValid || cooldown > 0 || busy}
              className="h-12 w-full rounded-full bg-[#9A93BC] hover:bg-[#8881AA] text-white font-medium text-sm shadow-sm transition-colors flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {cooldown > 0 ? `Resend link in ${cooldown}s` : 'Resend sign-in link'}
            </button>
          </div>
        )}

        <div className="pt-2 text-center text-xs text-slate-600 border-t border-[#D0CDE1]">
          <span className="inline-block pt-3">
            Wrong account?{' '}
            <Link href="/login" className="font-medium text-[#9A93BC] hover:underline">
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