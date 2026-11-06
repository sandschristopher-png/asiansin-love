'use client';

import React from 'react';
import { BellRing, MailX, MessageCircle, SlidersHorizontal } from 'lucide-react';

const POINTS = [
  { Icon: MessageCircle, text: 'Know the moment someone replies or you match, even with the app closed.' },
  { Icon: MailX, text: 'No email for likes or profile views. Those stay in the app and in these alerts.' },
  { Icon: SlidersHorizontal, text: 'Turn them off any time in Settings.' },
];

/**
 * Explains push notifications before the browser's own permission prompt, so the one-time system
 * dialog is only shown to someone who already chose "Allow". (Declining the system prompt can't
 * be undone from the page, so it should never come as a surprise.)
 */
export function PushPermissionCard({ onAllow, onClose }: { onAllow: () => void; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-[80] flex items-end sm:items-center justify-center bg-black/40 px-4 pb-[max(1rem,env(safe-area-inset-bottom))]" onClick={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="push-card-title"
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-[380px] border border-[#D0CDE1] bg-white rounded-2xl p-5 shadow-brand-sm [transform:translate3d(0,0,0)] will-change-transform ail-modal-pop"
      >
        <div className="w-11 h-11 rounded-2xl bg-[#E8E6F1]/70 text-[#665D96] flex items-center justify-center">
          <BellRing className="w-5 h-5" aria-hidden />
        </div>
        <h2 id="push-card-title" className="mt-3 text-base font-bold text-[#413B5E]">
          Turn on message alerts
        </h2>
        <ul className="mt-3 space-y-2.5">
          {POINTS.map(({ Icon, text }) => (
            <li key={text} className="flex gap-2.5 text-[12.5px] leading-snug text-[#413B5E]/80">
              <Icon className="w-4 h-4 shrink-0 text-[#B8B3D1] mt-0.5" aria-hidden />
              {text}
            </li>
          ))}
        </ul>
        <div className="mt-5 flex gap-2.5">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 h-11 rounded-full border border-[#D0CDE1] bg-white text-sm font-medium text-[#413B5E] hover:bg-[#E8E6F1]/30 transition-colors"
          >
            Not now
          </button>
          <button
            type="button"
            onClick={onAllow}
            className="flex-1 h-11 rounded-full bg-[#665D96] hover:bg-[#413B5E] text-sm font-semibold text-white transition-colors"
          >
            Allow
          </button>
        </div>
      </div>
    </div>
  );
}

export default PushPermissionCard;
