'use client';

import React from 'react';
import Link from 'next/link';
import { HelpCircle } from 'lucide-react';

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
  const clampedScore = Math.min(100, Math.max(0, score));

  return (
    <div className="w-full rounded-2xl bg-white border border-[#E5E1EC] p-4 sm:p-5 shadow-xs flex flex-col gap-3 text-[#1C1924]">
      {/* Header & Score */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold tracking-tight text-[#1C1924]">Reputation Score</h3>
          <p className="text-xs text-[#756D82]">Community trust & conduct health</p>
        </div>

        <div className="flex items-baseline gap-1 bg-[#FAF9FD] px-3 py-1.5 rounded-xl border border-[#ECE6F7]">
          <span className="text-2xl font-bold text-[#6555B8]">{clampedScore}</span>
          <span className="text-xs font-semibold text-[#8C849B]">/100</span>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="w-full bg-[#F3EFFC] rounded-full h-1.5 overflow-hidden">
        <div
          className="bg-[#6555B8] h-full rounded-full transition-all duration-500"
          style={{ width: `${clampedScore}%` }}
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