'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, ShieldCheck, ExternalLink } from 'lucide-react';
import { supabase } from '@/lib/supabase/client';
import { ReputationBadge } from '@/components/ReputationBadge';
import { reputationTokens } from '@/lib/utils/reputation';

export default function ReputationScreen() {
  const [score, setScore] = useState<number>(100);

  useEffect(() => {
    async function loadScore() {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const { data } = await supabase
            .from('profiles')
            .select('reputation_score')
            .eq('id', user.id)
            .single();

          if (typeof data?.reputation_score === 'number') {
            setScore(data.reputation_score);
          }
        }
      } catch {
        // Fallback default
      }
    }
    loadScore();
  }, []);

  return (
    <div className="min-h-screen max-w-md mx-auto bg-white border-x border-[#D0CDE1] flex flex-col text-[#413B5E]">
      {/* Sticky Top Header */}
      <header className="flex items-center gap-3 px-4 py-3 bg-white/95 backdrop-blur-md border-b border-[#D0CDE1] sticky top-0 z-10">
        <Link
          href="/profile"
          className="w-8 h-8 rounded-full flex items-center justify-center text-[#413B5E]/85 hover:text-[#413B5E] hover:bg-[#E8E6F1]/70 transition"
          aria-label="Back to profile"
        >
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <h1 className="text-sm font-semibold text-[#413B5E] tracking-tight">
          Reputation & Trust
        </h1>
      </header>

      {/* Screen Body with pb-28 to clear the floating bottom dock */}
      <main className="p-4 space-y-3 flex-1 pb-28">
        {/* Score Card Hero */}
        <div className="rounded-2xl bg-white border border-[#D0CDE1] p-4 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#665D96]">Your Standing</span>
              <p className="text-xs font-semibold text-[#413B5E]">
                {score >= 90 ? 'Unblemished Community Trust' : 'Active Member Standing'}
              </p>
            </div>
            <ReputationBadge score={score} size="md" />
          </div>

          <div className={`w-full rounded-full h-1.5 overflow-hidden ${reputationTokens(score).light.track}`}>
            <div
              className={`h-full rounded-full transition-all duration-500 ${reputationTokens(score).light.bar}`}
              style={{ width: reputationTokens(score).percent }}
            />
          </div>
        </div>

        {/* Compact Conduct Summary Card */}
        <div className="rounded-2xl bg-white border border-[#D0CDE1] p-4 shadow-xs space-y-3">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-[#E8E6F1]/60 text-[#665D96] flex items-center justify-center shrink-0">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <h2 className="text-xs font-bold text-[#413B5E]">How Community Trust Works</h2>
          </div>

          <p className="text-xs leading-relaxed text-[#413B5E]/85">
            Every verified member begins with a 100 baseline score. Rather than grinding points, your standing is maintained through kind, genuine conversation and mutual respect.
          </p>

          <div className="p-3 rounded-xl bg-amber-50/70 border border-amber-200/70 space-y-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-amber-900">What Drops Your Score</span>
            <p className="text-[11px] leading-relaxed text-[#413B5E]/85">
              Financial requests (GCash, wire, bills), escort inquiries, unsolicited explicit media demands, and premature off-platform pressure are automatically quarantined and result in reputation deductions or ejection.
            </p>
          </div>

          {/* Deep-dive link */}
          <div className="pt-1">
            <Link
              href="/terms"
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#665D96] hover:text-[#413B5E] transition group"
            >
              <span className="group-hover:underline">Read full Safety Guidelines & Terms of Use</span>
              <ExternalLink className="w-3.5 h-3.5 shrink-0" />
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}