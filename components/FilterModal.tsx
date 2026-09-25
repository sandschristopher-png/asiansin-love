'use client';

import React from 'react';

interface FilterModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedRegion: string;
  onSelectRegion: (region: string) => void;
  verifiedOnly: boolean;
  onToggleVerified: () => void;
}

const REGIONS = ['All', 'Philippines', 'Thailand', 'Cambodia', 'Laos'];

export function FilterModal({
  isOpen,
  onClose,
  selectedRegion,
  onSelectRegion,
  verifiedOnly,
  onToggleVerified,
}: FilterModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/75 backdrop-blur-sm transition-opacity duration-300">
      <div className="w-full max-w-md h-full bg-[#17131F] border-l border-[#725A7A]/30 flex flex-col justify-between p-6 shadow-2xl overflow-y-auto sheet-slide-right">
        
        {/* Header */}
        <div className="space-y-6">
          <div className="flex items-center justify-between border-b border-[#725A7A]/30 pb-4 pt-[max(0.5rem,env(safe-area-inset-top))]">
            <div>
              <h2 className="text-xl font-extrabold text-white tracking-tight">
                Search Settings
              </h2>
              <span className="text-[11px] text-[#DDD8D4] font-medium">Fine-tune your courtship discovery</span>
            </div>
            <button
              onClick={onClose}
              className="h-9 w-9 rounded-xl bg-[#241E2F] border border-[#725A7A]/35 text-white font-black text-sm flex items-center justify-center touch-press"
            >
              ✕
            </button>
          </div>

          {/* Region / Country */}
          <div>
            <label className="text-xs font-black uppercase tracking-wider text-[#B8AAC3] block mb-2.5">
              Target Country
            </label>
            <div className="grid grid-cols-2 gap-2">
              {REGIONS.map((region) => {
                const active = selectedRegion === region;
                return (
                  <button
                    key={region}
                    onClick={() => onSelectRegion(region)}
                    className={`py-3 px-3 rounded-xl text-xs font-bold transition-all border text-center touch-press ${
                      active
                        ? 'bg-[#653C87] border-[#978FA8] text-white shadow-md'
                        : 'bg-[#241E2F] border-[#725A7A]/30 text-[#DDD8D4] hover:text-white'
                    }`}
                  >
                    {region}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Verified Members Only Switch */}
          <div className="rounded-2xl bg-[#241E2F] border border-[#725A7A]/35 p-4 flex items-center justify-between">
            <div className="pr-4">
              <span className="text-sm font-extrabold text-white block">
                Verified Profiles Only
              </span>
              <span className="text-xs text-[#DDD8D4] leading-relaxed">
                Exclude unverified and pending submissions
              </span>
            </div>
            <button
              type="button"
              onClick={onToggleVerified}
              className={`w-12 h-6 rounded-full transition-colors relative flex-shrink-0 touch-press ${
                verifiedOnly ? 'bg-[#653C87]' : 'bg-[#17131F]'
              }`}
            >
              <span
                className={`absolute top-0.5 h-5 w-5 rounded-full bg-white transition-transform ${
                  verifiedOnly ? 'left-6.5' : 'left-0.5'
                }`}
              />
            </button>
          </div>

          {/* Age Bracket */}
          <div className="rounded-2xl bg-[#241E2F] border border-[#725A7A]/35 p-4 space-y-2">
            <div className="flex justify-between text-xs font-bold">
              <span className="text-[#B8AAC3] uppercase tracking-wider">Age Bracket</span>
              <span className="text-white">20 – 45+</span>
            </div>
            <div className="h-2 w-full bg-[#17131F] rounded-full overflow-hidden">
              <div className="h-full bg-[#653C87] w-3/4 rounded-full" />
            </div>
          </div>
        </div>

        {/* Bottom Apply Action */}
        <div className="pt-6 border-t border-[#725A7A]/30 pb-[max(1rem,env(safe-area-inset-bottom))]">
          <button
            onClick={onClose}
            className="w-full py-4 rounded-2xl bg-[#653C87] hover:bg-[#7A49A2] text-white font-extrabold text-sm shadow-xl shadow-[#653C87]/40 touch-press"
          >
            Apply Settings
          </button>
        </div>

      </div>
    </div>
  );
}