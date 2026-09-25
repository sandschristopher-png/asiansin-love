'use client';

import React from 'react';
import Link from 'next/link';

export default function TermsPage() {
  return (
    <main className="max-w-4xl mx-auto w-full px-4 py-8 flex-1">
      <div className="border-b border-[#725A7A]/25 pb-4 mb-6">
        <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">Terms of Use</h1>
        <p className="text-xs sm:text-sm text-[#DDD8D4] mt-1">Last updated: September 2026</p>
      </div>

      <div className="p-6 sm:p-8 rounded-3xl bg-[#241E2F] border border-[#725A7A]/35 shadow-xl space-y-5 text-xs sm:text-sm text-[#DDD8D4] leading-relaxed">
        <section className="space-y-1.5">
          <h2 className="text-base font-bold text-white">1. Zero Financial Solicitation Policy</h2>
          <p>
            Users agree never to solicit, request, or offer funds, money transfers, wire transfers, GCash remittances, gift cards, or financial gifts under any circumstances. Violation results in immediate, permanent account termination.
          </p>
        </section>

        <section className="space-y-1.5">
          <h2 className="text-base font-bold text-white">2. Sincere Intentions</h2>
          <p>
            asiansin.love is designated exclusively for adults seeking genuine, dignified cross-border courtship and marriage. Commercial solicitation, adult service promotion, and deceptive behavior are strictly prohibited.
          </p>
        </section>

        <section className="space-y-1.5">
          <h2 className="text-base font-bold text-white">3. Account Eligibility</h2>
          <p>
            You must be at least 18 years of age to register and participate in this platform. You are responsible for maintaining the confidentiality of your login credentials.
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
