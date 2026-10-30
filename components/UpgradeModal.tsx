'use client';

import React, { useState } from 'react';
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

  const handleCheckout = async (planId: string = 'monthly') => {
    if (onSelectPlan) {
      onSelectPlan(planId);
      return;
    }

    try {
      setIsRedirecting(true);
      const res = await fetch('/api/plus/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ planId }),
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

        {/* Pricing Summary */}
        <div className="rounded-2xl border border-[#6555B8]/30 bg-[#F3EFFC]/40 p-3 flex items-center justify-between mb-4">
          <div className="text-left">
            <p className="text-xs font-bold text-neutral-900">Full Access Plan</p>
            <p className="text-[10px] text-neutral-500">Cancel anytime in one click</p>
          </div>
          <div className="text-right">
            <span className="text-lg font-bold text-neutral-900">$14.99</span>
            <span className="text-[11px] text-neutral-500">/mo</span>
          </div>
        </div>

        {/* Primary CTA Button */}
        <button
          onClick={() => handleCheckout('monthly')}
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
              <span>Continue to Checkout</span>
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