'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';


export default function TermsOfUsePage() {
  return (
    <div className="min-h-screen flex flex-col bg-[#F8F7FA] text-[#1C1924]">

      <main className="max-w-3xl mx-auto w-full px-4 sm:px-6 py-8 sm:py-12 flex-1 space-y-6">
        
        {/* Navigation Breadcrumb */}
        <div>
          <Link
            href="/discover"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#9A8CC3] hover:text-[#1C1924] transition"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Discover</span>
          </Link>
        </div>

        {/* Header */}
        <div className="space-y-1">
          <span className="text-[11px] font-medium uppercase tracking-wider text-[#9A8CC3]">
            Legal & Terms
          </span>
          <h1 className="text-xl sm:text-[22px] font-semibold text-[#1C1924] ">
            Terms of Use
          </h1>
          <p className="text-xs sm:text-sm text-[#1C1924]">
            Agreement terms for accessing and interacting on asiansin.love.
          </p>
        </div>

        {/* Terms Body Card */}
        <div className="rounded-3xl bg-[#FFFFFF] border border-[#9A8CC3]/35 p-6 sm:p-9 space-y-5 shadow-2xl text-sm leading-relaxed text-[#1C1924]">
          <p>
            By creating an account on asiansin.love, you confirm that you are at least 18 years of age and seeking authentic interpersonal courtship.
          </p>
          
          <h2 className="text-xs font-medium text-[#1C1924] uppercase tracking-wider pt-2">
            Non-Agency Platform Notice
          </h2>
          <p>
            asiansin.love operates strictly as an independent communications service connecting adult individuals. We are not an international marriage broker, catalog agency, or legal immigration representative. All users are personally responsible for conducting their own diligence and exercising caution before meeting in person.
          </p>

          <h2 className="text-xs font-medium text-[#1C1924] uppercase tracking-wider pt-2">
            Prohibited Conduct
          </h2>
          <p>
            Users must not utilize automated bots, scrape member photos, distribute unsolicited advertisements, or engage in deceptive romance fraud. Violations result in permanent hardware, IP, and account bans.
          </p>
        </div>

      </main>
    </div>
  );
}

