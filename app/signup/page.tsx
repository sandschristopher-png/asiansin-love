'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';

export default function SignUpPage() {
  const router = useRouter();

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setLoading(true);

    try {
      const cleanEmail = email.trim().toLowerCase();
      const cleanName = fullName.trim();

      const { data, error } = await supabase.auth.signUp({
        email: cleanEmail,
        password,
        options: {
          data: {
            full_name: cleanName,
          },
        },
      });

      if (error) throw error;

      if (data?.user) {
        const { error: profileError } = await supabase.from('profiles').upsert({
          id: data.user.id,
          full_name: cleanName,
          is_verified: false,
        });

        if (profileError) {
          console.warn('Profile initialization note:', profileError.message);
        }
      }

      router.push('/profile');
      router.refresh();
    } catch (err: any) {
      setErrorMsg(err.message || 'Unable to register account. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="max-w-md mx-auto w-full px-4 py-12 flex-1 flex flex-col justify-center">
      <div className="text-center mb-6">
        <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight font-[family-name:var(--font-nunito)]">
          Join asiansin.love
        </h1>
        <p className="text-sm text-[#E6D7FA] mt-1">
          A welcoming, verified community for sincere relationships.
        </p>
      </div>

      <div className="rounded-3xl bg-[#261F33] border border-[#9A79BA]/35 p-6 sm:p-8 shadow-2xl space-y-5">
        {errorMsg && (
          <div className="p-3 rounded-xl bg-rose-950/80 border border-rose-500/50 text-rose-200 text-xs font-semibold animate-in fade-in">
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleSignUp} className="space-y-4">
          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-[#9A79BA] block mb-1">
              Your Name / Display Name
            </label>
            <input
              type="text"
              required
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="e.g. Christopher"
              className="w-full px-4 py-2.5 rounded-2xl bg-[#181222] border border-[#9A79BA]/40 text-white text-sm focus:outline-none focus:border-[#9A79BA] placeholder-[#9A79BA]/60 transition"
            />
          </div>

          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-[#9A79BA] block mb-1">
              Email Address
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="name@example.com"
              className="w-full px-4 py-2.5 rounded-2xl bg-[#181222] border border-[#9A79BA]/40 text-white text-sm focus:outline-none focus:border-[#9A79BA] placeholder-[#9A79BA]/60 transition"
            />
          </div>

          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-[#9A79BA] block mb-1">
              Password
            </label>
            <input
              type="password"
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Minimum 6 characters"
              className="w-full px-4 py-2.5 rounded-2xl bg-[#181222] border border-[#9A79BA]/40 text-white text-sm focus:outline-none focus:border-[#9A79BA] placeholder-[#9A79BA]/60 transition"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 rounded-2xl bg-[#653C87] hover:bg-[#7D49A8] disabled:opacity-50 text-white font-bold text-sm shadow-lg shadow-[#653C87]/40 transition active:scale-95 mt-2"
          >
            {loading ? 'Creating Account...' : 'Create Account'}
          </button>
        </form>

        <div className="pt-2 border-t border-[#9A79BA]/20 text-center text-xs text-[#E6D7FA]">
          Already have an account?{' '}
          <Link href="/login" className="text-[#C9A4E8] font-bold hover:underline">
            Sign In
          </Link>
        </div>
      </div>
    </main>
  );
}
