'use client';

import React, { useState, useEffect } from 'react';
import { CheckCircle2, AlertCircle, Loader2, Crown, User, LogOut } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';

export default function SettingsPage() {
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [initialLoading, setInitialLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    async function loadUserProfile() {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session?.user) {
          setInitialLoading(false);
          return;
        }

        setUserId(session.user.id);

        const { data, error } = await supabase
          .from('profiles')
          .select('username')
          .eq('id', session.user.id)
          .single();

        if (!error && data?.username) {
          setUsername(data.username);
        }
      } catch (err: any) {
        console.error('Failed to load profile:', err);
      } finally {
        setInitialLoading(false);
      }
    }

    loadUserProfile();
  }, []);

  const handleSaveHandle = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSavedSuccess(false);

    if (!userId) {
      setErrorMessage('You must be signed in to update your handle.');
      return;
    }

    const cleanUsername = username.trim().toLowerCase().replace(/^@/, '');

    if (!cleanUsername) {
      setErrorMessage('Username cannot be empty.');
      return;
    }

    if (cleanUsername.length < 3 || cleanUsername.length > 20) {
      setErrorMessage('Username must be between 3 and 20 characters.');
      return;
    }

    if (!/^[a-z0-9_.]+$/.test(cleanUsername)) {
      setErrorMessage('Only lowercase letters, numbers, underscores, and periods are allowed.');
      return;
    }

    setIsSaving(true);

    try {
      const res = await fetch('/api/users/change-username', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: cleanUsername }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        if (res.status === 409 || data.error?.includes('taken')) {
          setErrorMessage('That username handle is already taken. Please pick another.');
        } else if (res.status === 403 && data.requires_payment) {
          setErrorMessage(data.error || 'Changing an established handle requires Asians in Love Plus.');
        } else {
          setErrorMessage(data.error || 'Failed to update username handle.');
        }
        return;
      }

      setUsername(cleanUsername);
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 3000);
    } catch (err: any) {
      setErrorMessage(err.message || 'An unexpected network error occurred.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleSignOut = async () => {
    try {
      await supabase.auth.signOut();
    } catch (err) {
      console.error('Sign out error:', err);
    } finally {
      router.push('/login');
      router.refresh();
    }
  };

  return (
    <main className="flex-1 max-w-md mx-auto w-full px-4 pt-4 pb-20 space-y-4">
      {/* Account Settings Card */}
      <div className="bg-white rounded-2xl border border-[#DDD7E5]/70 p-4 sm:p-5 shadow-xs space-y-5">
        <form onSubmit={handleSaveHandle} className="space-y-3">
          <div className="space-y-1.5">
            <label className="text-[11px] font-semibold uppercase tracking-wider text-[#524B5E]">
              Username Handle
            </label>
            <div className="relative flex items-center">
              <span className="absolute left-3 text-sm text-[#8C849B]">@</span>
              <input
                type="text"
                value={username}
                maxLength={20}
                onChange={(e) => {
                  setUsername(e.target.value);
                  if (errorMessage) setErrorMessage(null);
                }}
                disabled={initialLoading || isSaving}
                className="w-full pl-7 pr-20 py-2 bg-white border border-[#DDD7E5] rounded-xl text-sm font-semibold text-[#1C1924] focus:outline-none focus:border-[#6555b8] focus:ring-2 focus:ring-[#6555b8]/15 transition shadow-xs disabled:opacity-60"
                placeholder={initialLoading ? 'Loading handle...' : 'username'}
              />
              <button
                type="submit"
                disabled={initialLoading || isSaving}
                className="absolute right-1 px-3 py-1 rounded-lg bg-[#6555b8] hover:bg-[#52449e] disabled:opacity-50 text-white text-xs font-semibold transition active:scale-95 shadow-xs flex items-center gap-1 cursor-pointer"
              >
                {isSaving && <Loader2 className="w-3 h-3 animate-spin" />}
                <span>Save</span>
              </button>
            </div>
            <p className="text-[11px] text-[#8C849B]">
              Lowercase letters, numbers, underscores, and periods (3–20 characters).
            </p>

            {errorMessage && (
              <p className="text-xs font-medium text-red-600 flex items-center gap-1.5 pt-0.5">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" /> {errorMessage}
              </p>
            )}

            {savedSuccess && (
              <p className="text-xs font-semibold text-emerald-600 flex items-center gap-1 pt-0.5">
                <CheckCircle2 className="w-3.5 h-3.5 shrink-0" /> Handle updated successfully!
              </p>
            )}
          </div>
        </form>

        {/* Premium Member Features */}
        <div className="p-4 rounded-xl bg-[#FAF8FD] border border-[#DDD7E5]/70 flex items-start gap-3.5">
          <div className="w-9 h-9 rounded-xl bg-[#F3EFFC] text-[#6555b8] flex items-center justify-center shrink-0">
            <Crown className="w-4 h-4 text-amber-500" />
          </div>
          <div className="space-y-1 flex-1">
            <h3 className="text-xs sm:text-sm font-medium text-[#1C1924]">
              Premium Member Features
            </h3>
            <p className="text-xs text-[#524B5E] leading-relaxed">
              Direct international translation, prioritized introduction badges, and unlimited verified passport filters.
            </p>
            <div className="pt-1.5">
              <Link
                href="/pricing"
                className="inline-block px-3.5 py-1 rounded-full bg-white border border-[#DDD7E5] hover:border-[#6555b8] text-xs font-semibold text-[#6555b8] hover:bg-[#F3EFFC] transition shadow-xs"
              >
                View Membership Tiers &rarr;
              </Link>
            </div>
          </div>
        </div>

        {/* Quick Account Links */}
        <div className="border-t border-[#F0ECF5] pt-3 flex flex-col gap-1">
          <Link
            href="/profile"
            className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-medium text-[#524B5E] hover:bg-[#FAF8FD] hover:text-[#1C1924] transition"
          >
            <User className="w-4 h-4 text-[#6555b8]" />
            <span>Manage Profile & Photos</span>
          </Link>
          <button
            type="button"
            onClick={handleSignOut}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-medium text-rose-600 hover:bg-rose-50 transition text-left cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
            <span>Sign Out</span>
          </button>
        </div>
      </div>
    </main>
  );
}
