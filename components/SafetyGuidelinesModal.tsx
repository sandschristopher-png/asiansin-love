'use client';

import React from 'react';

interface SafetyGuidelinesModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAcknowledge: () => void;
}

export function SafetyGuidelinesModal({ isOpen, onClose, onAcknowledge }: SafetyGuidelinesModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md">
      <div className="relative w-full max-w-lg rounded-3xl bg-[#241e2f] border border-[#725A7A]/30 p-6 sm:p-8 shadow-2xl text-[#E6D7FA]">
        
        {/* Header */}
        <div className="mb-6">
          <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-[#B8AAC3] block mb-1">
            Community Standards
          </span>
          <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
            Mutual Respect & Safety Charter
          </h2>
          <p className="text-xs text-[#A8A2AB] mt-1.5 leading-relaxed">
            asiansin.love is built strictly for genuine long-term relationships. Before connecting, please review our core community pledges:
          </p>
        </div>

        {/* Standards Stack */}
        <div className="space-y-3 mb-6">
          <div className="p-3.5 rounded-2xl bg-[#1d1827] border border-[#725A7A]/20 flex gap-3">
            <span className="text-xs font-mono font-bold text-[#9A79BA] shrink-0">01</span>
            <div>
              <h4 className="text-xs font-semibold text-white">Genuine Courtship Only</h4>
              <p className="text-[11px] text-[#A8A2AB] mt-0.5 leading-relaxed">
                Asking for or offering allowances, emergency funds, GCash, or gifts is strictly prohibited.
              </p>
            </div>
          </div>

          <div className="p-3.5 rounded-2xl bg-[#1d1827] border border-[#725A7A]/20 flex gap-3">
            <span className="text-xs font-mono font-bold text-[#9A79BA] shrink-0">02</span>
            <div>
              <h4 className="text-xs font-semibold text-white">Public Daylight First Meetings</h4>
              <p className="text-[11px] text-[#A8A2AB] mt-0.5 leading-relaxed">
                When meeting in person, always choose well-lit public venues (cafes, restaurants) during daylight hours.
              </p>
            </div>
          </div>

          <div className="p-3.5 rounded-2xl bg-[#1d1827] border border-[#725A7A]/20 flex gap-3">
            <span className="text-xs font-mono font-bold text-[#9A79BA] shrink-0">03</span>
            <div>
              <h4 className="text-xs font-semibold text-white">Mutual Dignity & Respect</h4>
              <p className="text-[11px] text-[#A8A2AB] mt-0.5 leading-relaxed">
                Explicit messages, harassment, deceit about marital status, or transactional demands lead to immediate account removal.
              </p>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row items-center gap-2.5">
          <button
            onClick={onAcknowledge}
            className="w-full py-3 rounded-xl bg-[#653C87] hover:bg-[#7a49a2] text-[#F3EBF9] font-semibold text-xs transition-all shadow-lg shadow-[#41384E]/50 active:scale-[0.99]"
          >
            I Agree & Pledge Respect
          </button>
          <button
            onClick={onClose}
            className="w-full sm:w-auto px-5 py-3 rounded-xl bg-[#1d1827] hover:bg-[#282136] text-[#A8A2AB] text-xs font-medium transition-colors"
          >
            Cancel
          </button>
        </div>

      </div>
    </div>
  );
}
