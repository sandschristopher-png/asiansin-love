'use client';

import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { ShieldCheck, AlertTriangle, CheckCircle2, X } from 'lucide-react';

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
      className="fixed inset-0 z-[9999] flex items-end justify-center bg-black/60 backdrop-blur-xs transition-opacity"
      onClick={onClose}
    >
      {/* Mobile Drawer (Constrained to the app's max-w-md column) */}
      <div
        className="w-full max-w-md bg-white border-t border-stone-200/80 rounded-t-[2rem] p-5 shadow-2xl flex flex-col gap-3 animate-in slide-in-from-bottom duration-200 text-stone-900 max-h-[85vh] overflow-y-auto pb-[max(1.25rem,env(safe-area-inset-bottom))]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Pull Handle */}
        <div className="w-10 h-1 bg-stone-200 rounded-full mx-auto -mt-1 mb-1 shrink-0" />

        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-[#F3EFFC] border border-[#DDD7E5] flex items-center justify-center text-[#6555B8] shrink-0">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-stone-900 leading-tight">Community Trust & Reputation</h3>
              <p className="text-[11px] text-stone-500">Transparent standards for intentional courtship</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-full text-stone-400 hover:text-stone-700 hover:bg-stone-100 transition cursor-pointer"
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Current Standing Card */}
        <div className="p-3 rounded-xl bg-[#FAF9FD] border border-[#ECE6F7] flex items-center justify-between">
          <div className="space-y-0.5">
            <span className="text-[9px] font-bold uppercase tracking-wider text-[#6555B8]">Current Standing</span>
            <p className="text-xs text-stone-700 font-medium">
              {score >= 90 ? 'Unblemished: Exemplary standing' : 'Good standing: Active member'}
            </p>
          </div>
          <div className="flex items-baseline gap-1 bg-white px-2.5 py-1 rounded-lg border border-[#DDD7E5]">
            <span className="text-xl font-bold text-[#6555B8]">{score}</span>
            <span className="text-[10px] font-semibold text-stone-400">/100</span>
          </div>
        </div>

        {/* Trust Standards */}
        <div className="space-y-2 text-xs text-stone-600">
          <div>
            <h4 className="font-semibold text-stone-900 text-xs mb-0.5 flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
              Starting with 100 Baseline Trust
            </h4>
            <p className="text-[11px] leading-relaxed text-stone-500">
              Every verified member starts with full standing. Trust is maintained through sincere intent, courtesy, and authentic interactions.
            </p>
          </div>

          <div className="p-3 rounded-xl bg-amber-50/80 border border-amber-200/80 space-y-1.5">
            <h4 className="font-semibold text-amber-950 text-xs flex items-center gap-1.5">
              <AlertTriangle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
              What Drops Your Standing
            </h4>
            <ul className="space-y-1 text-[11px] text-stone-700 list-disc list-inside">
              <li><strong>Financial solicitation:</strong> Asking for money or transfers (GCash, Maya, PromptPay, ABA).</li>
              <li><strong>Commercial solicitation:</strong> Asking or offering escort rates or bar fines.</li>
              <li><strong>Inappropriate pressure:</strong> Soliciting nudes, explicit media, or vulgar remarks.</li>
              <li><strong>Off-platform funneling:</strong> Pushing for Telegram/WhatsApp prematurely.</li>
            </ul>
          </div>

          <p className="text-[10px] text-stone-400 leading-tight">
            Severe violations result in automated shadowbanning or permanent platform ejection.
          </p>
        </div>

        {/* Full-Width Mobile Action Button */}
        <div className="pt-1 border-t border-stone-100">
          <button
            type="button"
            onClick={onClose}
            className="w-full py-2.5 rounded-full bg-[#6555B8] hover:bg-[#52449E] text-white text-xs font-semibold transition text-center cursor-pointer shadow-xs active:scale-[0.98]"
          >
            Understood
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}