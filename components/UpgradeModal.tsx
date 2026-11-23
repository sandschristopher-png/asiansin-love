'use client';

import Link from 'next/link';
import { IceFrame, IceNotice } from '@/components/ui/IceFrame';
import { usePlayBilling } from '@/lib/usePlayBilling';
import React, { useState } from 'react';
import { useLocale } from '@/components/i18n/LocaleProvider';
import { AmbientAurora } from '@/components/ui/AmbientAurora';
import { PlusBadge } from '@/components/ui/PlusBadge';
import { X, Infinity, Compass, TrendingUp, Zap } from 'lucide-react';

interface UpgradeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectPlan?: (planId: string) => void;
  triggerContext?: 'chat' | 'passport' | 'handle' | 'general';
}

export default function UpgradeModal({
  isOpen,
  onClose,
  triggerContext = 'general',
}: UpgradeModalProps) {
  const { t } = useLocale();
  // Web: "Upgrade in the Meet in Asia Android app" (no payment prompt). App: Google Play Billing, prices from Google Play.
  // Once Plus is active the page reloads so every screen reads the new plan.
  const billing = usePlayBilling(() => {
    window.setTimeout(() => window.location.reload(), 1200);
  });
  const native = billing.native;

  // Hooks first: an early return above a hook breaks the rules of hooks.
  const [selectedTier, setSelectedTier] = useState<'6m' | '3m' | '1m'>('6m');

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
        return 'Explore and match with sincere singles in Manila, Bangkok, Cebu, or Phnom Penh before your trip.';
      case 'handle':
        return 'Claim and update your distinctive personal username anytime.';
      default:
        return 'Designed for members seeking thoughtful, authentic connections.';
    }
  };

  return (
    <div
      className="fixed inset-0 z-[250] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-in fade-in duration-150"
      onClick={onClose}
    >
      <IceFrame
        radius="1.5rem"
        className="w-full max-w-[360px] shadow-2xl animate-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
      <div className="relative isolate overflow-hidden w-full bg-white rounded-3xl border border-[#D0CDE1]/60 p-5 text-[#413B5E] flex flex-col no-scrollbar">
        <AmbientAurora layer="card" />
        {/* Dismiss Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-20 w-8 h-8 rounded-full bg-[#EAE9F2]/60 hover:bg-[#EAE9F2] text-slate-600 hover:text-[#413B5E]/85 flex items-center justify-center transition active:scale-95 cursor-pointer"
          aria-label="Close"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Brand mark: Lucide icon in a soft squircle (no illustrations) */}
        <div className="w-14 h-14 rounded-2xl bg-[#726E97]/10 flex items-center justify-center text-[#726E97] mx-auto mt-2 mb-3">
          <Zap className="w-6 h-6 fill-current" strokeWidth={1.75} />
        </div>

        {/* Title & Context */}
        <div className="text-center space-y-1 mb-4">
          <PlusBadge />
          <h2 className="text-base font-semibold text-[#413B5E] tracking-tight">
            {getContextHeadline()}
          </h2>
          <p className="text-[11px] text-slate-600 leading-relaxed max-w-[280px] mx-auto">
            {getContextSubtitle()}
          </p>
        </div>

        {/* Feature List */}
        <div className="space-y-2 mb-4">
          <div className="flex items-center gap-3 p-2.5 rounded-xl bg-white border border-[#D0CDE1] text-left">
            <div className="w-7 h-7 rounded-lg bg-white border border-[#D0CDE1] text-[#726E97] flex items-center justify-center shrink-0 shadow-2xs">
              <Infinity className="w-4 h-4" />
            </div>
            <div>
              <p className="text-xs font-semibold text-[#413B5E]">Unlimited Introductions</p>
              <p className="text-[10px] text-slate-600 leading-none mt-0.5">Zero 5-intro caps or chat cooldowns</p>
            </div>
          </div>

          <div className="flex items-center gap-3 p-2.5 rounded-xl bg-white border border-[#D0CDE1] text-left">
            <div className="w-7 h-7 rounded-lg bg-white border border-[#D0CDE1] text-[#726E97] flex items-center justify-center shrink-0 shadow-2xs">
              <Compass className="w-4 h-4" />
            </div>
            <div>
              <p className="text-xs font-semibold text-[#413B5E]">Passport Travel Mode</p>
              <p className="text-[10px] text-slate-600 leading-none mt-0.5">Teleport and match in any city worldwide</p>
            </div>
          </div>

          <div className="flex items-center gap-3 p-2.5 rounded-xl bg-white border border-[#D0CDE1] text-left">
            <div className="w-7 h-7 rounded-lg bg-white border border-[#D0CDE1] text-[#726E97] flex items-center justify-center shrink-0 shadow-2xs">
              <TrendingUp className="w-4 h-4" />
            </div>
            <div>
              <p className="text-xs font-semibold text-[#413B5E]">Priority Feed Placement</p>
              <p className="text-[10px] text-slate-600 leading-none mt-0.5">Be seen first in daily member recommendations</p>
            </div>
          </div>
        </div>

        {/* Tier Selector */}
          <div className="grid grid-cols-2 gap-2 mb-3 text-left">
            {/* 6 Months */}
            <button
              type="button"
              onClick={() => setSelectedTier('6m')}
              className={`relative rounded-xl p-2 text-left border transition cursor-pointer flex flex-col justify-between ${
                selectedTier === '6m'
                  ? 'border-[#726E97] bg-[#EAE9F2]/50 ring-1 ring-[#726E97] shadow-xs'
                  : 'border-[#D0CDE1] bg-white hover:border-[#D0CDE1]'
              }`}
            >
              <span className="absolute -top-2 left-1/2 -translate-x-1/2 bg-[#726E97] text-white text-[8px] font-semibold px-1.5 py-0.5 rounded-full uppercase tracking-wider whitespace-nowrap">
                Save 47%
              </span>
              <div className="pt-0.5">
                <div className="text-[10px] font-semibold text-[#413B5E]">6 Mo</div>
                <div className="text-[9px] text-[#726E97] font-semibold">Best Value</div>
              </div>
              <div className="mt-1 pt-1 border-t border-[#D0CDE1]">
                <div className="text-xs font-semibold text-[#413B5E]">{billing.offerings['6m']?.perMonth ?? '$7.99'}<span className="text-[9px] font-normal text-[#413B5E]/75">/mo</span></div>
              </div>
            </button>



            {/* 1 Month */}
            <button
              type="button"
              onClick={() => setSelectedTier('1m')}
              className={`relative rounded-xl p-2 text-left border transition cursor-pointer flex flex-col justify-between ${
                selectedTier === '1m'
                  ? 'border-[#726E97] bg-[#EAE9F2]/50 ring-1 ring-[#726E97] shadow-xs'
                  : 'border-[#D0CDE1] bg-white hover:border-[#D0CDE1]'
              }`}
            >
              <div className="pt-0.5">
                <div className="text-[10px] font-semibold text-[#413B5E]">1 Mo</div>
                <div className="text-[9px] text-slate-600">Standard</div>
              </div>
              <div className="mt-1 pt-1 border-t border-[#D0CDE1]">
                <div className="text-xs font-semibold text-[#413B5E]">{billing.offerings['1m']?.perMonth ?? '$14.99'}<span className="text-[9px] font-normal text-[#413B5E]/75">/mo</span></div>
              </div>
            </button>
          </div>

          {/* No payment prompt on the website; in the app the buy button runs Google Play Billing. */}
          {native ? (
            <>
              <button
                type="button"
                onClick={() => void billing.buy(selectedTier)}
                disabled={!billing.offerings[selectedTier] || billing.busy !== null}
                className="w-full py-3 rounded-2xl bg-[#726E97] hover:bg-[#524E75] text-white font-medium text-xs tracking-wider uppercase transition-colors flex items-center justify-center mb-2 disabled:bg-[#EAE9F2] disabled:text-[#413B5E]/60 disabled:cursor-not-allowed"
              >
                {billing.busy === 'buy' ? t('billing.buying') : t('billing.buy')}
              </button>
              {(billing.notice || billing.unavailable) && (
                <div aria-live="polite">
                  <IceNotice className="mb-1.5">{billing.notice ?? t('billing.unavailable')}</IceNotice>
                </div>
              )}
              <button
                type="button"
                onClick={() => void billing.restore()}
                disabled={billing.busy !== null}
                className="mb-1.5 w-full py-1 text-center text-[11px] font-semibold text-[#726E97] underline underline-offset-4 disabled:opacity-60"
              >
                {billing.busy === 'restore' ? t('billing.restoring') : t('billing.restore')}
              </button>
            </>
          ) : (
            <IceNotice className="mb-1.5">{t('plus.page.androidOnly')}</IceNotice>
          )}
          <p className="mb-2 text-center text-[11px] text-slate-600">
            <Link href="/plus" className="font-semibold text-[#726E97] underline underline-offset-4">
              {t('plus.page.billingTitle')}
            </Link>
          </p>

          {/* Secondary Dismiss */}
        <button
          type="button"
          onClick={onClose}
          className="text-[11px] font-medium text-slate-600 hover:text-[#413B5E]/80 transition py-1 text-center cursor-pointer"
        >
          Maybe later
        </button>

      </div>
      </IceFrame>
    </div>
  );
}