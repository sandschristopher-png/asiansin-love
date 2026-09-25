'use client';

import React from 'react';
import { X, Zap, Check, Sparkles } from 'lucide-react';

interface UpgradeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectPlan?: (planId: string) => void;
}

export default function UpgradeModal({ isOpen, onClose, onSelectPlan }: UpgradeModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-[#15101C]/85 backdrop-blur-md">
      <div className="relative w-full max-w-sm rounded-3xl bg-[#241E2F] border border-[#653C87]/70 p-6 shadow-2xl flex flex-col gap-4 text-[#E6D7FA]">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-[#7D7E92] hover:text-[#E6D7FA] transition"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex flex-col items-center text-center gap-1.5 pt-2">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-[#653C87] to-[#9A79BA] flex items-center justify-center text-[#15101C] shadow-lg mb-1">
            <Sparkles className="w-6 h-6 fill-current" />
          </div>
          <span className="text-xs uppercase tracking-widest text-[#9A79BA] font-bold">
            AIL Club Membership
          </span>
          <h2 className="text-xl font-extrabold text-[#E6D7FA]">
            Skip the Wait, Connect Live
          </h2>
          <p className="text-xs text-[#7D7E92] leading-relaxed">
            Support fair cross-border courtship with zero banner ads, unlimited instant chat, and verified priority delivery.
          </p>
        </div>

        <div className="flex flex-col gap-2.5 py-2 border-y border-[#15101C]/80">
          <div className="flex items-center gap-2.5 text-xs text-[#E6D7FA]">
            <div className="p-1 rounded-full bg-[#653C87]/30 text-emerald-400 shrink-0">
              <Check className="w-3.5 h-3.5" />
            </div>
            <span>Zero cooldown timers — unlimited real-time chat</span>
          </div>
          <div className="flex items-center gap-2.5 text-xs text-[#E6D7FA]">
            <div className="p-1 rounded-full bg-[#653C87]/30 text-emerald-400 shrink-0">
              <Check className="w-3.5 h-3.5" />
            </div>
            <span>Priority inbox placement & confirmed read receipts</span>
          </div>
          <div className="flex items-center gap-2.5 text-xs text-[#E6D7FA]">
            <div className="p-1 rounded-full bg-[#653C87]/30 text-emerald-400 shrink-0">
              <Check className="w-3.5 h-3.5" />
            </div>
            <span>Cross-border multi-city discovery pinning</span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={() => onSelectPlan?.('monthly')}
            className="p-3 rounded-2xl bg-[#15101C]/70 border border-[#653C87]/40 hover:border-[#9A79BA] text-left transition flex flex-col justify-between"
          >
            <div>
              <span className="text-[10px] text-[#7D7E92] uppercase font-bold block">1 Month</span>
              <span className="text-base font-bold text-[#E6D7FA]">$14.99</span>
            </div>
            <span className="text-[9px] text-[#9A79BA] mt-2 block">Billed monthly</span>
          </button>

          <button
            onClick={() => onSelectPlan?.('quarterly')}
            className="relative p-3 rounded-2xl bg-gradient-to-b from-[#241E2F] to-[#15101C] border-2 border-[#9A79BA] text-left transition shadow-md flex flex-col justify-between"
          >
            <span className="absolute -top-2.5 right-2 px-1.5 py-0.5 rounded-full bg-[#9A79BA] text-[#15101C] font-extrabold text-[8px] uppercase tracking-wider">
              Best Value
            </span>
            <div>
              <span className="text-[10px] text-[#9A79BA] uppercase font-bold block">3 Months</span>
              <span className="text-base font-bold text-[#E6D7FA]">$9.99<span className="text-[10px] font-normal text-[#7D7E92]">/mo</span></span>
            </div>
            <span className="text-[9px] text-emerald-400 font-medium mt-2 block">Save 33%</span>
          </button>
        </div>

        <button
          onClick={() => onSelectPlan?.('quarterly')}
          className="w-full py-3 rounded-full bg-gradient-to-r from-[#653C87] to-[#9A79BA] text-[#15101C] font-extrabold text-xs shadow-xl hover:opacity-95 transition flex items-center justify-center gap-1.5"
        >
          <Zap className="w-4 h-4 fill-current" />
          Continue with AIL Club
        </button>
      </div>
    </div>
  );
}