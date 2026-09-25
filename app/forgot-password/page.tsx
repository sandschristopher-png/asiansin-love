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
    <main className="min-h-screen bg-[#15101C] text-[#E6D7FA] flex flex-col justify-center px-4 py-12">
      <div className="w-full max-w-sm mx-auto bg-[#241E2F]/80 backdrop-blur-xl border border-[#653C87]/40 rounded-3xl p-6 shadow-2xl">
        <Link
          href="/login"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#9A79BA] hover:text-[#E6D7FA] transition mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Login
        </Link>

        {isSubmitted ? (
          <div className="flex flex-col items-center text-center space-y-3">
            <div className="p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
              <CheckCircle2 className="w-7 h-7" />
            </div>
            <h1 className="text-xl font-bold text-[#E6D7FA]">Reset Link Sent</h1>
            <p className="text-xs text-[#7D7E92] leading-relaxed">
              If an account is associated with <span className="text-[#E6D7FA] font-medium">{email}</span>, you will receive a secure password recovery link shortly.
            </p>
            <div className="p-3 rounded-xl bg-[#15101C]/60 border border-[#241E2F] text-[11px] text-[#7D7E92] text-left leading-normal w-full mt-2">
              <span className="font-semibold text-[#E6D7FA] block mb-0.5">Check Your Junk Folder</span>
              Security emails sometimes filter into spam or promotions tabs. Please check there if nothing arrives within 2 minutes.
            </div>
            <button
              onClick={() => setIsSubmitted(false)}
              className="mt-4 text-xs font-semibold text-[#9A79BA] hover:text-[#E6D7FA] transition"
            >
              Try another email
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col space-y-4">
            <div className="flex flex-col space-y-1">
              <div className="flex items-center gap-2 mb-1">
                <ShieldCheck className="w-5 h-5 text-[#9A79BA]" />
                <h1 className="text-lg font-bold text-[#E6D7FA]">Reset Your Password</h1>
              </div>
              <p className="text-xs text-[#7D7E92] leading-relaxed">
                Enter your account email address and we will dispatch a confidential reset link.
              </p>
            </div>

            <div className="relative">
              <Mail className="w-4 h-4 text-[#7D7E92] absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full bg-[#15101C] border border-[#241E2F] focus:border-[#653C87] rounded-full pl-10 pr-4 py-2.5 text-xs text-[#E6D7FA] placeholder-[#7D7E92] outline-none transition"
              />
            </div>

            <button
              type="submit"
              disabled={isLoading || !email.trim()}
              className="w-full py-2.5 rounded-full bg-[#653C87] hover:bg-[#9A79BA] hover:text-[#15101C] text-[#E6D7FA] font-bold text-xs shadow-lg transition disabled:opacity-40"
            >
              {isLoading ? 'Dispatching...' : 'Send Recovery Link'}
            </button>
          </form>
        )}
      </div>
    </main>
  );
}