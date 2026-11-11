'use client';

import React from 'react';
import { ChevronDown, Globe } from 'lucide-react';
import { HTML_LANG, LOCALES, LOCALE_LABELS, type Locale } from '@/lib/i18n/config';
import { useLocale } from '@/components/i18n/LocaleProvider';
import { ThemedSelect, type ThemedOption } from '@/components/ui/ThemedSelect';

const OPTIONS: ThemedOption<Locale>[] = LOCALES.map((l) => ({ value: l, label: LOCALE_LABELS[l], lang: HTML_LANG[l] }));

/**
 * Language picker listing every language in its own script, as a two-column themed menu so all
 * eleven fit without scrolling (no OS-blue native popup). `compact` shows the language code (header,
 * menu aligned right); otherwise the native name (footer, menu centred). Choosing saves the NEXT_LOCALE cookie + localStorage preferred_locale and
 * swaps the text in place.
 */
export function LanguageSelect({ compact = false }: { compact?: boolean }) {
  const { locale, m, setLocale, switching } = useLocale();

  return (
    <ThemedSelect<Locale>
      value={locale}
      options={OPTIONS}
      ariaLabel={m.language.label}
      onChange={(next) => void setLocale(next)}
      align={compact ? 'right' : 'center'}
      columns={2}
      menuClassName="w-[20rem] max-w-[calc(100vw-1rem)]"
      className={`inline-flex h-9 items-center gap-1.5 rounded-full px-2 text-xs font-medium text-slate-600 hover:text-[#413B5E] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#8574B7] ${
        switching ? 'opacity-60' : ''
      }`}
      renderTrigger={(_, open) => (
        <>
          <Globe className="w-3.5 h-3.5 shrink-0" aria-hidden />
          <span lang={HTML_LANG[locale]}>{compact ? locale.toUpperCase() : LOCALE_LABELS[locale]}</span>
          <ChevronDown className={`w-3 h-3 shrink-0 transition-transform ${open ? 'rotate-180' : ''}`} aria-hidden />
        </>
      )}
    />
  );
}

export default LanguageSelect;
