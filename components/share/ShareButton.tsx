'use client';

import React from 'react';
import { Share2 } from 'lucide-react';
import { useShare, type ShareOptions } from '@/components/share/useShare';

/**
 * Standalone Share button: native share sheet on phones, ShareDrawer on desktop. Defaults share
 * the current page. Inside a menu that closes on tap, use useShare() in the parent instead so the
 * sheet outlives the menu.
 */
export function ShareButton({
  className = '',
  label = 'Share',
  ...opts
}: ShareOptions & { className?: string; label?: string }) {
  const { share, shareSheet } = useShare();
  return (
    <>
      <button
        type="button"
        onClick={() => share(opts)}
        className={
          className ||
          'inline-flex items-center gap-1.5 h-8 px-3 rounded-full border border-[#D0CDE1] bg-white text-xs font-medium text-[#413B5E] hover:border-[#8574B7]/40 hover:text-[#8574B7] transition-colors'
        }
      >
        <Share2 className="w-4 h-4 text-[#8574B7]" aria-hidden />
        <span>{label}</span>
      </button>
      {shareSheet}
    </>
  );
}

export default ShareButton;
