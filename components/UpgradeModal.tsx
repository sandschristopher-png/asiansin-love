'use client';

import React, { useState } from 'react';
import { usePathname } from 'next/navigation';
import { X, Infinity, Compass, TrendingUp, Lock, ArrowRight, Loader2 } from 'lucide-react';

interface UpgradeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectPlan?: (planId: string) => void;
  triggerContext?: 'chat' | 'passport' | 'handle' | 'general';
}

export default function UpgradeModal({
  isOpen,
  onClose,
  onSelectPlan,
  triggerContext = 'general',
}: UpgradeModalProps) {
  const pathname = usePathname();
  const [isRedirecting, setIsRedirecting] = useState(false);

  if (!isOpen) return null;

  const getContextHeadline = () => {
    switch (triggerContext) {
      case 'chat':
        return 'Unlimited Direct Introductions';
      case 'passport':
        return 'Passport & Global Search';
      case 'handle':
        return 'Custom Member Handle';
      default:
        return 'Connect Without Limits';
    }
  };

  const getContextSubtitle = () => {
    switch (triggerContext) {
      case 'chat':
        return 'Start direct conversations with new members without daily intro limits or waiting timers.';
      case 'passport':
        return 'Explore and match with sincere singles in Tokyo, Manila, Bangkok, or Cebu before your trip.';
      case 'handle':
        return 'Claim and update your distinctive personal username anytime.';
      default:
        return 'Designed for members seeking thoughtful, authentic connections.';
    }
  };

  const [selectedTier, setSelectedTier] = useState<'12m' | '3m' | '1m'>('12m');

  const handleCheckout = async (planId: string = '1m') => {
    if (onSelectPlan) {
      onSelectPlan(planId);
      return;
    }

    try {
      setIsRedirecting(true);
      const res = await fetch('/api/plus/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ planId, returnPath: pathname || '/plus' }),
      });
      const data = await res.json();
      if (data?.url) {
        window.location.assign(data.url);
      } else {
        window.location.assign('/plus');
      }
    } catch {
      window.location.assign('/plus');
    } finally {
      setIsRedirecting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[250] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-[360px] bg-white/95 backdrop-blur-sm rounded-3xl border border-neutral-100 shadow-2xl p-5 text-[#1C1924] animate-in zoom-in-95 duration-150 flex flex-col no-scrollbar"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Dismiss Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-20 w-8 h-8 rounded-full bg-neutral-100/90 hover:bg-neutral-200 text-neutral-400 hover:text-neutral-700 flex items-center justify-center transition active:scale-95 cursor-pointer"
          aria-label="Close"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Brand Banner Artwork */}
        <div className="w-full h-32 rounded-2xl bg-[#FAF9FD] border border-[#ECE6F7] flex items-center justify-center p-3 mb-3">
          <img
            src="/ail-plus.png"
            alt="AIL Plus"
            className="w-full h-full object-contain"
          />
        </div>

        {/* Title & Context */}
        <div className="text-center space-y-1 mb-4">
          <span className="inline-block px-2.5 py-0.5 rounded-full bg-[#F3EFFC] text-[#6555B8] text-[10px] font-bold tracking-widest uppercase">
            AIL PLUS
          </span>
          <h2 className="text-base font-bold text-neutral-900 tracking-tight">
            {getContextHeadline()}
          </h2>
          <p className="text-[11px] text-neutral-500 leading-relaxed max-w-[280px] mx-auto">
            {getContextSubtitle()}
          </p>
        </div>

        {/* Feature List */}
        <div className="space-y-2 mb-4">
          <div className="flex items-center gap-3 p-2.5 rounded-xl bg-[#FAF9FD] border border-[#ECE6F7]/80 text-left">
            <div className="w-7 h-7 rounded-lg bg-white border border-[#DDD7E5] text-[#6555B8] flex items-center justify-center shrink-0 shadow-2xs">
              <Infinity className="w-4 h-4" />
            </div>
            <div>
              <p className="text-xs font-semibold text-neutral-900">Unlimited Introductions</p>
              <p className="text-[10px] text-neutral-500 leading-none mt-0.5">Zero 5-intro caps or chat cooldowns</p>
            </div>
          </div>

          <div className="flex items-center gap-3 p-2.5 rounded-xl bg-[#FAF9FD] border border-[#ECE6F7]/80 text-left">
            <div className="w-7 h-7 rounded-lg bg-white border border-[#DDD7E5] text-[#6555B8] flex items-center justify-center shrink-0 shadow-2xs">
              <Compass className="w-4 h-4" />
            </div>
            <div>
              <p className="text-xs font-semibold text-neutral-900">Passport Travel Mode</p>
              <p className="text-[10px] text-neutral-500 leading-none mt-0.5">Teleport and match in any city worldwide</p>
            </div>
          </div>

          <div className="flex items-center gap-3 p-2.5 rounded-xl bg-[#FAF9FD] border border-[#ECE6F7]/80 text-left">
            <div className="w-7 h-7 rounded-lg bg-white border border-[#DDD7E5] text-[#6555B8] flex items-center justify-center shrink-0 shadow-2xs">
              <TrendingUp className="w-4 h-4" />
            </div>
            <div>
              <p className="text-xs font-semibold text-neutral-900">Priority Feed Placement</p>
              <p className="text-[10px] text-neutral-500 leading-none mt-0.5">Be seen first in daily member recommendations</p>
            </div>
          </div>
        </div>

        {/* Tier Selector */}
          <div className="grid grid-cols-3 gap-1.5 mb-3 text-left">
            {/* 12 Months */}
            <button
              type="button"
              onClick={() => setSelectedTier('12m')}
              className={`relative rounded-xl p-2 text-left border transition cursor-pointer flex flex-col justify-between ${
                selectedTier === '12m'
                  ? 'border-[#6555B8] bg-[#F3EFFC]/80 ring-1 ring-[#6555B8] shadow-xs'
                  : 'border-[#ECE6F7] bg-[#FAF9FD] hover:border-[#DDD7E5]'
              }`}
            >
              <span className="absolute -top-2 left-1/2 -translate-x-1/2 bg-[#6555B8] text-white text-[8px] font-bold px-1.5 py-0.5 rounded-full uppercase tracking-wider whitespace-nowrap">
                Save 47%
              </span>
              <div className="pt-0.5">
                <div className="text-[10px] font-bold text-[#1C1924]">12 Mo</div>
                <div className="text-[9px] text-[#6555B8] font-semibold">Best Value</div>
              </div>
              <div className="mt-1 pt-1 border-t border-[#ECE6F7]/80">
                <div className="text-xs font-bold text-[#1C1924]">$7.99<span className="text-[9px] font-normal text-[#6C637B]">/mo</span></div>
              </div>
            </button>



            {/* 1 Month */}
            <button
              type="button"
              onClick={() => setSelectedTier('1m')}
              className={`relative rounded-xl p-2 text-left border transition cursor-pointer flex flex-col justify-between ${
                selectedTier === '1m'
                  ? 'border-[#6555B8] bg-[#F3EFFC]/80 ring-1 ring-[#6555B8] shadow-xs'
                  : 'border-[#ECE6F7] bg-[#FAF9FD] hover:border-[#DDD7E5]'
              }`}
            >
              <div className="pt-0.5">
                <div className="text-[10px] font-bold text-[#1C1924]">1 Mo</div>
                <div className="text-[9px] text-[#8A8199]">Standard</div>
              </div>
              <div className="mt-1 pt-1 border-t border-[#ECE6F7]/80">
                <div className="text-xs font-bold text-[#1C1924]">$14.99<span className="text-[9px] font-normal text-[#6C637B]">/mo</span></div>
              </div>
            </button>
          </div>

          {/* Primary CTA Button */}
          <button
            onClick={() => handleCheckout(selectedTier)}
            disabled={isRedirecting}
            className="w-full py-3 rounded-2xl bg-[#6555B8] hover:bg-[#5747A9] active:bg-[#4C3D97] disabled:opacity-75 disabled:cursor-not-allowed text-white font-semibold text-xs tracking-wider uppercase shadow-md shadow-[#6555B8]/20 transition active:scale-[0.99] flex items-center justify-center gap-2 cursor-pointer mb-2"
          >
            {isRedirecting ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Preparing Checkout...</span>
              </>
            ) : (
              <>
                <span>
                  Upgrade to AIL+ • {selectedTier === '12m' ? '$7.99/mo' : '$14.99/mo'}
                </span>
                <ArrowRight className="w-3.5 h-3.5" />
              </>
            )}
          </button>

          {/* Secondary Dismiss */}
        <button
          type="button"
          onClick={onClose}
          className="text-[11px] font-medium text-neutral-400 hover:text-neutral-600 transition py-1 text-center cursor-pointer"
        >
          Maybe later
        </button>

        {/* Trust Footnote */}
        <div className="flex items-center justify-center gap-1 text-[10px] text-neutral-400 pt-1">
          <Lock className="w-3 h-3 text-neutral-400" />
          <span>Encrypted checkout via Stripe</span>
        </div>
      </div>
    </div>
  );
}