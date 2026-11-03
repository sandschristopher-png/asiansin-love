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
    <div className="w-full rounded-2xl bg-white border border-[#E5E1EC] p-4 sm:p-5 shadow-xs flex flex-col gap-3 text-[#1C1924]">
      {/* Header & Score */}
      <div className="flex items-center justify-between">
        <div className="flex-1 min-w-0 pr-3">
          <h3 className="text-sm font-semibold tracking-tight text-[#1C1924]">Reputation</h3>
          <p className="text-xs text-[#756D82]">Community trust & conduct health</p>
        </div>

        <div className={`shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-bold whitespace-nowrap ${t.light.container} ${t.light.text}`}>
          <ShieldCheck className={`w-4 h-4 ${t.light.icon}`} aria-hidden />
          <span className="text-xl leading-none tabular-nums">{t.percent}</span>
        </div>
      </div>

      {/* Progress Bar */}
      <div className={`w-full rounded-full h-1.5 overflow-hidden ${t.light.track}`}>
        <div
          className={`h-full rounded-full transition-all duration-500 ${t.light.bar}`}
          style={{ width: t.percent }}
        />
      </div>

      {/* Direct Link to Mobile Screen */}
      <Link
        href="/profile/reputation"
        className="self-start text-xs font-medium text-[#6555B8] hover:text-[#52449E] transition flex items-center gap-1.5 pt-0.5 cursor-pointer select-none"
      >
        <HelpCircle className="w-3.5 h-3.5 text-[#6555B8]" />
        <span>What&apos;s this?</span>
      </Link>
    </div>
  );
}

export default RepScoreCard;