'use client';

import React from 'react';

export default function PrivacyPolicyPage() {
  return (
    <main className="max-w-3xl mx-auto px-4 sm:px-6 py-8 pb-28 space-y-6">
      
      <div className="space-y-1">
        <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
          Privacy Policy
        </h1>
        <p className="text-xs sm:text-sm text-[#DDD8D4]">
          How we protect your personal information, photos, and messages.
        </p>
      </div>

      <div className="rounded-3xl bg-[#241E2F] border border-[#725A7A]/35 p-6 sm:p-8 space-y-5 shadow-xl text-sm leading-relaxed text-[#DDD8D4]">
        <p>
          Your privacy and safety are paramount. We never sell your personal data, chat history, or verification photos to advertising brokers or external marketing companies.
        </p>
        
        <h3 className="text-sm font-extrabold text-white uppercase tracking-wider pt-2">
          Verification Selfie Security
        </h3>
        <p>
          Photos uploaded solely for gesture identity verification are stored in encrypted, non-public storage containers. They are reviewed strictly by our safety audit team and are never published to your public bio or shared with other members.
        </p>

        <h3 className="text-sm font-extrabold text-white uppercase tracking-wider pt-2">
          Account Deletion & Data Erasure
        </h3>
        <p>
          You retain full ownership of your data. You may update your profile or delete your account at any time from your settings screen, which purges your active profile and messages from our live directory.
        </p>
      </div>

    </main>
  );
}