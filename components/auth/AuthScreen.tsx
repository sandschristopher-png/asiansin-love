'use client';

import React, { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Eye, EyeOff, Loader2, Mail, MailCheck } from 'lucide-react';
import { BrandLogo } from '@/components/BrandLogo';
import { InAppToast } from '@/components/InAppToast';
import { AmbientAurora } from '@/components/ui/AmbientAurora';
import { CityRotator } from '@/components/auth/CityRotator';
import { supabase } from '@/lib/supabase/client';

const APPLE_COMING_SOON = 'Apple sign-in is coming soon. Please continue with Google or Email.';
/**
 * Apple OAuth is not enabled in Supabase yet (its authorize URL answers HTTP 400). Until
 * NEXT_PUBLIC_APPLE_AUTH_ENABLED=true, the button shows a coming-soon toast instead.
 */
const APPLE_AUTH_ENABLED = process.env.NEXT_PUBLIC_APPLE_AUTH_ENABLED === 'true';
const RESET_EXPIRED_MESSAGE = 'That password reset link has expired or was already used. Request a new one from Forgot password.';
/** Google / Apple / Email: one shared pill so the three read as a single stack. */
const PILL =
  'w-full h-12 px-4 rounded-full bg-white/95 backdrop-blur-xs border border-[#ECE8F4] shadow-[0_2px_8px_rgba(45,38,75,0.04)] hover:shadow-[0_4px_12px_rgba(45,38,75,0.08)] hover:border-[#8C71F5]/30 transition-all flex items-center justify-center gap-3 select-none disabled:opacity-60 disabled:cursor-not-allowed';
const PILL_LABEL = 'text-sm font-bold text-[#2D264B] tracking-tight';
const INPUT =
  'w-full h-12 px-4 rounded-full bg-white border border-[#ECE8F4] text-base text-[#1C1924] placeholder:text-[#A8A1B5] focus:outline-none focus:border-[#8C71F5] focus:ring-4 focus:ring-[#8C71F5]/15 transition';
const PRIMARY =
  'w-full h-12 rounded-full bg-gradient-to-r from-[#8C71F5] to-[#EC4899] text-white text-sm font-semibold flex items-center justify-center gap-2 shadow-sm hover:opacity-95 active:scale-[0.99] transition disabled:opacity-60 disabled:cursor-not-allowed';

const GoogleIcon = () => (
  <svg className="w-[18px] h-[18px]" viewBox="0 0 24 24" aria-hidden="true">
    <path fill="#4285F4" d="M23.49 12.27c0-.79-.07-1.54-.19-2.27H12v4.51h6.47c-.29 1.48-1.14 2.73-2.4 3.58v3h3.86c2.26-2.09 3.56-5.17 3.56-8.82z" />
    <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.86-3c-1.08.72-2.45 1.16-4.07 1.16-3.13 0-5.78-2.11-6.73-4.96H1.29v3.09C3.26 21.3 7.31 24 12 24z" />
    <path fill="#FBBC05" d="M5.27 14.29c-.25-.72-.38-1.49-.38-2.29s.14-1.57.38-2.29V6.62H1.29C.47 8.24 0 10.06 0 12s.47 3.76 1.29 5.38l3.98-3.09z" />
    <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.31 0 3.26 2.7 1.29 6.62l3.98 3.09C6.22 6.86 8.87 4.75 12 4.75z" />
  </svg>
);

const AppleIcon = () => (
  <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24" fill="#2D264B" aria-hidden="true">
    <path d="M16.37 12.73c-.03-2.7 2.2-4 2.3-4.06-1.25-1.83-3.2-2.08-3.9-2.11-1.66-.17-3.24.98-4.08.98-.85 0-2.14-.96-3.52-.93-1.81.03-3.48 1.05-4.41 2.67-1.88 3.26-.48 8.09 1.35 10.74.9 1.3 1.96 2.75 3.36 2.7 1.35-.05 1.86-.87 3.49-.87 1.63 0 2.09.87 3.51.84 1.45-.03 2.37-1.32 3.26-2.62 1.03-1.5 1.45-2.96 1.47-3.04-.03-.01-2.82-1.08-2.85-4.3zM13.7 4.8c.74-.9 1.24-2.15 1.11-3.4-1.07.04-2.37.71-3.14 1.61-.69.8-1.29 2.07-1.13 3.3 1.19.09 2.42-.61 3.16-1.51z" />
  </svg>
);

/** Sends the member on after an in-page sign-in (code or password); OAuth and magic links go through /auth/callback. */
async function routeAfterSignIn(userId: string) {
  const { data: profile } = await supabase.from('profiles').select('onboarding_completed').eq('id', userId).maybeSingle();
  try {
    localStorage.setItem('ail_returning', '1');
    if (!profile?.onboarding_completed) sessionStorage.setItem('ail_active_onboarding', '1');
  } catch {}
  window.location.href = profile?.onboarding_completed ? '/discover' : '/onboarding';
}

type EmailStep = 'closed' | 'email' | 'sent' | 'password';

