'use client';

import React, { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Eye, EyeOff, Loader2, Mail, MailCheck } from 'lucide-react';
import { BrandLogo } from '@/components/BrandLogo';
import { InAppToast } from '@/components/InAppToast';
import { AmbientAurora } from '@/components/ui/AmbientAurora';
import { CityRotator } from '@/components/auth/CityRotator';
import { supabase } from '@/lib/supabase/client';

const RESET_EXPIRED_MESSAGE = 'That password reset link has expired or was already used. Request a new one from Forgot password.';
const PILL =
  'w-full h-12 flex items-center justify-center gap-3 rounded-full bg-white text-[#2D264B] font-semibold text-sm border border-[#ECE8F4] hover:bg-neutral-50 shadow-2xs transition-all disabled:opacity-60 disabled:cursor-not-allowed';
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

const FacebookIcon = () => (
  <svg className="w-[18px] h-[18px]" viewBox="0 0 24 24" aria-hidden="true">
    <path
      fill="#1877F2"
      d="M24 12.07C24 5.41 18.63 0 12 0S0 5.41 0 12.07C0 18.1 4.39 23.1 10.13 24v-8.44H7.08v-3.49h3.05V9.41c0-3.02 1.79-4.69 4.53-4.69 1.31 0 2.68.24 2.68.24v2.97h-1.51c-1.49 0-1.96.93-1.96 1.89v2.26h3.33l-.53 3.49h-2.8V24C19.61 23.1 24 18.1 24 12.07z"
    />
    <path fill="#fff" d="M16.67 15.56l.53-3.49h-3.33V9.81c0-.96.47-1.89 1.96-1.89h1.51V4.95s-1.37-.24-2.68-.24c-2.74 0-4.53 1.67-4.53 4.69v2.66H7.08v3.49h3.05V24a12.2 12.2 0 003.74 0v-8.44h2.8z" />
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
 * Sign-in / sign-up stack: Google, Facebook, Email (magic link or 6-digit code). New accounts from
 * any provider land on /onboarding, where Step 1 asks for a handle (provider names are never shown).
 * No Apple, no SMS. Password sign-in stays reachable from the email panel for existing accounts.
 */
export function AuthScreen({ mode }: { mode: 'login' | 'signup' }) {
  const [busy, setBusy] = useState<null | 'google' | 'facebook' | 'email' | 'code' | 'password'>(null);
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

  const oauth = async (provider: 'google' | 'facebook') => {
    setBusy(provider);
    setError(null);
    const { error } = await supabase.auth.signInWithOAuth({
      provider,
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    });
    if (error) {
      setError(
        /provider is not enabled/i.test(error.message)
          ? `${provider === 'google' ? 'Google' : 'Facebook'} sign-in is not available right now. Please use another option.`
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
    <div className="relative isolate min-h-[100dvh] w-full flex flex-col bg-white font-sans antialiased">
      <AmbientAurora />
      <InAppToast message={toast} onClose={closeToast} durationMs={7000} />
      <main className="flex-1 w-full flex flex-col px-6 pt-14 pb-6">
        <div className="text-center">
          <div className="flex justify-center">
            <BrandLogo size="lg" href="/" />
          </div>
          <CityRotator />
        </div>

        <div className="space-y-3">
          {step === 'closed' ? (
            <>
              <button type="button" className={PILL} onClick={() => oauth('google')} disabled={!!busy}>
                {busy === 'google' ? <Loader2 className="w-[18px] h-[18px] animate-spin text-[#8C71F5]" /> : <GoogleIcon />}
                Continue with Google
              </button>
              <button type="button" className={PILL} onClick={() => oauth('facebook')} disabled={!!busy}>
                {busy === 'facebook' ? <Loader2 className="w-[18px] h-[18px] animate-spin text-[#8C71F5]" /> : <FacebookIcon />}
                Continue with Facebook
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
                <Mail className="w-[18px] h-[18px] text-neutral-500" aria-hidden />
                Continue with Email
              </button>
            </>
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

        <p className="mt-6 text-center text-xs text-neutral-500">
          {mode === 'login' ? (
            <>
              New to asiansin.love?{' '}
              <Link href="/signup" className="font-semibold text-[#6555B8] hover:underline">
                Create an account
              </Link>
            </>
          ) : (
            <>
              Already a member?{' '}
              <Link href="/login" className="font-semibold text-[#6555B8] hover:underline">
                Sign in
              </Link>
            </>
          )}
        </p>

        <p className="mt-auto pt-10 text-xs text-neutral-400 text-center leading-relaxed px-6">
          Registration is strictly permitted for individuals 18 years of age and older. By continuing, you agree to our{' '}
          <Link href="/terms" className="underline underline-offset-2 hover:text-neutral-600">
            Terms of Service
          </Link>{' '}
          and{' '}
          <Link href="/privacy" className="underline underline-offset-2 hover:text-neutral-600">
            Privacy Policy
          </Link>
          .
        </p>
      </main>
    </div>
  );
}

export default AuthScreen;
