'use client';

import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { EN, translate, type Messages, type TKey } from '@/lib/i18n';
import { DEFAULT_LOCALE, HTML_LANG, isLocale, type Locale } from '@/lib/i18n/config';
import {
  detectBrowserLocale,
  persistLocale,
  readLocaleCookie,
  readStoredLocale,
  saveLocaleToServer,
  writeLocaleCookie,
} from '@/lib/i18n/client';
import { loadMessages } from '@/lib/i18n/loadMessages';
import { supabase } from '@/lib/supabase/client';

type TFunction = (key: TKey, vars?: Record<string, string | number>) => string;

type LocaleContextValue = {
  locale: Locale;
  /** The full dictionary (the active language laid over English). */
  m: Messages;
  /** Translate by dotted key; falls back to English, never to the raw key. */
  t: TFunction;
  /** Switches language: saves it (cookie, localStorage, profile) and resolves with the new dictionary. */
  setLocale: (next: Locale) => Promise<Messages>;
  /** Used by a nested provider to keep this one in step; saves nothing. */
  adopt: (next: Locale, messages: Messages) => void;
  switching: boolean;
};

const LocaleContext = createContext<LocaleContextValue | null>(null);

/**
 * One provider for the whole app (mounted in app/layout.tsx) plus a nested one on the pages the
 * server renders itself.
 *   - Root (no props): starts in English, then adopts the member's language on the client: cookie,
 *     then localStorage, then profiles.preferred_language, then the browser's language list.
 *   - Server-fed (landing, login, signup): `locale` and `messages` come from the server, which read
 *     the cookie or Accept-Language, so the first byte is already in the right language. It also
 *     tells the root provider, so a later in-app page starts in the same language.
 */
export function LocaleProvider({
  locale: serverLocale,
  messages: serverMessages,
  children,
}: {
  locale?: Locale;
  messages?: Messages;
  children: React.ReactNode;
}) {
  const parent = useContext(LocaleContext);
  const fromServer = serverLocale !== undefined;
  const [state, setState] = useState<{ locale: Locale; m: Messages }>({
    locale: serverLocale ?? DEFAULT_LOCALE,
    m: serverMessages ?? EN,
  });
  const [switching, setSwitching] = useState(false);
  const latest = useRef<Locale>(serverLocale ?? DEFAULT_LOCALE);

  const adopt = useCallback((next: Locale, m: Messages) => {
    latest.current = next;
    setState({ locale: next, m });
  }, []);

  /** Loads and shows `next` without saving it. */
  const show = useCallback(async (next: Locale): Promise<Messages> => {
    latest.current = next;
    setSwitching(true);
    try {
      const m = await loadMessages(next);
      // A slower earlier load must not overwrite a language picked since.
      if (latest.current === next) setState({ locale: next, m });
      return m;
    } finally {
      if (latest.current === next) setSwitching(false);
    }
  }, []);

  const setLocale = useCallback(
    async (next: Locale) => {
      persistLocale(next);
      void saveLocaleToServer(next);
      const m = await show(next);
      parent?.adopt(next, m);
      return m;
    },
    [show, parent]
  );

  // Server-fed provider: keep the root provider in step, and retire the older cookie name.
  useEffect(() => {
    if (!fromServer) return;
    if (readLocaleCookie() && !document.cookie.includes('mia_lang=')) writeLocaleCookie(readLocaleCookie() as Locale);
    parent?.adopt(serverLocale as Locale, serverMessages ?? EN);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Root provider: find the member's language on the client.
  useEffect(() => {
    if (fromServer) return;
    let cancelled = false;
    (async () => {
      const explicit = readLocaleCookie() ?? readStoredLocale();
      if (explicit) {
        // Move an older cookie to mia_lang so the server reads it next time.
        if (!document.cookie.includes('mia_lang=')) writeLocaleCookie(explicit);
        if (explicit !== DEFAULT_LOCALE) await show(explicit);
        return;
      }
      let chosen: Locale | null = null;
      try {
        const { data } = await supabase.auth.getSession();
        const uid = data.session?.user?.id;
        if (uid) {
          const { data: row } = await supabase.from('profiles').select('preferred_language').eq('id', uid).maybeSingle();
          const saved = (row as { preferred_language?: string } | null)?.preferred_language;
          // 'en' is also the column default, so only another language counts as a saved choice.
          if (isLocale(saved) && saved !== DEFAULT_LOCALE) chosen = saved;
        }
      } catch {
        // No session or no column yet: fall through to the browser language.
      }
      chosen = chosen ?? detectBrowserLocale();
      if (!cancelled && chosen && chosen !== DEFAULT_LOCALE) await show(chosen);
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // The document language drives hyphenation, CJK glyph choice and screen-reader voices.
  useEffect(() => {
    document.documentElement.lang = HTML_LANG[state.locale];
  }, [state.locale]);

  const t = useCallback<TFunction>((key, vars) => translate(state.m, key, vars), [state.m]);
  const value = useMemo(
    () => ({ locale: state.locale, m: state.m, t, setLocale, adopt, switching }),
    [state.locale, state.m, t, setLocale, adopt, switching]
  );

  return <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>;
}

export function useLocale(): LocaleContextValue {
  const value = useContext(LocaleContext);
  if (!value) throw new Error('useLocale must be used inside <LocaleProvider>');
  return value;
}
