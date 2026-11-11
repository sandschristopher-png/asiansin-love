'use client';

import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { isLocale, type Locale } from '@/lib/i18n/config';
import { hasLocaleCookie, persistLocale, readStoredLocale, writeLocaleCookie } from '@/lib/i18n/client';
import { loadMessages } from '@/lib/i18n/loadMessages';
import type { Messages } from '@/lib/i18n/messages';

type LocaleContextValue = {
  locale: Locale;
  m: Messages;
  /** Saves the choice (cookie + localStorage) and swaps the text in place. */
  setLocale: (next: Locale) => Promise<void>;
  switching: boolean;
};

const LocaleContext = createContext<LocaleContextValue | null>(null);

/**
 * Starts from the locale the server rendered with (NEXT_LOCALE cookie) and its dictionary.
 * Switching happens on the client: the new dictionary is loaded on demand and the page re-renders
 * in place. No server round trip, because middleware.ts redirects repeat signed-out requests for
 * "/" to /login.
 * On mount it reconciles the two stores: if the cookie is gone but localStorage still has a choice,
 * the cookie is rewritten and that language applied; otherwise localStorage follows the cookie.
 */
export function LocaleProvider({ locale: initialLocale, messages: initialMessages, children }: {
  locale: Locale;
  messages: Messages;
  children: React.ReactNode;
}) {
  const [state, setState] = useState({ locale: initialLocale, m: initialMessages });
  const [switching, setSwitching] = useState(false);
  const latest = useRef<Locale>(initialLocale);

  const apply = useCallback(async (next: Locale) => {
    latest.current = next;
    setSwitching(true);
    try {
      const m = await loadMessages(next);
      // Ignore a slower earlier load if the visitor has already picked another language.
      if (latest.current === next) setState({ locale: next, m });
    } finally {
      if (latest.current === next) setSwitching(false);
    }
  }, []);

  const setLocale = useCallback(
    async (next: Locale) => {
      persistLocale(next);
      await apply(next);
    },
    [apply]
  );

  useEffect(() => {
    const stored = readStoredLocale();
    if (!hasLocaleCookie()) {
      if (isLocale(stored) && stored !== initialLocale) {
        writeLocaleCookie(stored);
        void apply(stored);
      }
      return;
    }
    if (stored !== initialLocale) persistLocale(initialLocale);
  }, [initialLocale, apply]);

  return (
    <LocaleContext.Provider value={{ locale: state.locale, m: state.m, setLocale, switching }}>
      {children}
    </LocaleContext.Provider>
  );
}

export function useLocale(): LocaleContextValue {
  const value = useContext(LocaleContext);
  if (!value) throw new Error('useLocale must be used inside <LocaleProvider>');
  return value;
}
