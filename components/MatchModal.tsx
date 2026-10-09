'use client';

import React, { useEffect } from 'react';
import Link from 'next/link';
import { Heart, MessageCircle, Sparkles, X } from 'lucide-react';

interface MatchModalProps {
  isOpen: boolean;
  onClose: () => void;
  matchedProfile: {
    id: string;
    name: string;
    avatarUrl?: string;
  } | null;
  currentUserAvatar?: string;
}

export default function MatchModal({
  isOpen,
  onClose,
  matchedProfile,
  currentUserAvatar,
}: MatchModalProps) {
  useEffect(() => {
    if (isOpen) {
      // Trigger subtle haptic vibration if supported on mobile
      if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
        try {
          navigator.vibrate([40, 60, 100]);
        } catch {}
      }
    }
  }, [isOpen]);

  if (!isOpen || !matchedProfile) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-in fade-in duration-300">
      <div 
        className="relative w-full max-w-sm rounded-3xl bg-gradient-to-b from-[#1F1D2B] to-[#14131D] border border-white/10 p-6 text-center shadow-[0_20px_50px_rgba(0,0,0,0.5)] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Subtle background glow */}
        <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-48 h-48 bg-[#6555b8]/30 rounded-full blur-3xl pointer-events-none" />

        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full text-white/50 hover:text-white hover:bg-white/10 transition"
          aria-label="Close"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Floating Sparks Icon */}
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#6555b8]/20 border border-[#6555b8]/40 text-[#cbbefc] text-xs font-semibold uppercase tracking-wider mb-4">
          <Sparkles className="w-3.5 h-3.5 text-[#B2A4D7]" />
          <span>It&apos;s a Match!</span>
        </div>

        <h2 className="text-2xl font-bold text-white mb-2">
          You &amp; {matchedProfile.name}
        </h2>
        <p className="text-xs text-white/70 mb-6">
          You both expressed interest in each other.
        </p>

        {/* Overlapping Profile Avatars */}
        <div className="relative flex items-center justify-center mb-7">
          {/* User's Avatar */}
          <div className="relative w-20 h-20 rounded-full overflow-hidden border-2 border-[#6555b8] shadow-lg z-10 -mr-3 bg-[#252336]">
            <img
              src={currentUserAvatar || '/placeholder-avatar.svg'}
              alt="You"
              className="w-full h-full object-cover"
            />
          </div>

          {/* Glowing Center Heart */}
          <div className="absolute z-30 w-9 h-9 rounded-full bg-gradient-to-tr from-[#6555b8] to-[#8b7bd9] border-2 border-[#14131D] flex items-center justify-center shadow-lg animate-bounce">
            <Heart className="w-4 h-4 text-white fill-white" />
          </div>

          {/* Matched Partner's Avatar */}
          <div className="relative w-20 h-20 rounded-full overflow-hidden border-2 border-[#6555b8] shadow-lg z-20 -ml-3 bg-[#252336]">
            <img
              src={matchedProfile.avatarUrl || '/placeholder-avatar.svg'}
              alt={matchedProfile.name}
              className="w-full h-full object-cover"
            />
          </div>
        </div>

        {/* Actions */}
        <div className="space-y-2.5">
          <Link
            href={`/messages/${matchedProfile.id}`}
            onClick={onClose}
            className="w-full inline-flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-gradient-to-r from-[#6555b8] to-[#5242a3] hover:brightness-110 text-white text-sm font-semibold shadow-[0_4px_16px_rgba(101,85,184,0.4)] transition active:scale-[0.98]"
          >
            <MessageCircle className="w-4 h-4" />
            Send a Message
          </Link>

          <button
            type="button"
            onClick={onClose}
            className="w-full py-2.5 px-4 rounded-xl text-white/70 hover:text-white hover:bg-white/5 text-xs font-medium transition"
          >
            Keep Browsing
          </button>
        </div>
      </div>
    </div>
  );
}
