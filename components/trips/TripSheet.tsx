'use client';

import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';

/**
 * Bottom sheet shell shared by the trip drawer and planner (same look as the app's other sheets).
 * Portalled to <body> so it covers the BottomNav, closes on backdrop tap or Escape.
 */
export function TripSheet({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);

  if (typeof document === 'undefined') return null;

  return createPortal(
    <div className="fixed inset-0 z-[999] flex items-end justify-center" role="dialog" aria-modal="true" aria-label={title}>
      <div className="fixed inset-0 bg-black/50" onClick={onClose} />
      <div className="relative w-full max-w-[430px] max-h-[88dvh] overflow-y-auto overscroll-contain bg-white rounded-t-[28px] px-5 pt-4 pb-[max(1.25rem,env(safe-area-inset-bottom))] animate-[ailSheetUp_260ms_cubic-bezier(0.16,1,0.3,1)]">
        <div className="flex items-center justify-between pb-3 border-b border-slate-200">
          <h2 className="text-sm font-semibold text-[#413B5E]">{title}</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="p-1.5 rounded-full text-slate-600 hover:bg-[#E8E6F1]/70 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
        {children}
      </div>
    </div>,
    document.body
  );
}

export default TripSheet;