/**
 * Sign-in / sign-up stack: Google, Apple, Email (magic link or 6-digit code). New accounts from
 * any provider land on /onboarding, where Step 1 asks for a handle (provider names are never shown).
 * No Facebook, no SMS. Password sign-in stays reachable from the email panel for existing accounts.
 */
export function AuthScreen({ mode }: { mode: 'login' | 'signup' }) {
  const [busy, setBusy] = useState<null | 'google' | 'apple' | 'email' | 'code' | 'password'>(null);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const closeToast = useCallback(() => setToast(null), []);
  const [step, setStep] = useState<EmailStep>('closed');
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // /auth/callback sends members back with ?error= or ?notice=reset_expired.
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const notice = params.get('notice');
    const err = params.get('error');
    if (!notice && !err) return;
    /* eslint-disable react-hooks/set-state-in-effect -- one-time read of the URL on mount */
    if (notice === 'reset_expired') setToast(RESET_EXPIRED_MESSAGE);
    if (err) setError(err === 'no_code_provided' ? 'Sign-in was cancelled. Please try again.' : err.replace(/\+/g, ' '));
    /* eslint-enable react-hooks/set-state-in-effect */
    params.delete('notice');
    params.delete('error');
    const qs = params.toString();
    window.history.replaceState(null, '', window.location.pathname + (qs ? '?' + qs : ''));
  }, []);

  const oauth = async (provider: 'google' | 'apple') => {
    if (provider === 'apple' && !APPLE_AUTH_ENABLED) {
      setError(null);
      setToast(APPLE_COMING_SOON);
      return;
    }
    setBusy(provider);
    setError(null);
    const { error } = await supabase.auth.signInWithOAuth({
      provider,
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    });
    if (error) {
      setError(
        /provider is not enabled/i.test(error.message)
          ? `${provider === 'google' ? 'Google' : 'Apple'} sign-in is not available right now. Please use another option.`
          : error.message
      );
      setBusy(null);
    }
  };

  const cleanEmail = email.trim().toLowerCase();
  const emailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail);

  const sendLink = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!emailValid) return;
    setBusy('email');
    setError(null);
    const { error } = await supabase.auth.signInWithOtp({
      email: cleanEmail,
      options: { emailRedirectTo: `${window.location.origin}/auth/callback` },
    });
    setBusy(null);
    if (error) {
      setError(/rate limit|security purposes/i.test(error.message) ? 'Too many requests. Please wait a minute and try again.' : error.message);
      return;
    }
    setStep('sent');
  };

  const verifyCode = async (e: React.FormEvent) => {
    e.preventDefault();
    const token = code.replace(/\D/g, '');
    if (token.length < 6) return;
    setBusy('code');
    setError(null);
    const { data, error } = await supabase.auth.verifyOtp({ email: cleanEmail, token, type: 'email' });
    if (error || !data.user) {
      setError('That code is incorrect or has expired. Request a new one.');
      setBusy(null);
      return;
    }
    await routeAfterSignIn(data.user.id);
  };

  const passwordSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!emailValid || !password) return;
    setBusy('password');
    setError(null);
    const { data, error } = await supabase.auth.signInWithPassword({ email: cleanEmail, password });
    if (error || !data.user) {
      setError(error?.message === 'Invalid login credentials' ? 'Incorrect email or password. Please try again.' : error?.message || 'Sign-in failed.');
      setBusy(null);
      return;
    }
    await routeAfterSignIn(data.user.id);
  };

  const emailField = (
    <input
      type="email"
      inputMode="email"
      autoComplete="email"
      autoCapitalize="none"
      autoCorrect="off"
      spellCheck={false}
      required
      autoFocus
      value={email}
      onChange={(e) => setEmail(e.target.value)}
      placeholder="you@example.com"
      aria-label="Email address"
      className={INPUT}
    />
  );

  return (
    // LayoutShell supplies the centered 430px frame on the #FAF8FD canvas.
    <div className="relative isolate min-h-[100dvh] w-full flex flex-col bg-[#FAF8FD]/60 font-sans antialiased pb-[max(2.5rem,env(safe-area-inset-bottom))]">
      <AmbientAurora />
      <InAppToast message={toast} onClose={closeToast} durationMs={7000} />
      <main className="relative z-10 flex-1 w-full flex flex-col px-6 pt-14">
        <div className="text-center">
          <div className="flex justify-center">
            <BrandLogo size="lg" href="/" />
          </div>
          <CityRotator />
        </div>

        <div className="w-full max-w-[340px] mx-auto space-y-3">
          {step === 'closed' ? (
            <div className="flex flex-col gap-3 w-full max-w-[340px] mx-auto">
              <button type="button" className={PILL} onClick={() => oauth('google')} disabled={!!busy}>
                {busy === 'google' ? <Loader2 className="w-[18px] h-[18px] animate-spin text-[#8C71F5]" /> : <GoogleIcon />}
                <span className={PILL_LABEL}>Continue with Google</span>
              </button>
              <button type="button" className={PILL} onClick={() => oauth('apple')} disabled={!!busy}>
                {busy === 'apple' ? <Loader2 className="w-4 h-4 animate-spin text-[#8C71F5]" /> : <AppleIcon />}
                <span className={PILL_LABEL}>Continue with Apple</span>
              </button>
              <button
                type="button"
                className={PILL}
                onClick={() => {
                  setError(null);
                  setStep('email');
                }}
                disabled={!!busy}
              >
                <Mail className="w-[18px] h-[18px] text-[#2D264B]/70" aria-hidden />
                <span className={PILL_LABEL}>Continue with Email</span>
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              <button
                type="button"
                onClick={() => {
                  setStep('closed');
                  setError(null);
                  setCode('');
                  setPassword('');
                }}
                className="inline-flex items-center gap-1 text-xs font-semibold text-neutral-500 hover:text-[#2D264B]"
              >
                <ArrowLeft className="w-3.5 h-3.5" aria-hidden />
                All sign-in options
              </button>

              {step === 'email' && (
                <form onSubmit={sendLink} className="space-y-3">
                  {emailField}
                  <button type="submit" className={PRIMARY} disabled={!emailValid || !!busy}>
                    {busy === 'email' && <Loader2 className="w-4 h-4 animate-spin" />}
                    Send sign-in link
                  </button>
                  {mode === 'login' && (
                    <button type="button" onClick={() => setStep('password')} className="block mx-auto text-xs font-semibold text-[#6555B8] hover:underline">
                      Use a password instead
                    </button>
                  )}
                </form>
              )}

              {step === 'sent' && (
                <form onSubmit={verifyCode} className="space-y-3">
                  <div className="rounded-2xl bg-[#FAF8FD] border border-[#ECE8F4] p-4 text-center">
                    <MailCheck className="w-6 h-6 mx-auto text-[#8C71F5]" aria-hidden />
                    <p className="mt-2 text-sm font-semibold text-[#2D264B]">Check your inbox</p>
                    <p className="mt-1 text-xs text-neutral-500 leading-relaxed">
                      We sent a sign-in link to <span className="font-semibold text-[#2D264B] break-all">{cleanEmail}</span>. Tap it, or enter the
                      6-digit code from the email.
                    </p>
                  </div>
                  <input
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    pattern="[0-9]*"
                    maxLength={6}
                    value={code}
                    onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
                    placeholder="6-digit code"
                    aria-label="6-digit code"
                    className={`${INPUT} text-center tracking-[0.4em] tabular-nums`}
                  />
                  <button type="submit" className={PRIMARY} disabled={code.length < 6 || !!busy}>
                    {busy === 'code' && <Loader2 className="w-4 h-4 animate-spin" />}
                    Verify code
                  </button>
                  <button type="button" onClick={() => sendLink()} disabled={!!busy} className="block mx-auto text-xs font-semibold text-[#6555B8] hover:underline disabled:opacity-50">
                    Resend email
                  </button>
                </form>
              )}

              {step === 'password' && (
                <form onSubmit={passwordSignIn} className="space-y-3">
                  {emailField}
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      autoComplete="current-password"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Password"
                      aria-label="Password"
                      className={`${INPUT} pr-12`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((v) => !v)}
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  <button type="submit" className={PRIMARY} disabled={!emailValid || !password || !!busy}>
                    {busy === 'password' && <Loader2 className="w-4 h-4 animate-spin" />}
                    Sign in
                  </button>
                  <div className="flex items-center justify-between text-xs font-semibold">
                    <button type="button" onClick={() => setStep('email')} className="text-[#6555B8] hover:underline">
                      Email me a link instead
                    </button>
                    <Link href="/forgot-password" className="text-neutral-500 hover:text-[#2D264B]">
                      Forgot password
                    </Link>
                  </div>
                </form>
              )}
            </div>
          )}

          {error && (
            <p role="alert" className="text-xs font-semibold text-rose-600 bg-rose-50 border border-rose-200 rounded-2xl px-3.5 py-2.5">
              {error}
            </p>
          )}
        </div>

        <p className="mt-6 text-center">
          {mode === 'login' ? (
            <>
              <span className="text-xs font-medium text-[#2D264B]/70">New to asiansin.love?</span>{' '}
              <Link href="/signup" className="text-xs font-bold text-[#8C71F5] hover:text-[#EC4899] transition-colors">
                Create an account
              </Link>
            </>
          ) : (
            <>
              <span className="text-xs font-medium text-[#2D264B]/70">Already a member?</span>{' '}
              <Link href="/login" className="text-xs font-bold text-[#8C71F5] hover:text-[#EC4899] transition-colors">
                Sign in
              </Link>
            </>
          )}
        </p>

        <p className="mt-auto pt-10 text-[10px] leading-relaxed text-[#2D264B]/55 max-w-[340px] mx-auto text-center">
          Registration is strictly permitted for individuals 18 years of age and older. By continuing, you agree to our{' '}
          <Link href="/terms" className="text-[#2D264B]/70 underline hover:text-[#8C71F5] transition-colors">
            Terms of Service
          </Link>{' '}
          and{' '}
          <Link href="/privacy" className="text-[#2D264B]/70 underline hover:text-[#8C71F5] transition-colors">
            Privacy Policy
          </Link>
          .
        </p>
      </main>
    </div>
  );
}

export default AuthScreen;
