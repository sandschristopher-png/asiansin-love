'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { Footer } from '@/components/Footer';

export default function TermsOfUsePage() {
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
            Legal & Terms
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Terms of Use
          </h1>
          <p className="text-xs sm:text-sm text-[#E6D7FA]">
            Agreement terms for accessing and interacting on asiansin.love.
          </p>
        </div>

        {/* Terms Body Card */}
        <div className="rounded-3xl bg-[#261F33] border border-[#9A79BA]/35 p-6 sm:p-9 space-y-5 shadow-2xl text-sm leading-relaxed text-[#E6D7FA]">
          <p>
            By creating an account on asiansin.love, you confirm that you are at least 18 years of age and seeking authentic interpersonal courtship.
          </p>
          
          <h2 className="text-xs font-bold text-white uppercase tracking-wider pt-2">
            Non-Agency Platform Notice
          </h2>
          <p>
            asiansin.love operates strictly as an independent communications service connecting adult individuals. We are not an international marriage broker, catalog agency, or legal immigration representative. All users are personally responsible for conducting their own diligence and exercising caution before meeting in person.
          </p>

          <h2 className="text-xs font-bold text-white uppercase tracking-wider pt-2">
            Prohibited Conduct
          </h2>
          <p>
            Users must not utilize automated bots, scrape member photos, distribute unsolicited advertisements, or engage in deceptive romance fraud. Violations result in permanent hardware, IP, and account bans.
          </p>
        </div>

      </main>

      <Footer />
    </div>
  );
}
