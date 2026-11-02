'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { CheckCircle2, Eye, EyeOff, KeyRound, Loader2 } from 'lucide-react';
import { supabase } from '@/lib/supabase/client';
import { BrandLogo } from '@/components/BrandLogo';
import { InAppToast } from '@/components/InAppToast';

const MIN_PASSWORD_LENGTH = 8;

export default function ResetPasswordPage() {
  const router = useRouter();
  const [checking, setChecking] = useState(true);
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const closeToast = useCallback(() => setToast(null), []);

  // Only a recovery (or signed-in) session may set a new password. /auth/callback creates that
  // session from the emailed link; without one the link expired or was opened elsewhere.
  useEffect(() => {
    let cancelled = false;
    supabase.auth.getUser().then(({ data }) => {
      if (cancelled) return;
      if (!data.user) {
        router.replace('/login?notice=reset_expired');
        return;
      }
      setChecking(false);
    });
    return () => {
      cancelled = true;
    };
  }, [router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (password.length < MIN_PASSWORD_LENGTH) {
      setError(`Use at least ${MIN_PASSWORD_LENGTH} characters.`);
      return;
    }
    if (password !== confirm) {
      setError('Passwords do not match.');
      return;
    }

    setSaving(true);
    const { error: updateError } = await supabase.auth.updateUser({ password });
    setSaving(false);

    if (updateError) {
      setError(
        /different from the old/i.test(updateError.message)
          ? 'Choose a password different from your current one.'
          : updateError.message
      );
      return;
    }

    setToast('Password updated successfully!');
    setTimeout(() => router.replace('/discover'), 1500);
  };

  if (checking) {
    return (
      <div className="min-h-screen w-full bg-[#FAF8FD] flex items-center justify-center">
        <Loader2 className="w-7 h-7 animate-spin text-[#6555B8]" />
      </div>
    );
  }

  const inputClass =
    'w-full py-3 px-4 pr-11 rounded-2xl bg-white border border-[#DDD7E5] text-xs text-[#1C1924] placeholder:text-[#A8A1B5] focus:outline-none focus:border-[#6555B8] focus:ring-4 focus:ring-[#6555B8]/10 transition';

  return (
    <div className="min-h-screen w-full bg-[#FAF8FD] flex items-center justify-center p-4 sm:p-6 font-sans antialiased">
      <InAppToast message={toast} onClose={closeToast} icon={<CheckCircle2 className="w-3.5 h-3.5" />} />
      <main className="w-full max-w-[420px] bg-white rounded-3xl border border-[#DDD7E5] shadow-xl shadow-[#1C1536]/5 p-7 sm:p-9 space-y-6">
        <div className="text-center space-y-2">
          <div className="flex justify-center mb-3">
            <BrandLogo size="md" />
          </div>
          <h1 className="text-2xl font-black text-[#1C1924] tracking-tight">Choose a new password</h1>
          <p className="text-xs text-[#6C637B]">At least {MIN_PASSWORD_LENGTH} characters.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5 text-left">
            <label htmlFor="new-password" className="text-xs font-bold text-[#1C1924] block">
              New Password
            </label>
            <div className="relative">
              <input
                id="new-password"
                type={showPassword ? 'text' : 'password'}
                autoComplete="new-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="New password"
                className={inputClass}
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#A8A1B5] hover:text-[#524B5E] transition cursor-pointer"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <div className="space-y-1.5 text-left">
            <label htmlFor="confirm-password" className="text-xs font-bold text-[#1C1924] block">
              Confirm New Password
            </label>
            <input
              id="confirm-password"
              type={showPassword ? 'text' : 'password'}
              autoComplete="new-password"
              required
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              placeholder="Repeat new password"
              className={inputClass}
            />
          </div>

          {error && (
            <p className="text-xs font-semibold text-rose-600 bg-rose-50 border border-rose-200 rounded-xl px-3.5 py-2.5">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={saving || Boolean(toast)}
            className="w-full py-3.5 px-6 rounded-2xl bg-[#6555B8] text-white text-xs font-bold flex items-center justify-center gap-2 shadow-md shadow-[#6555B8]/20 hover:bg-[#5444A0] active:scale-[0.99] transition cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <KeyRound className="w-4 h-4" />}
            <span>{saving ? 'Updating...' : 'Update Password'}</span>
          </button>
        </form>
      </main>
    </div>
  );
}
