'use client';

import React, { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { MotionConfig, motion } from 'framer-motion';
import { AlertCircle, ArrowLeft, Eye, EyeOff, Loader2, Mail, MailCheck, X } from 'lucide-react';
import { BrandLogo } from '@/components/BrandLogo';
import { InAppToast } from '@/components/InAppToast';
import { CityRotator } from '@/components/auth/CityRotator';
import { supabase } from '@/lib/supabase/client';
import { authHref, describeAuthError, safeReturnTo } from '@/lib/authRedirect';

const RESET_EXPIRED_MESSAGE = 'That password reset link has expired or was already used. Request a new one from Forgot password.';
/** Google / LINE / Email: one shared pill so the three read as a single stack. */
const PILL =
  'relative h-12 w-full px-4 rounded-full border border-[#D5C6EC] bg-white/90 backdrop-blur-sm text-sm font-medium text-[#51376D] shadow-brand-sm hover:border-[#B5A0DA] hover:bg-[#E8DFF5]/30 hover:shadow-brand-md transition-all flex items-center justify-center gap-3 select-none disabled:opacity-60 disabled:cursor-not-allowed';
/** Icon slot pinned to one left guide line, so logos line up while labels stay centered. */
const PILL_ICON = 'absolute left-4 sm:left-5 w-5 h-5 flex items-center justify-center shrink-0 pointer-events-none';
/** LINE keeps the shared pill but hovers in LINE green instead of brand violet. */
const PILL_LINE = PILL.replace('hover:border-[#B5A0DA]', 'hover:border-[#06C755]/40');
const PILL_LABEL = 'text-sm font-medium text-[#51376D] tracking-tight';
const INPUT =
  'h-12 w-full rounded-full border border-[#D5C6EC] bg-white px-4 text-base sm:text-sm text-[#51376D] focus:border-[#72519A] focus:ring-2 focus:ring-[#B5A0DA]/30 focus:outline-none placeholder:text-[#51376D]/40 transition';
const PRIMARY =
  'h-12 w-full rounded-full bg-gradient-to-r from-[#72519A] to-[#9474C3] text-white font-semibold text-sm shadow-brand-glow hover:opacity-95 transition-opacity flex items-center justify-center gap-2 active:scale-[0.99] disabled:opacity-60 disabled:cursor-not-allowed';

const GoogleIcon = () => (
  <svg className="w-4 h-4" viewBox="0 0 24 24" aria-hidden="true">
    <path fill="#4285F4" d="M23.49 12.27c0-.79-.07-1.54-.19-2.27H12v4.51h6.47c-.29 1.48-1.14 2.73-2.4 3.58v3h3.86c2.26-2.09 3.56-5.17 3.56-8.82z" />
    <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.86-3c-1.08.72-2.45 1.16-4.07 1.16-3.13 0-5.78-2.11-6.73-4.96H1.29v3.09C3.26 21.3 7.31 24 12 24z" />
    <path fill="#FBBC05" d="M5.27 14.29c-.25-.72-.38-1.49-.38-2.29s.14-1.57.38-2.29V6.62H1.29C.47 8.24 0 10.06 0 12s.47 3.76 1.29 5.38l3.98-3.09z" />
    <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.31 0 3.26 2.7 1.29 6.62l3.98 3.09C6.22 6.86 8.87 4.75 12 4.75z" />
  </svg>
);

const LineIcon = () => (
  <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24" fill="#06C755" aria-hidden="true">
    <path d="M19.365 9.863c.349 0 .63.285.63.631 0 .345-.281.63-.63.63H17.61v1.125h1.755c.349 0 .63.283.63.63 0 .344-.281.629-.63.629h-2.386c-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.63-.63h2.386c.346 0 .627.285.627.63 0 .349-.281.63-.63.63H17.61v1.125h1.755zm-3.855 3.016c0 .27-.174.51-.432.596-.064.021-.133.031-.199.031-.211 0-.391-.09-.51-.25l-2.443-3.317v2.94c0 .344-.279.629-.631.629-.346 0-.626-.285-.626-.629V8.108c0-.27.173-.51.43-.595.06-.023.136-.033.194-.033.195 0 .375.104.495.254l2.462 3.33V8.108c0-.345.282-.63.63-.63.345 0 .63.285.63.63v4.771zm-5.741 0c0 .344-.282.629-.631.629-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.63-.63.346 0 .628.285.628.63v4.771zm-2.466.629H4.917c-.345 0-.63-.285-.63-.629V8.108c0-.345.285-.63.63-.63.348 0 .63.285.63.63v4.141h1.756c.348 0 .629.283.629.63 0 .344-.282.629-.629.629M24 10.314C24 4.943 18.615.572 12 .572S0 4.943 0 10.314c0 4.811 4.27 8.842 10.035 9.608.391.082.923.258 1.058.59.12.301.079.766.038 1.08l-.164 1.02c-.045.301-.24 1.186 1.049.645 1.291-.539 6.916-4.078 9.436-6.975C23.176 14.393 24 12.458 24 10.314" />
  </svg>
);

/**
 * Sends the member on after an in-page sign-in (code or password): unfinished members to
 * /onboarding, everyone else to the page they were heading to (returnTo) or /discover.
 * OAuth and magic links go through /auth/callback, which applies the same rule.
 */
async function routeAfterSignIn(userId: string, returnTo: string | null) {
  const { data: profile } = await supabase.from('profiles').select('onboarding_completed').eq('id', userId).maybeSingle();
  try {
    localStorage.setItem('ail_returning', '1');
    if (!profile?.onboarding_completed) sessionStorage.setItem('ail_active_onboarding', '1');
  } catch {}
  window.location.href = profile?.onboarding_completed ? safeReturnTo(returnTo) || '/discover' : '/onboarding';
}

type EmailStep = 'closed' | 'email' | 'sent' | 'password';

/**
 * Sign-in / sign-up stack: Google, LINE, Email (magic link or 6-digit code). New accounts from
 * any provider land on /onboarding, where Step 1 asks for a handle (provider names are never shown).
 * No Apple, no Facebook, no SMS. Password sign-in stays reachable from the email panel for existing accounts.
 */
export function AuthScreen({ mode, cities }: { mode: 'login' | 'signup'; cities?: readonly string[] }) {
  const [busy, setBusy] = useState<null | 'google' | 'line' | 'email' | 'code' | 'password'>(null);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const closeToast = useCallback(() => setToast(null), []);
  const [step, setStep] = useState<EmailStep>('closed');
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  // Page the member was heading to before being sent here (?returnTo=, set by middleware).
  const [returnTo, setReturnTo] = useState<string | null>(null);
  /** /auth/callback URL that lands back on returnTo after OAuth or a magic link. */
  const callbackUrl = () => `${window.location.origin}/auth/callback${returnTo ? `?next=${encodeURIComponent(returnTo)}` : ''}`;

  // /auth/callback sends members back with ?error= or ?notice=reset_expired.
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const notice = params.get('notice');
    const err = describeAuthError(params.get('error'), params.get('error_description'));
    /* eslint-disable react-hooks/set-state-in-effect -- one-time read of the URL on mount */
    setReturnTo(safeReturnTo(params.get('returnTo')));
    if (!notice && !err) return;
    if (notice === 'reset_expired') setToast(RESET_EXPIRED_MESSAGE);
    if (err) setError(err);
    /* eslint-enable react-hooks/set-state-in-effect */
    params.delete('notice');
    params.delete('error');
    params.delete('error_description');
    params.delete('error_code');
    const qs = params.toString();
    window.history.replaceState(null, '', window.location.pathname + (qs ? '?' + qs : ''));
  }, []);

  // Back from Google / LINE restores this page from the back-forward cache with the stack still
  // disabled; re-enable it then.
  useEffect(() => {
    const onShow = (e: PageTransitionEvent) => {
      if (e.persisted) setBusy(null);
    };
    window.addEventListener('pageshow', onShow);
    return () => window.removeEventListener('pageshow', onShow);
  }, []);

  const oauth = async (provider: 'google' | 'line') => {
    setBusy(provider);
    setError(null);
    const { error } = await supabase.auth.signInWithOAuth({
      // LINE is a custom OIDC provider in Supabase ("custom:line"); the SDK types list built-ins only.
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      provider: (provider === 'line' ? 'custom:line' : 'google') as any,
      options: { redirectTo: callbackUrl() },
    });
    if (error) {
      setError(
        /provider is not enabled/i.test(error.message)
          ? `${provider === 'google' ? 'Google' : 'LINE'} sign-in is not available right now. Please use another option.`
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
      options: { emailRedirectTo: callbackUrl() },
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
    await routeAfterSignIn(data.user.id, returnTo);
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
    await routeAfterSignIn(data.user.id, returnTo);
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
    // LayoutShell supplies the centered 430px frame on the #FFFFFF canvas.
    <div className="relative isolate min-h-[100dvh] w-full flex flex-col bg-white font-sans antialiased overflow-hidden pb-[max(2.5rem,env(safe-area-inset-bottom))]">
      {/* Lavender aura drifting in the mid and lower canvas only: the top 30% (wordmark, city
          ticker) stays pure white. The mid-right orb starts at 38% and only ever drifts down (to about
          45%) and never scales up, so its 64 px blur never reaches above the 30% line.
          reducedMotion="never": the OS setting never freezes the drift. */}
      <MotionConfig reducedMotion="never">
        <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden z-0">
          <motion.div
            animate={{ x: [0, -30, 15, 0], y: [0, 40, 18, 0], scale: [1, 0.96, 0.98, 1] }}
            transition={{ duration: 5.2, repeat: Infinity, ease: 'easeInOut' }}
            className="w-[28rem] h-[28rem] rounded-full bg-[#D5C6EC]/40 blur-3xl pointer-events-none absolute top-[38%] -right-24 will-change-transform"
          />
          <motion.div
            animate={{ x: [0, 40, -15, 0], y: [0, 25, 10, 0], scale: [1, 1.06, 0.95, 1] }}
            transition={{ duration: 4.8, repeat: Infinity, ease: 'easeInOut' }}
            className="w-[30rem] h-[30rem] rounded-full bg-[#E8DFF5]/60 blur-3xl pointer-events-none absolute top-[55%] -left-28 will-change-transform"
          />
          <motion.div
            animate={{ x: [0, 30, -30, 0], y: [0, -18, 12, 0], scale: [1, 1.08, 0.94, 1] }}
            transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
            className="w-96 h-96 rounded-full bg-[#E8DFF5]/45 blur-3xl pointer-events-none absolute -bottom-16 left-1/3 will-change-transform"
          />
        </div>
      </MotionConfig>
      <InAppToast message={toast} onClose={closeToast} durationMs={7000} />
      {/* Sign-in errors float above the card (fixed), so they never push the buttons down. */}
      {error && (
        <div className="fixed top-4 inset-x-0 z-50 flex justify-center px-4 pointer-events-none">
          <div
            role="alert"
            className="pointer-events-auto w-full max-w-[380px] flex items-start gap-2.5 rounded-2xl bg-white/95 border border-[#72519A]/50 px-3.5 py-3 text-xs font-medium text-[#51376D] shadow-[0_8px_24px_rgba(81,55,109,0.10)]"
          >
            <AlertCircle className="w-4 h-4 shrink-0 text-[#72519A] mt-px" aria-hidden />
            <span className="flex-1 leading-relaxed">{error}</span>
            <button type="button" onClick={() => setError(null)} aria-label="Dismiss" className="shrink-0 -m-1 p-1 text-[#51376D]/50 hover:text-[#51376D]">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}
      <main className="relative z-10 flex-1 w-full flex flex-col px-6 pt-10">
        <div className="text-center">
          <span className="block text-[11px] font-semibold tracking-[0.25em] uppercase text-[#72519A] mb-2 text-center">
            {mode === 'login' ? 'Welcome Back' : 'Welcome'}
          </span>
          <div className="flex justify-center">
            <BrandLogo size="lg" href="/" />
          </div>
          <CityRotator cities={cities} />
        </div>

        <div className="w-full max-w-[340px] mx-auto space-y-3">
          {step === 'closed' ? (
            <div className="flex flex-col gap-3 w-full max-w-[340px] mx-auto" aria-busy={!!busy}>
              <button type="button" className={PILL} onClick={() => oauth('google')} disabled={!!busy}>
                <span className={PILL_ICON}>
                  {busy === 'google' ? <Loader2 className="w-4 h-4 animate-spin text-[#72519A]" /> : <GoogleIcon />}
                </span>
                <span className={PILL_LABEL}>Continue with Google</span>
              </button>
              <button type="button" className={PILL_LINE} onClick={() => oauth('line')} disabled={!!busy}>
                <span className={PILL_ICON}>
                  {busy === 'line' ? <Loader2 className="w-5 h-5 animate-spin text-[#06C755]" /> : <LineIcon />}
                </span>
                <span className={PILL_LABEL}>Continue with LINE</span>
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
                <span className={`${PILL_ICON} text-[#51376D]`}>
                  <Mail className="w-4 h-4" aria-hidden />
                </span>
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
                className="inline-flex items-center gap-1 text-xs font-semibold text-[#51376D]/55 hover:text-[#51376D]"
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
                    <button type="button" onClick={() => setStep('password')} className="block mx-auto text-xs font-semibold text-[#72519A] hover:underline">
                      Use a password instead
                    </button>
                  )}
                </form>
              )}

              {step === 'sent' && (
                <form onSubmit={verifyCode} className="space-y-3">
                  <div className="rounded-2xl bg-white border border-[#D5C6EC] p-4 text-center">
                    <MailCheck className="w-6 h-6 mx-auto text-[#72519A]" aria-hidden />
                    <p className="mt-2 text-sm font-semibold text-[#51376D]">Check your inbox</p>
                    <p className="mt-1 text-xs text-[#51376D]/55 leading-relaxed">
                      We sent a sign-in link to <span className="font-semibold text-[#51376D] break-all">{cleanEmail}</span>. Tap it, or enter the
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
                  <button type="button" onClick={() => sendLink()} disabled={!!busy} className="block mx-auto text-xs font-semibold text-[#72519A] hover:underline disabled:opacity-50">
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
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-[#51376D]/55 hover:text-[#51376D]/80"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  <button type="submit" className={PRIMARY} disabled={!emailValid || !password || !!busy}>
                    {busy === 'password' && <Loader2 className="w-4 h-4 animate-spin" />}
                    Sign in
                  </button>
                  <div className="flex items-center justify-between text-xs font-semibold">
                    <button type="button" onClick={() => setStep('email')} className="text-[#72519A] hover:underline">
                      Email me a link instead
                    </button>
                    <Link href="/forgot-password" className="text-[#51376D]/55 hover:text-[#51376D]">
                      Forgot password
                    </Link>
                  </div>
                </form>
              )}
            </div>
          )}

        </div>

        <p className="mt-6 text-center">
          {mode === 'login' ? (
            <>
              <span className="text-xs font-medium text-[#51376D]/70">New to asiansin.love?</span>{' '}
              <Link href={authHref('/signup', returnTo)} className="text-xs font-bold text-[#72519A] hover:text-[#9474C3] transition-colors">
                Create an account
              </Link>
            </>
          ) : (
            <>
              <span className="text-xs font-medium text-[#51376D]/70">Already a member?</span>{' '}
              <Link href={authHref('/login', returnTo)} className="text-xs font-bold text-[#72519A] hover:text-[#9474C3] transition-colors">
                Sign in
              </Link>
            </>
          )}
        </p>

        <p className="mt-auto pt-10 text-[10px] leading-relaxed text-[#51376D]/55 max-w-[340px] mx-auto text-center">
          Registration is strictly permitted for individuals 18 years of age and older. By continuing, you agree to our{' '}
          <Link href="/terms" className="text-[#51376D]/70 underline hover:text-[#72519A] transition-colors">
            Terms of Service
          </Link>{' '}
          and{' '}
          <Link href="/privacy" className="text-[#51376D]/70 underline hover:text-[#72519A] transition-colors">
            Privacy Policy
          </Link>
          .
        </p>
      </main>
    </div>
  );
}

export default AuthScreen;
