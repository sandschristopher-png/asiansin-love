'use client';

import React, { useCallback, useState } from 'react';
import { ShareDrawer, type ShareData } from '@/components/share/ShareDrawer';

export const SITE_URL = 'https://meetin.asia';
const DEFAULT_TITLE = 'Meet in Asia';
const DEFAULT_TEXT = 'Meet real singles across Southeast Asia on Meet in Asia, with free live selfie verification.';

export type ShareOptions = Partial<ShareData>;

/**
 * Phones (touch-first pointer + Web Share API) get the native share sheet (WhatsApp, Messages,
 * Facebook...). Desktop browsers get ShareDrawer, even where navigator.share exists (Windows and
 * macOS Chrome have it, but their system dialogs are a poor fit for copying a link).
 */
function prefersNativeShare(): boolean {
  if (typeof navigator === 'undefined' || typeof navigator.share !== 'function') return false;
  try {
    return window.matchMedia('(pointer: coarse)').matches;
  } catch {
    return false;
  }
}

/** Current page without query or hash (no tracking params or private state in shared links). */
function currentUrl(): string {
  if (typeof window === 'undefined') return SITE_URL;
  return `${window.location.origin}${window.location.pathname}`;
}

/**
 * share(opts) opens the right share UI; render `shareSheet` anywhere that stays mounted (it is
 * portalled). Keeping the sheet outside menus means closing a menu does not close the sheet.
 */
export function useShare() {
  const [sheet, setSheet] = useState<ShareData | null>(null);

  const share = useCallback(async (opts: ShareOptions = {}) => {
    const data: ShareData = {
      url: opts.url ?? currentUrl(),
      title: opts.title ?? DEFAULT_TITLE,
      text: opts.text ?? DEFAULT_TEXT,
    };
    if (prefersNativeShare()) {
      try {
        await navigator.share(data);
        return;
      } catch (err) {
        // Dismissed by the member: do nothing. Any other failure falls back to the sheet.
        if ((err as Error)?.name === 'AbortError') return;
      }
    }
    setSheet(data);
  }, []);

  const shareSheet = sheet ? <ShareDrawer {...sheet} onClose={() => setSheet(null)} /> : null;
  return { share, shareSheet };
}
