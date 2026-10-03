'use client';

import React, { useState, useEffect } from 'react';
import { Share, PlusSquare, X } from 'lucide-react';
import Image from 'next/image';

const DISMISS_KEY = 'asiansinlove_ios_install_dismissed';
const DISMISS_DURATION_DAYS = 7;

export function IosInstallBanner() {
  const [showPrompt, setShowPrompt] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Check if already in standalone display mode
    const isStandalone =
      ('standalone' in window.navigator && (window.navigator as any).standalone) ||
      window.matchMedia('(display-mode: standalone)').matches;

    if (isStandalone) return;

    // Detect iOS Safari (not Chrome/Firefox/Edge on iOS)
    const userAgent = window.navigator.userAgent.toLowerCase();
    const isIos = /iphone|ipad|ipod/.test(userAgent);
    const isSafari =
      userAgent.includes('safari') &&
      !userAgent.includes('crios') &&
      !userAgent.includes('fxios') &&
      !userAgent.includes('edgios');

    if (!isIos || !isSafari) return;

    // Check if dismissed recently
    const dismissedTime = localStorage.getItem(DISMISS_KEY);
    if (dismissedTime) {
      const parsed = parseInt(dismissedTime, 10);
      const now = Date.now();
      const daysPassed = (now - parsed) / (1000 * 60 * 60 * 24);
      if (daysPassed < DISMISS_DURATION_DAYS) {
        return;
      }
    }

    const timer = setTimeout(() => {
      setShowPrompt(true);
    }, 1500);

    return () => clearTimeout(timer);
  }, []);

  const handleDismiss = () => {
    setShowPrompt(false);
    try {
      localStorage.setItem(DISMISS_KEY, Date.now().toString());
    } catch {}
  };

  if (!showPrompt) return null;

  return (
    <div className="fixed bottom-20 left-4 right-4 sm:left-auto sm:right-6 sm:bottom-6 z-50 max-w-sm mx-auto bg-[#2D2F4C]/95 backdrop-blur-md border border-[#9A8CC3]/40 rounded-2xl p-4 shadow-2xl shadow-black/80 text-white animate-in fade-in slide-in-from-bottom-5 duration-300">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="relative w-11 h-11 rounded-xl overflow-hidden border border-[#9A8CC3]/40 bg-[#2D2F4C] p-1.5 shrink-0 flex items-center justify-center">
            <Image src="/ail-heart.png" alt="asiansin.love" fill className="object-contain p-1" />
          </div>
          <div className="flex flex-col">
            <h4 className="text-xs font-medium text-white tracking-wide">Install asiansin.love</h4>
            <span className="text-[10px] text-[#B2A4D7]">Add to Home Screen for full app experience</span>
          </div>
        </div>
        <button
          onClick={handleDismiss}
          className="text-[#B2A4D7] hover:text-white p-1 rounded-lg transition"
          aria-label="Dismiss banner"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="mt-3 pt-3 border-t border-[#7D7E92]/25 space-y-2 text-[11px] text-[#1C1924]/90">
        <div className="flex items-center gap-2">
          <span className="flex items-center justify-center w-5 h-5 rounded-full bg-[#2D2F4C] text-[10px] font-medium text-[#B2A4D7] shrink-0">
            1
          </span>
          <span>
            Tap the Safari <Share className="w-3.5 h-3.5 inline mx-1 text-sky-400" /> <strong>Share</strong> button below
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="flex items-center justify-center w-5 h-5 rounded-full bg-[#2D2F4C] text-[10px] font-medium text-[#B2A4D7] shrink-0">
            2
          </span>
          <span>
            Select <PlusSquare className="w-3.5 h-3.5 inline mx-1 text-emerald-400" /> <strong>Add to Home Screen</strong>
          </span>
        </div>
      </div>
    </div>
  );
}

export default IosInstallBanner;

