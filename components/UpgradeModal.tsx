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
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#2D2F4C]/85 backdrop-blur-md animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div 
        className="relative w-full max-w-sm max-h-[92dvh] overflow-y-auto rounded-3xl bg-[#2D2F4C] border border-[#6555B8]/70 p-6 shadow-2xl flex flex-col gap-4 text-[#1C1924] animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-[#9A8CC3]/70 hover:text-white p-1 rounded-full transition active:scale-90"
          aria-label="Close"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="flex flex-col items-center text-center gap-1.5 pt-1">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-[#6555B8] to-[#9A8CC3] flex items-center justify-center text-[#2D2F4C] shadow-lg shadow-[#6555B8]/40 mb-1">
            <Sparkles className="w-6 h-6 fill-current" />
          </div>
          <span className="text-[11px] uppercase tracking-widest text-[#B2A4D7] font-medium">
            AIL Club Membership
          </span>
          <h2 className="text-xl font-medium text-white">
            Skip the Wait, Connect Live
          </h2>
          <p className="text-xs text-[#1C1924]/75 leading-relaxed max-w-xs px-1">
            Support authentic cross-border courtship with zero banner ads, unlimited real-time chat, and priority visibility.
          </p>
        </div>

        {/* Benefits Checklist */}
        <div className="flex flex-col gap-2.5 py-2.5 border-y border-[#6555B8]/30 my-0.5">
          <div className="flex items-center gap-2.5 text-xs text-[#1C1924]">
            <div className="p-1 rounded-full bg-[#6555B8]/40 text-emerald-400 shrink-0">
              <Check className="w-3.5 h-3.5" />
            </div>
            <span>Zero cooldown timers — unlimited real-time chat</span>
          </div>

          <div className="flex items-center gap-2.5 text-xs text-[#1C1924]">
            <div className="p-1 rounded-full bg-[#6555B8]/40 text-emerald-400 shrink-0">
              <Check className="w-3.5 h-3.5" />
            </div>
            <span>Priority inbox placement & confirmed read receipts</span>
          </div>

          <div className="flex items-center gap-2.5 text-xs text-[#1C1924]">
            <div className="p-1 rounded-full bg-[#6555B8]/40 text-emerald-400 shrink-0">
              <Check className="w-3.5 h-3.5" />
            </div>
            <span>Custom suitor username handle & verified badge</span>
          </div>

          <div className="flex items-center gap-2.5 text-xs text-[#1C1924]">
            <div className="p-1 rounded-full bg-[#6555B8]/40 text-emerald-400 shrink-0">
              <Check className="w-3.5 h-3.5" />
            </div>
            <span>Cross-border multi-city discovery pinning</span>
          </div>
        </div>

        {/* Single Monthly Plan Card */}
        <div className="rounded-2xl bg-[#2D2F4C]/80 border border-[#9A8CC3]/60 p-4 flex items-center justify-between shadow-inner">
          <div className="space-y-0.5">
            <span className="text-[11px] font-medium uppercase tracking-wider text-[#B2A4D7]">
              Monthly Access
            </span>
            <p className="text-xs font-semibold text-[#1C1924]/80">
              Billed monthly · Cancel anytime
            </p>
          </div>
          <div className="text-right">
            <div className="text-xl font-medium text-white">
              $19.99
              <span className="text-xs font-semibold text-[#9A8CC3] ml-1">/month</span>
            </div>
          </div>
        </div>

        {/* CTA and Dignified Exit */}
        <div className="flex flex-col items-center gap-2.5 pt-1">
          <button
            onClick={() => onSelectPlan?.('monthly')}
            className="w-full py-3.5 rounded-full bg-gradient-to-r from-[#6555B8] to-[#9A8CC3] hover:from-[#7D4B9F] hover:to-[#ac87d1] text-[#1E1F30] font-medium text-xs uppercase tracking-wider shadow-lg shadow-[#6555B8]/40 hover:shadow-[#6555B8]/60 active:scale-[0.98] transition flex items-center justify-center gap-2"
          >
            <Zap className="w-4 h-4 fill-current" />
            Continue with AIL Club
          </button>

          <button
            type="button"
            onClick={onClose}
            className="text-xs font-medium text-[#9A8CC3] hover:text-[#1C1924] transition py-1"
          >
            Not now
          </button>
        </div>
      </div>
    </div>
  );
}

