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
        className="w-full max-w-md bg-[#2D2F4C] border-t sm:border border-[#9A8CC3]/35 rounded-t-3xl sm:rounded-3xl p-6 pb-[max(1.5rem,env(safe-area-inset-bottom))] shadow-2xl space-y-5 sheet-slide-up"
        onClick={(e) => e.stopPropagation()}
      >
        
        {/* Drag Handle & Header */}
        <div className="flex flex-col items-center gap-2">
          <div className="w-12 h-1.5 rounded-full bg-[#9A8CC3]/50" />
          <div className="w-full flex items-center justify-between pt-2">
            <div>
              <h3 className="text-lg font-medium text-white">Account Settings</h3>
              <p className="text-xs text-[#DDD8D4]">Manage identity, security & preferences</p>
            </div>
            <button
              onClick={onClose}
              className="h-8 w-8 rounded-full bg-[#2D2F4C] border border-[#9A8CC3]/35 text-white text-xs font-medium flex items-center justify-center touch-press"
            >
              âœ•
            </button>
          </div>
        </div>

        {/* Verification Status Card */}
        <div className="rounded-2xl bg-gradient-to-r from-[#2D2F4C] to-[#2D2F4C] border border-[#6555B8]/60 p-4 flex items-center justify-between">
          <div className="space-y-0.5">
            <span className="text-[10px] font-medium uppercase tracking-wider text-amber-300 flex items-center gap-1">
              ðŸ›¡ï¸ Unverified
            </span>
            <p className="text-xs text-[#DDD8D4]">Earn the verified badge with a quick selfie pose.</p>
          </div>
          <Link
            href="/verify"
            onClick={onClose}
            className="px-3.5 py-2 rounded-xl bg-[#6555B8] text-white text-xs font-medium shadow-md touch-press"
          >
            Verify
          </Link>
        </div>

        {/* Navigation Options */}
        <div className="space-y-1.5 font-medium text-sm">
          <Link
            href="/profile"
            onClick={onClose}
            className="p-3.5 rounded-2xl bg-[#2D2F4C] border border-[#9A8CC3]/25 text-white flex items-center justify-between touch-press"
          >
            <span>Edit Profile & Photos</span>
            <span className="text-[#9A8CC3]">â†’</span>
          </Link>

          <Link
            href="/favorites"
            onClick={onClose}
            className="p-3.5 rounded-2xl bg-[#2D2F4C] border border-[#9A8CC3]/25 text-white flex items-center justify-between touch-press"
          >
            <span>Saved Profiles</span>
            <span className="text-[#9A8CC3]">â†’</span>
          </Link>

          <Link
            href="/standards"
            onClick={onClose}
            className="p-3.5 rounded-2xl bg-[#2D2F4C] border border-[#9A8CC3]/25 text-[#DDD8D4] hover:text-white flex items-center justify-between touch-press"
          >
            <span>Community Standards</span>
            <span className="text-[#9A8CC3]">â†’</span>
          </Link>
        </div>

        {/* Auth Action */}
        <div className="pt-2 border-t border-[#9A8CC3]/25">
          <Link
            href="/login"
            onClick={onClose}
            className="w-full py-3.5 rounded-2xl bg-[#2D2F4C] border border-[#9A8CC3]/40 text-[#DDD8D4] hover:text-white text-xs font-medium block text-center touch-press"
          >
            Sign Out / Switch Account
          </Link>
        </div>

      </div>

      <div className="fixed inset-0 -z-10" onClick={onClose} />
    </div>
  );
}
