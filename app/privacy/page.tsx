'use client';

import React from 'react';
import Link from 'next/link';

export default function PrivacyPage() {
  return (
    <main className="max-w-4xl mx-auto w-full px-4 py-8 flex-1">
      <div className="border-b border-[#725A7A]/25 pb-4 mb-6">
        <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">Privacy Policy</h1>
        <p className="text-xs sm:text-sm text-[#DDD8D4] mt-1">Last updated: September 2026</p>
      </div>

      <div className="p-6 sm:p-8 rounded-3xl bg-[#241E2F] border border-[#725A7A]/35 shadow-xl space-y-5 text-xs sm:text-sm text-[#DDD8D4] leading-relaxed">
        <section className="space-y-1.5">
          <h2 className="text-base font-bold text-white">1. Information We Collect</h2>
          <p>
            asiansin.love collects information you provide directly during account registration, profile setup, and gesture identity verification. This includes email addresses, display names, age, location, and photos submitted for human review.
          </p>
        </section>

        <section className="space-y-1.5">
          <h2 className="text-base font-bold text-white">2. Verification Selfies</h2>
          <p>
            Selfies taken with requested gesture poses are used strictly by our moderation team to confirm identity and prevent catfishing. Verification selfies are never sold, rented, or made public on your profile.
          </p>
        </section>

        <section className="space-y-1.5">
          <h2 className="text-base font-bold text-white">3. Data Protection</h2>
          <p>
            We implement Row Level Security (RLS) and encrypted database connections to ensure your private chat messages and personal details remain confidential between you and your conversational partner.
          </p>
        </section>

        <div className="pt-4 border-t border-[#725A7A]/25">
          <Link href="/" className="text-xs font-bold text-[#E6D7FA] hover:underline">
            ← Back to Home
          </Link>
        </div>
      </div>
    </main>
  );
}
