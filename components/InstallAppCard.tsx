'use client';

import { useSyncExternalStore } from 'react';
import { Download, X } from 'lucide-react';
import {
  canPromptInstall,
  dismissInstall,
  installVersion,
  isInstallDismissed,
  isIosDevice,
  isStandalone,
  promptInstall,
  subscribeInstall,
} from '@/lib/pwaInstall';

const noopSubscribe = () => () => {};

/** One sentence per platform when the browser has no install prompt to offer. */
function manualInstallHint(): string | null {
  if (isIosDevice()) return 'On iPhone, tap Share, then Add to Home Screen.';
  if (/android/i.test(navigator.userAgent)) return 'On Android, open the browser menu and tap Install app or Add to Home screen.';
  return null;
}

/**
 * Our own install card for Android Chrome / desktop (see lib/pwaInstall.ts).
 *   variant "hero":     under the hero CTA for signed-out visitors, shown once.
 *   variant "settings": a Settings row beside "Push on this device", while installable.
 * Renders nothing when the browser can't install the site or it is already installed.
 */
export function InstallAppCard({ variant }: { variant: 'hero' | 'settings' }) {
  // Re-render whenever the install state changes; read the live values below.
  useSyncExternalStore(subscribeInstall, installVersion, () => 0);
  // Client-only (platform and storage checks): the server render is always empty.
  const mounted = useSyncExternalStore(noopSubscribe, () => true, () => false);
  if (!mounted || isStandalone()) return null;
  const available = canPromptInstall();
  if (variant === 'hero' && isInstallDismissed()) return null;

  if (!available) {
    // No install prompt here (iPhone Safari, Brave, DuckDuckGo, Samsung Internet...): one line of
    // guidance instead of a button.
    const hint = manualInstallHint();
    // iPhone Settings: "Push on this device" already gives the Add to Home Screen step.
    if (!hint || (variant === 'settings' && isIosDevice())) return null;
    return variant === 'settings' ? (
      <div className="flex items-center gap-3 p-3 rounded-2xl">
        <div className="w-8 h-8 rounded-xl bg-[#E8E6F1]/60 text-[#8574B7] flex items-center justify-center shrink-0">
          <Download className="w-4 h-4" aria-hidden />
        </div>
        <div>
          <p className="text-xs font-bold text-[#413B5E]">Install the app</p>
          <p className="text-[11px] text-[#413B5E]/75">{hint}</p>
        </div>
      </div>
    ) : (
      <div className="mt-4 w-full max-w-[300px] md:max-w-[360px] flex items-start gap-2.5 rounded-2xl border border-[#D0CDE1] bg-white p-3 shadow-brand-sm text-left">
        <Download className="w-4 h-4 mt-0.5 shrink-0 text-[#8574B7]" aria-hidden />
        <p className="flex-1 text-[11.5px] leading-snug text-[#413B5E]/75">{hint}</p>
        <button
          type="button"
          onClick={dismissInstall}
          aria-label="Dismiss"
          className="w-6 h-6 -mr-1 -mt-0.5 rounded-full flex items-center justify-center text-[#B8B3D1] hover:text-[#413B5E] shrink-0"
        >
          <X className="w-3.5 h-3.5" aria-hidden />
        </button>
      </div>
    );
  }

  if (variant === 'settings') {
    return (
      <div className="flex items-center justify-between p-3 rounded-2xl hover:bg-[#E8E6F1]/40 transition">
        <div className="flex items-center gap-3 pr-4">
          <div className="w-8 h-8 rounded-xl bg-[#E8E6F1]/60 text-[#8574B7] flex items-center justify-center shrink-0">
            <Download className="w-4 h-4" aria-hidden />
          </div>
          <div>
            <p className="text-xs font-bold text-[#413B5E]">Install the app</p>
            <p className="text-[11px] text-[#413B5E]/75">Opens full screen from your home screen</p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => void promptInstall()}
          className="h-8 px-3.5 rounded-full bg-[#8574B7] hover:bg-[#413B5E] text-white text-[11px] font-semibold shrink-0 transition-colors"
        >
          Install
        </button>
      </div>
    );
  }

  return (
    <div className="mt-4 w-full max-w-[300px] md:max-w-[360px] flex items-center gap-3 rounded-2xl border border-[#D0CDE1] bg-white p-3 shadow-brand-sm">
      <div className="w-9 h-9 rounded-xl bg-[#E8E6F1]/70 text-[#8574B7] flex items-center justify-center shrink-0">
        <Download className="w-4 h-4" aria-hidden />
      </div>
      <div className="flex-1 min-w-0 text-left">
        <p className="text-[12.5px] font-bold text-[#413B5E]">Install asiansin.love</p>
        <p className="text-[11px] text-[#413B5E]/65">Full screen, one tap from your home screen.</p>
      </div>
      <button
        type="button"
        onClick={() => void promptInstall()}
        className="h-8 px-3.5 rounded-full bg-[#8574B7] hover:bg-[#413B5E] text-white text-[11px] font-semibold shrink-0 transition-colors"
      >
        Install
      </button>
      <button
        type="button"
        onClick={dismissInstall}
        aria-label="Not now"
        className="w-7 h-7 -mr-1 rounded-full flex items-center justify-center text-[#B8B3D1] hover:text-[#413B5E] shrink-0"
      >
        <X className="w-3.5 h-3.5" aria-hidden />
      </button>
    </div>
  );
}

export default InstallAppCard;