'use client';

import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { ShieldCheck, AlertTriangle, CheckCircle2, X } from 'lucide-react';
import { ReputationBadge } from '@/components/ReputationBadge';

interface ReputationModalProps {
  isOpen: boolean;
  onClose: () => void;
  name?: string;
  score?: number;
}

export default function ReputationModal({
  isOpen,
  onClose,
  name = 'You',
  score = 100,
}: ReputationModalProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Lock background scroll when open
  useEffect(() => {
    if (isOpen) {
      const originalStyle = window.getComputedStyle(document.body).overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = originalStyle;
      };
    }
  }, [isOpen]);

  if (!isOpen || !mounted) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[9999] flex items-end justify-center bg-black/60 backdrop-blur-xs transition-opacity duration-200"
      onClick={onClose}
    >
      {/* Mobile Drawer (Constrained to the app's max-w-md column) */}
      <div
        className="w-full max-w-md bg-white border-t border-[#D0CDE1] rounded-t-[2rem] p-5 shadow-2xl flex flex-col gap-3 animate-in slide-in-from-bottom duration-200 text-[#413B5E] max-h-[85vh] overflow-y-auto pb-[max(1.25rem,env(safe-area-inset-bottom))]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Pull Handle */}
        <div className="w-10 h-1 bg-[#E8E6F1] rounded-full mx-auto -mt-1 mb-1 shrink-0" />

        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-[#E8E6F1]/60 border border-[#D0CDE1] flex items-center justify-center text-[#665D96] shrink-0">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-[#413B5E] leading-tight">Community Trust & Reputation</h3>
              <p className="text-[11px] text-[#413B5E]/55">Transparent standards for intentional dating</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-full text-[#413B5E]/55 hover:text-[#413B5E]/85 hover:bg-[#E8E6F1]/60 transition cursor-pointer"
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Current Standing Card */}
        <div className="p-3 rounded-xl bg-white border border-[#D0CDE1] flex items-center justify-between">
          <div className="space-y-0.5">
            <span className="text-[9px] font-bold uppercase tracking-wider text-[#665D96]">Current Standing</span>
            <p className="text-xs text-[#413B5E]/85 font-medium">
              {score >= 90 ? 'Unblemished: Exemplary standing' : 'Good standing: Active member'}
            </p>
          </div>
          <ReputationBadge score={score} size="md" />
        </div>

        {/* Trust Standards */}
        <div className="space-y-2 text-xs text-[#413B5E]/80">
          <div>
            <h4 className="font-semibold text-[#413B5E] text-xs mb-0.5 flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
              Starting with 100 Baseline Trust
            </h4>
            <p className="text-[11px] leading-relaxed text-[#413B5E]/55">
              Every verified member starts with full standing. Trust is maintained through sincere intent, courtesy, and authentic interactions.
            </p>
          </div>

          <div className="p-3 rounded-xl bg-amber-50/80 border border-amber-200/80 space-y-1.5">
            <h4 className="font-semibold text-amber-950 text-xs flex items-center gap-1.5">
              <AlertTriangle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
              What Drops Your Standing
            </h4>
            <ul className="space-y-1 text-[11px] text-[#413B5E]/85 list-disc list-inside">
              <li><strong>Financial solicitation:</strong> Asking for money or transfers (GCash, Maya, PromptPay, ABA).</li>
              <li><strong>Commercial solicitation:</strong> Asking or offering escort rates or bar fines.</li>
              <li><strong>Inappropriate pressure:</strong> Soliciting nudes, explicit media, or vulgar remarks.</li>
              <li><strong>Off-platform funneling:</strong> Pushing for Telegram/WhatsApp prematurely.</li>
            </ul>
          </div>

          <p className="text-[10px] text-[#413B5E]/55 leading-tight">
            Severe violations result in automated shadowbanning or permanent platform ejection.
          </p>
        </div>

        {/* Full-Width Mobile Action Button */}
        <div className="pt-1 border-t border-[#D0CDE1]/60">
          <button
            type="button"
            onClick={onClose}
            className="w-full py-2.5 rounded-full bg-[#665D96] hover:bg-[#413B5E] text-white text-xs font-semibold transition text-center cursor-pointer shadow-xs active:scale-[0.98]"
          >
            Understood
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}