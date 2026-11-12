'use client';

import React, { useState } from 'react';
import { ChevronRight, Globe } from 'lucide-react';
import { useActionToast } from '@/components/ActionToast';
import { LanguageSheet } from '@/components/i18n/LanguageSheet';
import { useLocale } from '@/components/i18n/LocaleProvider';
import { translate } from '@/lib/i18n';
import { HTML_LANG, LOCALE_LABELS } from '@/lib/i18n/config';

/**
 * Settings row "App Language": shows the active language in its own script and opens the bottom
 * sheet. This is the language of menus and buttons, kept apart from the languages a member speaks
 * (a profile field). Choosing one saves it to the cookie and profiles.preferred_language, switches
 * the app text at once and confirms with a toast (z-[1100]) written in the language just chosen.
 */
export function AppLanguageRow() {
  const { locale, t } = useLocale();
  const showActionToast = useActionToast();
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-haspopup="dialog"
        className="flex w-full items-center justify-between gap-3 rounded-2xl p-3 text-left transition hover:bg-[#E8E6F1]/40"
      >
        <div className="flex min-w-0 items-center gap-3">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-[#E8E6F1]/60 text-[#8574B7]">
            <Globe className="h-4 w-4" aria-hidden />
          </div>
          <div className="min-w-0">
            <p className="text-xs font-semibold text-[#413B5E]">{t('settings.appLanguage')}</p>
            <p className="text-[11px] text-[#413B5E]/75">{t('settings.appLanguageHint')}</p>
          </div>
        </div>
        <span className="inline-flex shrink-0 items-center gap-1 text-xs font-semibold text-[#8574B7]" lang={HTML_LANG[locale]}>
          {LOCALE_LABELS[locale]}
          <ChevronRight className="h-4 w-4 text-slate-600" aria-hidden />
        </span>
      </button>
      {open && (
        <LanguageSheet
          onClose={() => setOpen(false)}
          onChanged={(_next, messages) => showActionToast(translate(messages, 'settings.languageUpdated'), 'info')}
        />
      )}
    </>
  );
}

export default AppLanguageRow;
