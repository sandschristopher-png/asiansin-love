'use client';

import React from 'react';
import Link from 'next/link';

interface AccountSheetProps {
  isOpen: boolean;
  onClose: () => void;
}

export function AccountSheet({ isOpen, onClose }: AccountSheetProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/80 backdrop-blur-sm transition-opacity duration-300">
      <div
        className="w-full max-w-md bg-[#17131F] border-t sm:border border-[#725A7A]/35 rounded-t-3xl sm:rounded-3xl p-6 pb-[max(1.5rem,env(safe-area-inset-bottom))] shadow-2xl space-y-5 sheet-slide-up"
        onClick={(e) => e.stopPropagation()}
      >
        
        {/* Drag Handle & Header */}
        <div className="flex flex-col items-center gap-2">
          <div className="w-12 h-1.5 rounded-full bg-[#725A7A]/50" />
          <div className="w-full flex items-center justify-between pt-2">
            <div>
              <h3 className="text-lg font-black text-white">Account Settings</h3>
              <p className="text-xs text-[#DDD8D4]">Manage identity, security & preferences</p>
            </div>
            <button
              onClick={onClose}
              className="h-8 w-8 rounded-full bg-[#241E2F] border border-[#725A7A]/35 text-white text-xs font-bold flex items-center justify-center touch-press"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Verification Status Card */}
        <div className="rounded-2xl bg-gradient-to-r from-[#241E2F] to-[#2B2338] border border-[#653C87]/60 p-4 flex items-center justify-between">
          <div className="space-y-0.5">
            <span className="text-[10px] font-black uppercase tracking-wider text-amber-300 flex items-center gap-1">
              🛡️ Unverified
            </span>
            <p className="text-xs text-[#DDD8D4]">Earn the verified badge with a quick selfie pose.</p>
          </div>
          <Link
            href="/verify"
            onClick={onClose}
            className="px-3.5 py-2 rounded-xl bg-[#653C87] text-white text-xs font-extrabold shadow-md touch-press"
          >
            Verify
          </Link>
        </div>

        {/* Navigation Options */}
        <div className="space-y-1.5 font-bold text-sm">
          <Link
            href="/profile"
            onClick={onClose}
            className="p-3.5 rounded-2xl bg-[#241E2F] border border-[#725A7A]/25 text-white flex items-center justify-between touch-press"
          >
            <span>Edit Profile & Photos</span>
            <span className="text-[#B8AAC3]">→</span>
          </Link>

          <Link
            href="/favorites"
            onClick={onClose}
            className="p-3.5 rounded-2xl bg-[#241E2F] border border-[#725A7A]/25 text-white flex items-center justify-between touch-press"
          >
            <span>Saved Profiles</span>
            <span className="text-[#B8AAC3]">→</span>
          </Link>

          <Link
            href="/standards"
            onClick={onClose}
            className="p-3.5 rounded-2xl bg-[#241E2F] border border-[#725A7A]/25 text-[#DDD8D4] hover:text-white flex items-center justify-between touch-press"
          >
            <span>Community Standards</span>
            <span className="text-[#B8AAC3]">→</span>
          </Link>
        </div>

        {/* Auth Action */}
        <div className="pt-2 border-t border-[#725A7A]/25">
          <Link
            href="/login"
            onClick={onClose}
            className="w-full py-3.5 rounded-2xl bg-[#17131F] border border-[#725A7A]/40 text-[#DDD8D4] hover:text-white text-xs font-extrabold block text-center touch-press"
          >
            Sign Out / Switch Account
          </Link>
        </div>

      </div>

      <div className="fixed inset-0 -z-10" onClick={onClose} />
    </div>
  );
}