'use client';

import React from 'react';
import Link from 'next/link';
import { HelpCircle, ShieldCheck } from 'lucide-react';
import { reputationTokens } from '@/lib/utils/reputation';

export interface RepScoreCardProps {
  score?: number;
  onOpenBreakdown?: () => void;
  isVerified?: boolean;
  isPlus?: boolean;
  photoCount?: number;
  hasBio?: boolean;
  onOpenUpgrade?: () => void;
}

export function RepScoreCard({
  score = 100,
}: RepScoreCardProps) {
  const t = reputationTokens(score);

  return (
    <div className="w-full rounded-2xl bg-white border border-[#D0CDE1]/60 p-4 shadow-brand-sm flex flex-col gap-3 text-[#413B5E]">
      {/* Header & Score */}
      <div className="flex items-center justify-between">
        <div className="flex-1 min-w-0 pr-3">
          <h3 className="text-sm font-semibold tracking-tight text-[#413B5E]">Reputation</h3>
          <p className="text-xs text-[#413B5E]/55">Community trust & conduct health</p>
        </div>

        <div className={`shrink-0 inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full font-bold text-xs whitespace-nowrap ${t.light.container} ${t.light.text}`}>
          <ShieldCheck className={`w-3.5 h-3.5 ${t.light.icon}`} aria-hidden />
          <span className="leading-none tabular-nums">{t.percent}</span>
        </div>
      </div>

      {/* Progress Bar */}
      <div className={`w-full rounded-full h-2 overflow-hidden ${t.light.track}`}>
        <div
          className={`h-full rounded-full transition-all duration-500 ${t.light.bar}`}
          style={{ width: t.percent }}
        />
      </div>

      {/* Direct Link to Mobile Screen */}
      <Link
        href="/profile/reputation"
        className="self-start text-xs font-medium text-[#665D96] hover:text-[#413B5E] transition flex items-center gap-1.5 pt-0.5 cursor-pointer select-none"
      >
        <HelpCircle className="w-3.5 h-3.5 text-[#665D96]" />
        <span>What&apos;s this?</span>
      </Link>
    </div>
  );
}

export default RepScoreCard;