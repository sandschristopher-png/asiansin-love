'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import { Mail, Lock, User, AlertCircle, CheckCircle2, Loader2, Eye, EyeOff } from 'lucide-react';


export default function LoginPage() {
  const router = useRouter();
  const [mode, setMode] = useState<'signin' | 'signup' | 'forgot'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [loading, setLoading] = useState(false);

  const resetFormState = (newMode: 'signin' | 'signup' | 'forgot') => {
    setErrorMsg('');
    setSuccessMsg('');
    setMode(newMode);
  };

  const handleGoogleSignIn = async () => {
    try {
      setErrorMsg('');
      setLoading(true);
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback?next=/discover`,
        },
      });
      if (error) throw error;
    } catch (err: any) {
      setErrorMsg(err.message || 'Google sign-in failed.');
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');
    setLoading(true);

    try {
      if (mode === 'forgot') {
        const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
          redirectTo: `${window.location.origin}/login`,
        });
        if (error) throw error;
        setSuccessMsg('Password reset link sent! Check your inbox.');
        return;
      }

      if (mode === 'signup') {
        const cleanedUsername = username.trim().replace(/[^a-zA-Z0-9_.]/g, '');
        if (cleanedUsername.length < 3 || cleanedUsername.length > 20) {
          setErrorMsg('Username must be 3-20 characters.');
          setLoading(false);
          return;
        }

        const { data: existingUser } = await supabase
          .from('profiles')
          .select('username')
          .ilike('username', cleanedUsername)
          .maybeSingle();

        if (existingUser) {
          setErrorMsg('Username is already taken.');
          setLoading(false);
          return;
        }

        const { data, error } = await supabase.auth.signUp({
          email: email.trim(),
          password,
          options: {
            data: {
              username: cleanedUsername,
            },
          },
        });

        if (error) throw error;

        if (data.session) {
          router.push('/discover');
        } else {
          setSuccessMsg('Account created! Please check your email to verify your account.');
        }
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password,
        });

        if (error) throw error;
        router.push('/discover');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Authentication failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8F7FA] text-[#1C1924] flex flex-col justify-between selection:bg-[#6555B8] selection:text-white">
      <main className="flex-1 flex items-center justify-center p-4">
        <div className="w-full max-w-sm rounded-3xl bg-[#FFFFFF] border border-[#DDD7E5]/25 p-7 shadow-2xl">
          <div className="text-center mb-6">
            <h2 className="text-2xl font-medium text-[#1C1924] ">
              {mode === 'signup' && 'Create Account'}
              {mode === 'signin' && 'Sign In'}
              {mode === 'forgot' && 'Reset Password'}
            </h2>
            <p className="text-xs text-[#1C1924]/75 mt-1.5 font-medium">
              {mode === 'signup' && 'Join asiansin.love'}
              {mode === 'signin' && 'Welcome back'}
              {mode === 'forgot' && 'Enter your email to receive a reset link'}
            </p>
          </div>

          {errorMsg && (
            <div className="mb-4 p-3 rounded-2xl bg-rose-500/10 border border-rose-500/30 flex items-start gap-2 text-rose-300 text-xs leading-relaxed">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-400 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div className="mb-4 p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-start gap-2 text-emerald-300 text-xs leading-relaxed">
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400 mt-0.5" />
              <span>{successMsg}</span>
            </div>
          )}

          {mode !== 'forgot' && (
            <>
              <button
                type="button"
                onClick={handleGoogleSignIn}
                disabled={loading}
                className="w-full py-2.5 px-4 rounded-2xl bg-[#FFFFFF] hover:bg-[#FFFFFF] border border-[#DDD7E5]/40 text-[#1C1924] text-xs font-semibold flex items-center justify-center gap-2.5 transition active:scale-[0.98] disabled:opacity-50 cursor-pointer shadow-sm"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24">
                  <path
                    fill="#EA4335"
                    d="M12 5c1.6 0 3 .6 4.1 1.7l3.1-3.1C17.3 1.8 14.8 1 12 1 7.5 1 3.7 3.6 1.9 7.3l3.7 2.9C6.5 7.4 9 5 12 5z"
                  />
                  <path
                    fill="#4285F4"
                    d="M23.5 12.3c0-.8-.1-1.6-.2-2.3H12v4.6h6.5c-.3 1.5-1.1 2.8-2.4 3.7l3.7 2.9c2.2-2 3.7-5 3.7-8.9z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.6 14.8c-.2-.7-.4-1.5-.4-2.3s.2-1.6.4-2.3L1.9 7.3C.7 9.7 0 12.3 0 15.1s.7 5.4 1.9 7.8l3.7-2.9c-.2-.7-.4-1.5-.4-2.3z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23.5c3.2 0 6-1.1 8-3l-3.7-2.9c-1.1.7-2.5 1.2-4.3 1.2-3 0-5.5-2-6.4-4.8L1.9 17c1.8 3.7 5.6 6.5 10.1 6.5z"
                  />
                </svg>
                Continue with Google
              </button>

              <div className="relative my-4">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-[#DDD7E5]/25" />
                </div>
                <div className="relative flex justify-center text-[10px] uppercase font-medium tracking-wider">
                  <span className="bg-[#FFFFFF] px-2 text-[#1C1924]/60">or with email</span>
                </div>
              </div>
            </>
          )}

          <form onSubmit={handleSubmit} className="space-y-3.5">
            {mode === 'signup' && (
              <div className="relative">
                <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#1C1924]/60" />
                <input
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Username"
                  className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-[#FFFFFF] border border-[#DDD7E5]/40 text-[#1C1924] placeholder-[#1C1924]/50 text-sm focus:outline-none focus:border-[#B2A4D7] focus:ring-1 focus:ring-[#B2A4D7] transition"
                />
              </div>
            )}

            <div className="relative">
              <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#1C1924]/60" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Email address"
                className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-[#FFFFFF] border border-[#DDD7E5]/40 text-[#1C1924] placeholder-[#1C1924]/50 text-sm focus:outline-none focus:border-[#B2A4D7] focus:ring-1 focus:ring-[#B2A4D7] transition"
              />
            </div>

            {mode !== 'forgot' && (
              <>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#1C1924]/60" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    minLength={6}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Password"
                    className="w-full pl-10 pr-10 py-2.5 rounded-2xl bg-[#FFFFFF] border border-[#DDD7E5]/40 text-[#1C1924] placeholder-[#1C1924]/50 text-sm focus:outline-none focus:border-[#B2A4D7] focus:ring-1 focus:ring-[#B2A4D7] transition"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#1C1924]/60 hover:text-[#1C1924] transition cursor-pointer"
                    tabIndex={-1}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>

                {mode === 'signin' && (
                  <div className="flex justify-end pr-1">
                    <button
                      type="button"
                      onClick={() => resetFormState('forgot')}
                      className="text-xs text-[#1C1924]/80 hover:text-[#1C1924] transition cursor-pointer font-medium"
                    >
                      Forgot password?
                    </button>
                  </div>
                )}
              </>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-1.5 py-3 rounded-2xl bg-[#7D4B9F] hover:bg-[#7D4B9F] text-[#1C1924] font-medium text-sm tracking-wide shadow-lg shadow-[#7D4B9F]/30 transition active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
            >
              {loading && <Loader2 className="w-4 h-4 animate-spin text-[#1C1924]" />}
              {mode === 'signup' && 'Sign Up'}
              {mode === 'signin' && 'Sign In'}
              {mode === 'forgot' && 'Send Reset Link'}
            </button>
          </form>

          <div className="mt-5 text-center">
            {mode === 'forgot' ? (
              <button
                type="button"
                onClick={() => resetFormState('signin')}
                className="text-xs text-[#1C1924]/80 hover:text-[#1C1924] transition cursor-pointer"
              >
                Back to <span className="text-[#1C1924] font-medium">Sign In</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={() => resetFormState(mode === 'signin' ? 'signup' : 'signin')}
                className="text-xs text-[#1C1924]/80 hover:text-[#1C1924] transition cursor-pointer"
              >
                {mode === 'signin' ? (
                  <>
                    Need an account? <span className="text-[#1C1924] font-medium">Sign Up</span>
                  </>
                ) : (
                  <>
                    Already have an account? <span className="text-[#1C1924] font-medium">Sign In</span>
                  </>
                )}
              </button>
            )}
          </div>

          <p className="mt-6 text-[10px] text-center text-[#1C1924]/50 leading-relaxed">
            By continuing, you agree to our{' '}
            <Link href="/terms" className="text-[#1C1924]/80 hover:text-[#1C1924] transition">Terms</Link>
            {' '}&{' '}
            <Link href="/privacy" className="text-[#1C1924]/80 hover:text-[#1C1924] transition">Privacy Policy</Link>.
          </p>
        </div>
      </main>
    </div>
  );
}


