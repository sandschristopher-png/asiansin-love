'use client';

import React from 'react';
import Link from 'next/link';
import { 
  ShieldCheck, 
  Sparkles, 
  Camera, 
  UserCheck, 
  Flame, 
  ChevronRight, 
  CheckCircle2, 
  AlertCircle 
} from 'lucide-react';

interface RepScoreCardProps {
  score?: number;
  isVerified?: boolean;
  isPlus?: boolean;
  photoCount?: number;
  hasBio?: boolean;
  onOpenUpgrade?: () => void;
}

export function RepScoreCard({
  score = 65,
  isVerified = false,
  isPlus = false,
  photoCount = 2,
  hasBio = true,
  onOpenUpgrade
}: RepScoreCardProps) {
  // Determine tier based on reputation score
  const getTier = (s: number) => {
    if (s >= 90) return { name: 'Diamond Tier', color: 'text-cyan-600 bg-cyan-50 border-cyan-200' };
    if (s >= 80) return { name: 'Gold Tier', color: 'text-[#6555B8] bg-[#F3EFFC] border-[#DDD7E5]' };
    if (s >= 65) return { name: 'Silver Tier', color: 'text-slate-700 bg-slate-100 border-slate-200' };
    return { name: 'Building Trust', color: 'text-amber-700 bg-amber-50 border-amber-200' };
  };

  const tier = getTier(score);

  const tasks = [
    {
      id: 'verify',
      label: 'Live Face & Gesture Verification',
      pts: '+35 pts',
      completed: isVerified,
      href: '/verify',
      icon: <Camera className="w-4 h-4 text-[#6555B8]" />,
      actionText: 'Verify Now'
    },
    {
      id: 'photos',
      label: 'Upload 3+ Photos & Bio',
      pts: '+20 pts',
      completed: photoCount >= 3 && hasBio,
      href: '/profile/edit',
      icon: <UserCheck className="w-4 h-4 text-[#6555B8]" />,
      actionText: 'Complete Profile'
    },
    {
      id: 'plus',
      label: 'AIL+ Verified Membership',
      pts: '+15 pts',
      completed: isPlus,
      onClick: onOpenUpgrade,
      href: onOpenUpgrade ? undefined : '/pricing',
      icon: <Flame className="w-4 h-4 text-amber-500 fill-amber-500" />,
      actionText: 'Upgrade to Plus'
    }
  ];

  return (
    <div className="w-full rounded-3xl bg-white border border-neutral-100 shadow-sm p-4 sm:p-5 flex flex-col gap-4 text-[#1C1924]">
      {/* Top Header & Score Meter */}
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-neutral-900 tracking-tight">Reputation Score</span>
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${tier.color}`}>
              {tier.name}
            </span>
          </div>
          <p className="text-[11px] text-neutral-500">
            Higher scores earn top discovery rank and trust badges.
          </p>
        </div>

        {/* Score Pill / Meter */}
        <div className="flex items-baseline gap-0.5 bg-[#FAF9FD] px-3.5 py-1.5 rounded-2xl border border-[#ECE6F7]">
          <span className="text-2xl font-black text-[#6555B8]">{score}</span>
          <span className="text-xs font-bold text-neutral-400">/100</span>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="w-full bg-neutral-100 rounded-full h-2 overflow-hidden">
        <div
          className="bg-gradient-to-r from-[#6555B8] to-purple-500 h-full rounded-full transition-all duration-500"
          style={{ width: `${Math.min(100, Math.max(0, score))}%` }}
        />
      </div>

      {/* Actionable Boost Items */}
      <div className="space-y-2 pt-1">
        <div className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider px-1">
          Ways to Boost Your Standing
        </div>

        <div className="space-y-1.5">
          {tasks.map((task) => (
            <div
              key={task.id}
              className="flex items-center justify-between p-2.5 rounded-2xl bg-[#FAF9FD] border border-[#ECE6F7] text-left transition hover:border-[#DDD7E5]"
            >
              <div className="flex items-center gap-2.5 min-w-0 pr-2">
                <div className="w-7 h-7 rounded-xl bg-white border border-[#DDD7E5] flex items-center justify-center shrink-0 shadow-2xs">
                  {task.icon}
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-neutral-900 truncate">
                    {task.label}
                  </p>
                  <p className="text-[10px] font-medium text-emerald-600">
                    {task.completed ? 'Earned' : task.pts}
                  </p>
                </div>
              </div>

              {task.completed ? (
                <div className="flex items-center gap-1 text-emerald-600 text-[11px] font-semibold shrink-0">
                  <CheckCircle2 className="w-4 h-4 fill-emerald-600 text-white" />
                  <span>Done</span>
                </div>
              ) : task.onClick ? (
                <button
                  type="button"
                  onClick={task.onClick}
                  className="px-2.5 py-1 rounded-xl bg-[#6555B8] hover:bg-[#5747A9] text-white text-[11px] font-semibold transition shrink-0 flex items-center gap-1"
                >
                  <span>{task.actionText}</span>
                  <ChevronRight className="w-3 h-3" />
                </button>
              ) : (
                <Link
                  href={task.href || '#'}
                  className="px-2.5 py-1 rounded-xl bg-[#6555B8] hover:bg-[#5747A9] text-white text-[11px] font-semibold transition shrink-0 flex items-center gap-1"
                >
                  <span>{task.actionText}</span>
                  <ChevronRight className="w-3 h-3" />
                </Link>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default RepScoreCard;