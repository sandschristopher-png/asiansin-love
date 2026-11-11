'use client';

import React, { useRef, useState } from 'react';
import { BottomSheet } from '@/components/ui/BottomSheet';

export interface ShareData {
  url: string;
  title: string;
  text: string;
}

const ICON = 'w-5 h-5 text-[#8574B7]';

/**
 * Desktop share sheet (phones use the native share sheet instead; see useShare): WhatsApp,
 * Facebook, Telegram, plus a copy-link row with a fallback for browsers without the async
 * Clipboard API.
 */
export function ShareDrawer({ url, title, text, onClose }: ShareData & { onClose: () => void }) {
  const [copied, setCopied] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const encodedUrl = encodeURIComponent(url);
  const targets = [
    {
      name: 'WhatsApp',
      href: `https://api.whatsapp.com/send?text=${encodeURIComponent(`${text} ${url}`)}`,
      icon: (
        <svg className={ICON} fill="currentColor" viewBox="0 0 24 24" aria-hidden>
          <path d="M12.04 2c-5.46 0-9.91 4.45-9.91 9.91 0 1.75.46 3.45 1.32 4.95L2.05 22l5.25-1.38c1.45.79 3.08 1.21 4.74 1.21 5.46 0 9.91-4.45 9.91-9.91 0-2.65-1.03-5.14-2.9-7.01A9.816 9.816 0 0012.04 2m.01 1.67c2.2 0 4.26.86 5.82 2.41a8.17 8.17 0 012.41 5.83c0 4.54-3.7 8.24-8.24 8.24-1.44 0-2.86-.38-4.11-1.1l-.29-.17-3.06.8.82-2.98-.19-.3a8.217 8.217 0 01-1.26-4.32c0-4.54 3.7-8.24 8.24-8.24m4.52 11.64c-.25-.13-1.47-.72-1.7-.81-.23-.08-.39-.13-.56.13-.17.25-.64.81-.79.97-.14.17-.29.19-.54.06-.25-.13-1.06-.39-2.02-1.24-.74-.66-1.24-1.48-1.39-1.73-.14-.25-.02-.39.11-.51.11-.11.25-.29.37-.43.13-.15.17-.25.25-.42.08-.17.04-.31-.02-.44-.06-.13-.56-1.34-.76-1.84-.2-.49-.4-.42-.56-.43h-.48c-.17 0-.44.06-.67.31-.23.25-.88.86-.88 2.1 0 1.24.9 2.44 1.03 2.61.13.17 1.77 2.7 4.29 3.79.6.26 1.07.41 1.43.53.6.19 1.15.16 1.58.1.48-.07 1.47-.6 1.68-1.18.21-.58.21-1.07.15-1.18-.06-.11-.23-.17-.48-.3z" />
        </svg>
      ),
    },
    {
      name: 'Facebook',
      href: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`,
      icon: (
        <svg className={ICON} fill="currentColor" viewBox="0 0 24 24" aria-hidden>
          <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
        </svg>
      ),
    },
    {
      name: 'Telegram',
      href: `https://t.me/share/url?url=${encodedUrl}&text=${encodeURIComponent(text)}`,
      icon: (
        <svg className={ICON} fill="currentColor" viewBox="0 0 24 24" aria-hidden>
          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8c-.15 1.58-.8 5.42-1.13 7.19-.14.75-.42 1-.68 1.03-.58.05-1.02-.38-1.58-.75-.88-.58-1.38-.94-2.23-1.5-.99-.65-.35-1.01.22-1.59.15-.15 2.71-2.48 2.76-2.69a.2.2 0 00-.05-.18c-.06-.05-.14-.03-.21-.02-.09.02-1.49.95-4.22 2.79-.4.27-.76.41-1.08.4-.36-.01-1.04-.2-1.55-.37-.63-.2-1.12-.31-1.08-.66.02-.18.27-.36.75-.55 2.92-1.27 4.86-2.11 5.83-2.51 2.78-1.16 3.35-1.36 3.73-1.36.08 0 .27.02.39.12.1.08.13.19.14.27-.01.06.01.24 0 .38z" />
        </svg>
      ),
    },
  ];

  const copy = async () => {
    let ok = false;
    try {
      await navigator.clipboard.writeText(url);
      ok = true;
    } catch {
      // Older browsers / non-secure contexts: select the field and use the legacy command.
      const input = inputRef.current;
      if (input) {
        input.select();
        try {
          ok = document.execCommand('copy');
        } catch {}
      }
    }
    if (ok) {
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <BottomSheet title={title} onClose={onClose}>
      <div className="grid grid-cols-3 gap-2.5 my-5">
        {targets.map((t) => (
          <a
            key={t.name}
            href={t.href}
            target="_blank"
            rel="noopener noreferrer"
            className="flex flex-col items-center justify-center gap-2 p-3 rounded-2xl border border-slate-200 bg-white hover:bg-[#8574B7]/5 hover:border-[#8574B7]/30 transition-colors"
          >
            {t.icon}
            <span className="text-xs font-medium text-[#413B5E]">{t.name}</span>
          </a>
        ))}
      </div>

      <div className="flex items-center gap-2 p-1.5 pl-3 rounded-full border border-slate-200 bg-slate-50">
        <input
          ref={inputRef}
          type="text"
          readOnly
          value={url}
          aria-label="Link to share"
          onFocus={(e) => e.currentTarget.select()}
          className="flex-1 min-w-0 bg-transparent text-xs text-slate-600 outline-none"
        />
        <button
          type="button"
          onClick={copy}
          className="shrink-0 h-8 px-4 rounded-full bg-[#8574B7] hover:bg-[#534377] text-white text-xs font-medium transition-colors"
        >
          {copied ? 'Copied' : 'Copy link'}
        </button>
      </div>
    </BottomSheet>
  );
}

export default ShareDrawer;
