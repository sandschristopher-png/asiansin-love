'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { Footer } from '@/components/Footer';

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen flex flex-col bg-[#130F18] text-[#E6D7FA]">
      <main className="max-w-3xl mx-auto w-full px-4 sm:px-6 py-8 sm:py-12 flex-1 space-y-6">
        
        {/* Navigation Breadcrumb */}
        <div>
          <Link
            href="/discover"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#9A79BA] hover:text-white transition"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Discover</span>
          </Link>
        </div>

        {/* Header */}
        <div className="space-y-1">
          <span className="text-[11px] font-bold uppercase tracking-wider text-[#9A79BA]">
            Privacy & Security
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Privacy Policy
          </h1>
          <p className="text-xs sm:text-sm text-[#E6D7FA]">
            How we protect your personal information, photos, and messages.
          </p>
        </div>

        {/* Policy Body Card */}
        <div className="rounded-3xl bg-[#261F33] border border-[#9A79BA]/35 p-6 sm:p-9 space-y-5 shadow-2xl text-sm leading-relaxed text-[#E6D7FA]">
          <p>
            Your privacy and safety are paramount. We never sell your personal data, chat history, or verification photos to advertising brokers or external marketing companies.
          </p>
          
          <h2 className="text-xs font-bold text-white uppercase tracking-wider pt-2">
            Verification Selfie Security
          </h2>
          <p>
            Photos uploaded solely for gesture identity verification are stored in encrypted, non-public storage containers. They are reviewed strictly by our safety audit team and are never published to your public bio or shared with other members.
          </p>

          <h2 className="text-xs font-bold text-white uppercase tracking-wider pt-2">
            Account Deletion & Data Erasure
          </h2>
          <p>
            You retain full ownership of your data. You may update your profile or delete your account at any time from your settings screen, which purges your active profile and messages from our live directory.
          </p>
        </div>

      </main>

      <Footer />
    </div>
  );
}
