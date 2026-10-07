'use client';

import React from 'react';
import { X, MessageSquare, Zap, ShieldCheck, Sparkles, Check, Lock } from 'lucide-react';

interface UpgradeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectPlan?: (planId: string) => void;
  triggerContext?: 'chat' | 'handle' | 'general';
}

export default function UpgradeModal({
  isOpen,
  onClose,
  onSelectPlan,
  triggerContext = 'general'
}: UpgradeModalProps) {
  if (!isOpen) return null;

  const getContextHeadline = () => {
    switch (triggerContext) {
      case 'chat':
        return 'Unlock Unlimited Messaging';
      case 'handle':
        return 'Custom Handle Included';
      default:
        return 'Serious Courtship, Unlimited Access';
    }
  };

  const getContextSubtitle = () => {
    switch (triggerContext) {
      case 'chat':
        return 'Connect directly with genuine matches without daily caps or cooldowns.';
      case 'handle':
        return 'Update and personalize your public handle anytime with Plus.';
      default:
        return 'Stand out with verified intent, priority placement, and direct messaging.';
    }
  };

  const handleSelectPlan = (planId: string) => {
    if (onSelectPlan) {
      onSelectPlan(planId);
    } else {
      window.location.assign('/pricing');
    }
  };

  return (
    <div
      className="fixed inset-0 z-[250] flex items-center justify-center p-4 bg-black/65 backdrop-blur-md animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-sm max-h-[92dvh] overflow-y-auto rounded-3xl bg-white border border-neutral-100 shadow-2xl flex flex-col text-[#1C1924] animate-in zoom-in-95 duration-200 no-scrollbar"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Subtle Ambient Background Gradient Accent */}
        <div className="absolute top-0 inset-x-0 h-40 bg-gradient-to-b from-[#F3EFFC]/80 via-[#F3EFFC]/20 to-transparent pointer-events-none" />

        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-3.5 right-3.5 z-20 w-8 h-8 rounded-full bg-white/90 hover:bg-neutral-100 text-neutral-400 hover:text-neutral-700 border border-neutral-200/70 shadow-xs flex items-center justify-center transition active:scale-95"
          aria-label="Close"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Hero Artwork Banner */}
        <div className="relative w-full pt-4 px-4 flex justify-center items-center">
          <div className="relative w-full h-44 sm:h-48 rounded-2xl overflow-hidden bg-white flex items-center justify-center border border-neutral-100 shadow-xs">
            <img
              src="/plus-upgrade.png"
              alt="Asians in Love Plus Upgrade"
              className="w-full h-full object-contain"
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                if (!target.src.endsWith('/plus-upgrade.jpg')) {
                  target.src = '/plus-upgrade.jpg';
                }
              }}
            />
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-5 pt-3 flex flex-col gap-4">
          {/* Header Typography */}
          <div className="text-center space-y-1">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#F3EFFC] text-[#6555B8] text-[10px] font-bold tracking-widest uppercase shadow-xs">
              <Sparkles className="w-3 h-3 fill-current" />
              <span>AIL Plus Membership</span>
            </div>
            <h2 className="text-lg font-bold text-neutral-900 tracking-tight pt-1">
              {getContextHeadline()}
            </h2>
            <p className="text-xs text-neutral-500 leading-relaxed max-w-xs mx-auto">
              {getContextSubtitle()}
            </p>
          </div>

          {/* Feature Grid List */}
          <div className="flex flex-col gap-2.5 bg-[#FAF9FD] rounded-2xl p-3.5 border border-[#ECE6F7]">
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-lg bg-white border border-[#DDD7E5] text-[#6555B8] flex items-center justify-center shrink-0 mt-0.5 shadow-2xs">
                <MessageSquare className="w-3.5 h-3.5" />
              </div>
              <div className="text-left">
                <p className="text-xs font-semibold text-neutral-900">Unlimited Direct Messaging</p>
                <p className="text-[11px] text-neutral-500 leading-tight">Zero message caps or daily waiting timers</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-lg bg-white border border-[#DDD7E5] text-[#6555B8] flex items-center justify-center shrink-0 mt-0.5 shadow-2xs">
                <Zap className="w-3.5 h-3.5 fill-[#6555B8]" />
              </div>
              <div className="text-left">
                <p className="text-xs font-semibold text-neutral-900">Priority Discovery Placement</p>
                <p className="text-[11px] text-neutral-500 leading-tight">Be seen first in daily recommendation stacks</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-lg bg-white border border-[#DDD7E5] text-[#6555B8] flex items-center justify-center shrink-0 mt-0.5 shadow-2xs">
                <ShieldCheck className="w-3.5 h-3.5 text-[#6555B8]" />
              </div>
              <div className="text-left">
                <p className="text-xs font-semibold text-neutral-900">Verified Plus Profile Badge</p>
                <p className="text-[11px] text-neutral-500 leading-tight">Signals genuine identity, high trust, and serious intentions</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-lg bg-white border border-[#DDD7E5] text-[#6555B8] flex items-center justify-center shrink-0 mt-0.5 shadow-2xs">
                <Check className="w-3.5 h-3.5 text-emerald-600 font-bold" />
              </div>
              <div className="text-left">
                <p className="text-xs font-semibold text-neutral-900">Handle Modifications Included</p>
                <p className="text-[11px] text-neutral-500 leading-tight">Update your public handle without restrictions</p>
              </div>
            </div>
          </div>

          {/* Pricing Highlight Card */}
          <div className="rounded-2xl border-2 border-[#6555B8] bg-white p-3.5 flex items-center justify-between shadow-xs">
            <div className="space-y-0.5">
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-bold text-neutral-900">Monthly Membership</span>
                <span className="text-[9px] font-bold uppercase tracking-wider bg-[#6555B8] text-white px-1.5 py-0.5 rounded-full">
                  Full Access
                </span>
              </div>
              <p className="text-[11px] text-neutral-500">Cancel anytime in one click · No commitment</p>
            </div>
            <div className="text-right">
              <div className="text-xl font-bold text-neutral-900 tracking-tight">
                $19.99
                <span className="text-xs font-normal text-neutral-500 ml-0.5">/mo</span>
              </div>
            </div>
          </div>

          {/* CTA & Actions */}
          <div className="flex flex-col gap-2 pt-0.5">
            <button
              onClick={() => handleSelectPlan('monthly')}
              className="w-full py-3.5 rounded-2xl bg-[#6555B8] hover:bg-[#5747A9] active:bg-[#4C3D97] text-white font-semibold text-xs tracking-wider uppercase shadow-md shadow-[#6555B8]/25 transition active:scale-[0.99] flex items-center justify-center gap-2 cursor-pointer"
            >
              <Sparkles className="w-4 h-4 fill-current" />
              Upgrade to Plus Now
            </button>

            <button
              type="button"
              onClick={onClose}
              className="text-xs font-medium text-neutral-400 hover:text-neutral-600 transition py-1 text-center"
            >
              Maybe later
            </button>
          </div>

          {/* Trust Footnote */}
          <div className="flex items-center justify-center gap-1.5 text-[10px] text-neutral-400 pt-0.5">
            <Lock className="w-3 h-3" />
            <span>Secure 256-bit encrypted checkout</span>
          </div>
        </div>
      </div>
    </div>
  );
}
