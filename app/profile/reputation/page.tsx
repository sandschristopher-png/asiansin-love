'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, ShieldCheck, ExternalLink } from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';

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
    <div className="min-h-screen max-w-md mx-auto bg-[#FAFAFD] border-x border-[#E5E1EC] flex flex-col text-[#1C1924]">
      {/* Sticky Top Header */}
      <header className="flex items-center gap-3 px-4 py-3 bg-white/95 backdrop-blur-md border-b border-[#E5E1EC] sticky top-0 z-10">
        <Link
          href="/profile"
          className="w-8 h-8 rounded-full flex items-center justify-center text-[#524B5E] hover:text-[#1C1924] hover:bg-[#F3EFFC] transition"
          aria-label="Back to profile"
        >
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <h1 className="text-sm font-semibold text-[#1C1924] tracking-tight">
          Reputation & Trust
        </h1>
      </header>

      {/* Screen Body with pb-28 to clear the floating bottom dock */}
      <main className="p-4 space-y-3 flex-1 pb-28">
        {/* Score Card Hero */}
        <div className="rounded-2xl bg-white border border-[#E5E1EC] p-4 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#6555B8]">Your Standing</span>
              <p className="text-xs font-semibold text-[#1C1924]">
                {score >= 90 ? 'Unblemished Community Trust' : 'Active Member Standing'}
              </p>
            </div>
            <div className="flex items-baseline gap-1 bg-[#FAF9FD] px-3 py-1.5 rounded-xl border border-[#ECE6F7]">
              <span className="text-2xl font-bold text-[#6555B8]">{score}</span>
              <span className="text-xs font-semibold text-[#8C849B]">/100</span>
            </div>
          </div>

          <div className="w-full bg-[#F3EFFC] rounded-full h-1.5 overflow-hidden">
            <div
              className="bg-[#6555B8] h-full rounded-full transition-all duration-500"
              style={{ width: `${Math.min(100, Math.max(0, score))}%` }}
            />
          </div>
        </div>

        {/* Compact Conduct Summary Card */}
        <div className="rounded-2xl bg-white border border-[#E5E1EC] p-4 shadow-xs space-y-3">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-[#F3EFFC] text-[#6555B8] flex items-center justify-center shrink-0">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <h2 className="text-xs font-bold text-[#1C1924]">How Community Trust Works</h2>
          </div>

          <p className="text-xs leading-relaxed text-[#524B5E]">
            Every verified member begins with a 100 baseline score. Rather than grinding points, your standing is maintained through courteous, sincere courtship and mutual respect.
          </p>

          <div className="p-3 rounded-xl bg-amber-50/70 border border-amber-200/70 space-y-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-amber-900">What Drops Your Score</span>
            <p className="text-[11px] leading-relaxed text-stone-700">
              Financial requests (GCash, wire, bills), escort inquiries, unsolicited explicit media demands, and premature off-platform pressure are automatically quarantined and result in reputation deductions or ejection.
            </p>
          </div>

          {/* Deep-dive link */}
          <div className="pt-1">
            <Link
              href="/terms"
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#6555B8] hover:text-[#52449E] transition group"
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