'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Mail, ArrowLeft, CheckCircle2, ShieldCheck } from 'lucide-react';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;

    setIsLoading(true);
    // Simulate auth recovery dispatch
    setTimeout(() => {
      setIsLoading(false);
      setIsSubmitted(true);
    }, 700);
  };

  return (
    <main className="min-h-screen bg-[#F8F7FA] text-[#1C1924] flex flex-col justify-center px-4 py-12">
      <div className="w-full max-w-sm mx-auto bg-[#FFFFFF] border border-[#9A8CC3]/35 rounded-3xl p-6 sm:p-8 shadow-2xl">
        <Link
          href="/login"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#B2A4D7] hover:text-[#1C1924] transition mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Login
        </Link>

        {isSubmitted ? (
          <div className="flex flex-col items-center text-center space-y-3">
            <div className="p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
              <CheckCircle2 className="w-7 h-7" />
            </div>
            <h1 className="text-xl font-medium text-[#1C1924]">Reset Link Sent</h1>
            <p className="text-sm text-[#1C1924] leading-relaxed">
              If an account is associated with <span className="text-[#1C1924] font-medium">{email}</span>, you will receive a secure password recovery link shortly.
            </p>
            <div className="p-3 rounded-xl bg-[#FFFFFF] border border-[#9A8CC3]/30 text-xs text-[#1C1924] text-left leading-normal w-full mt-2">
              <span className="font-semibold text-[#1C1924] block mb-0.5">Check Your Junk Folder</span>
              Security emails sometimes filter into spam or promotions tabs. Please check there if nothing arrives within 2 minutes.
            </div>
            <button
              onClick={() => setIsSubmitted(false)}
              className="mt-4 text-xs font-semibold text-[#9A8CC3] hover:text-[#1C1924] transition"
            >
              Try another email
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col space-y-4">
            <div className="flex flex-col space-y-1">
              <div className="flex items-center gap-2 mb-1">
                <ShieldCheck className="w-5 h-5 text-[#9A8CC3]" />
                <h1 className="text-xl font-medium text-[#1C1924]">Reset Your Password</h1>
              </div>
              <p className="text-sm text-[#1C1924] leading-relaxed">
                Enter your account email address and we will dispatch a confidential reset link.
              </p>
            </div>

            <div className="relative">
              <Mail className="w-4 h-4 text-[#9A8CC3] absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full bg-[#FFFFFF] border border-[#9A8CC3]/40 focus:border-[#9A8CC3] rounded-2xl pl-10 pr-4 py-3 text-sm text-[#1C1924] placeholder-[#756D82]/60 outline-none transition"
              />
            </div>

            <button
              type="submit"
              disabled={isLoading || !email.trim()}
              className="w-full py-2.5 rounded-full bg-[#6555B8] hover:bg-[#9A8CC3] hover:text-[#FFFFFF] text-white font-medium text-xs shadow-lg transition disabled:opacity-40"
            >
              {isLoading ? 'Dispatching...' : 'Send Recovery Link'}
            </button>
          </form>
        )}
      </div>
    </main>
  );
}
