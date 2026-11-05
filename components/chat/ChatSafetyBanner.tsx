'use client';

import React, { useState, useSyncExternalStore } from 'react';
import { ShieldCheck, X } from 'lucide-react';

const STORAGE_PREFIX = 'ail_chat_safety_dismissed:';

const TIPS = [
  'Keep chatting on asiansin.love until you trust each other.',
  'Meet first in a public place, in the daytime.',
  'Never send money, gift cards or bank or card details to someone you met here.',
];

const readDismissed = (key: string) => {
  try {
    return localStorage.getItem(STORAGE_PREFIX + key) === '1';
  } catch {
    return false;
  }
};
const noopSubscribe = () => () => {};

/**
 * Dismissible safety tips at the top of a chat thread. Dismissal is remembered per conversation
 * in this browser. The server render (and storage that can't be read) counts as "dismissed", so
 * the card never flashes in and out for someone who already closed it.
 */
export function ChatSafetyBanner({ conversationKey }: { conversationKey: string }) {
  const storedDismissed = useSyncExternalStore(
    noopSubscribe,
    () => readDismissed(conversationKey),
    () => true
  );
  const [closed, setClosed] = useState(false);
  if (storedDismissed || closed) return null;

  const dismiss = () => {
    setClosed(true);
    try {
      localStorage.setItem(STORAGE_PREFIX + conversationKey, '1');
    } catch {
      // private mode: hidden for this visit only
    }
  };

  return (
    <aside
      aria-label="Safety tips"
      className="relative my-3 p-3.5 pr-9 rounded-2xl border border-[#D5C6EC] bg-[#E8DFF5]/40 shadow-brand-sm"
    >
      <div className="flex items-center gap-2">
        <ShieldCheck className="w-4 h-4 shrink-0 text-[#72519A]" aria-hidden />
        <p className="text-[12.5px] font-bold text-[#51376D]">Safety &amp; Trust Guidelines</p>
      </div>
      <ul className="mt-1.5 space-y-1 pl-6 list-disc marker:text-[#B5A0DA]">
        {TIPS.map((tip) => (
          <li key={tip} className="text-[11.5px] leading-snug text-[#51376D]/75">
            {tip}
          </li>
        ))}
      </ul>
      <button
        type="button"
        onClick={dismiss}
        aria-label="Dismiss safety tips"
        className="absolute top-2 right-2 w-7 h-7 rounded-full flex items-center justify-center text-[#B5A0DA] hover:text-[#51376D] hover:bg-white/70 transition-colors"
      >
        <X className="w-3.5 h-3.5" aria-hidden />
      </button>
    </aside>
  );
}

export default ChatSafetyBanner;
