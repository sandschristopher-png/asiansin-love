'use client';

import React, { useState } from 'react';
import { Check, Globe, Loader2 } from 'lucide-react';
import { BottomSheet } from '@/components/ui/BottomSheet';
import { useLocale } from '@/components/i18n/LocaleProvider';
import { HTML_LANG, LOCALES, LOCALE_LABELS, type Locale } from '@/lib/i18n/config';
import type { Messages } from '@/lib/i18n';

/**
 * Bottom sheet listing every language by its own name (no flags), the active one with a purple
 * check. Choosing saves it (cookie, localStorage and, when signed in, the profile), refreshes the
 * app text at once and closes. `onChanged` receives the new language's dictionary, so the caller
 * can confirm in the language that was just chosen.
 */
export function LanguageSheet({ onClose, onChanged }: { onClose: () => void; onChanged?: (locale: Locale, m: Messages) => void }) {
  const { locale, t, setLocale } = useLocale();
  const [pending, setPending] = useState<Locale | null>(null);

  const choose = async (next: Locale) => {
    if (pending) return;
    if (next === locale) {
      onClose();
      return;
    }
    setPending(next);
    try {
      const m = await setLocale(next);
      onChanged?.(next, m);
      onClose();
    } finally {
      setPending(null);
    }
  };

  return (
    <BottomSheet title={t('common.language')} onClose={onClose}>
      <ul role="listbox" aria-label={t('common.language')} className="mt-2">
        {LOCALES.map((l) => {
          const active = l === locale;
          return (
            <li key={l} role="option" aria-selected={active}>
              <button
                type="button"
                onClick={() => choose(l)}
                disabled={pending !== null}
                lang={HTML_LANG[l]}
                className={`flex w-full min-h-12 items-center justify-between gap-3 border-b border-slate-100 px-1 py-3 text-left text-[15px] transition-colors last:border-b-0 hover:bg-[#8574B7]/5 disabled:opacity-60 ${
                  active ? 'font-semibold text-[#8574B7]' : 'font-medium text-[#413B5E]'
                }`}
              >
                <span className="min-w-0 truncate">{LOCALE_LABELS[l]}</span>
                {pending === l ? (
                  <Loader2 className="h-4 w-4 shrink-0 animate-spin text-[#8574B7]" aria-hidden />
                ) : active ? (
                  <Check className="h-4 w-4 shrink-0 text-[#8574B7]" strokeWidth={2.5} aria-hidden />
                ) : null}
              </button>
            </li>
          );
        })}
      </ul>
    </BottomSheet>
  );
}

/**
 * The header pill: a flat globe icon and the short locale code ("TH"), or the native name when
 * `full` is set (footers). Opens the language sheet.
 */
export function LanguagePill({ full = false, className = '' }: { full?: boolean; className?: string }) {
  const { locale, t } = useLocale();
  const [open, setOpen] = useState(false);
  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-haspopup="dialog"
        aria-label={`${t('common.language')}: ${LOCALE_LABELS[locale]}`}
        className={`inline-flex h-9 items-center gap-1.5 rounded-full px-2.5 text-xs font-semibold text-slate-600 transition-colors hover:text-[#413B5E] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#8574B7] ${className}`}
      >
        <Globe className="h-4 w-4 shrink-0" aria-hidden />
        <span lang={HTML_LANG[locale]}>{full ? LOCALE_LABELS[locale] : locale.toUpperCase()}</span>
      </button>
      {open && <LanguageSheet onClose={() => setOpen(false)} />}
    </>
  );
}

export default LanguagePill;
