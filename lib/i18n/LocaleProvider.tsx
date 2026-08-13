"use client";

import {
  createContext,
  startTransition,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  ViewTransition,
  type ReactNode,
} from "react";

import en from "./dictionaries/en.json";
import ja from "./dictionaries/ja.json";
import { DEFAULT_LOCALE, LOCALE_COOKIE, LOCALE_COOKIE_MAX_AGE, type Locale } from "./config";

/**
 * Japanese is the source dictionary: its keys define the contract, and
 * `en.json` is checked against them below. A missing or misspelled English key
 * is a type error, not a string that silently renders as its own key name.
 */
type TranslationKey = keyof typeof ja;

const dictionaries: Record<Locale, Record<TranslationKey, string>> = {
  ja,
  // `satisfies` on the import would not catch a *missing* key, only an extra
  // one; annotating the record does both.
  en: en as Record<TranslationKey, string>,
};

/** Values that can be substituted into a `{placeholder}`. */
type Vars = Record<string, string | number>;

interface LocaleContextValue {
  locale: Locale;
  setLocale: (next: Locale) => void;
  t: (key: TranslationKey, vars?: Vars) => string;
}

const LocaleContext = createContext<LocaleContextValue | null>(null);

function interpolate(template: string, vars?: Vars) {
  if (!vars) return template;
  return template.replace(/\{(\w+)\}/g, (match, name: string) =>
    name in vars ? String(vars[name]) : match,
  );
}

export function LocaleProvider({
  initialLocale,
  children,
}: {
  initialLocale: Locale;
  children: ReactNode;
}) {
  const [locale, setLocaleState] = useState<Locale>(initialLocale);

  const setLocale = useCallback((next: Locale) => {
    // Wrapped in a Transition so React drives it through the View Transitions
    // API: the whole page crossfades instead of every string popping. A plain
    // setState would swap the text with no animation at all.
    startTransition(() => setLocaleState(next));
    // The cookie is the single source of truth: the root layout reads it and
    // renders the right language on the server, so there is no localStorage
    // copy to keep in sync and no post-mount reconciliation to do.
    document.cookie = `${LOCALE_COOKIE}=${next}; path=/; max-age=${LOCALE_COOKIE_MAX_AGE}; samesite=lax`;
  }, []);

  // The document language has to follow the visible language, not just the
  // text: it drives screen-reader pronunciation, hyphenation and font
  // fallback. Switching the copy without switching this would leave a screen
  // reader announcing English in a Japanese voice.
  useEffect(() => {
    document.documentElement.lang = locale;
    document.documentElement.dataset.locale = locale;
  }, [locale]);

  const value = useMemo<LocaleContextValue>(() => {
    const dict = dictionaries[locale];
    const fallback = dictionaries[DEFAULT_LOCALE];
    return {
      locale,
      setLocale,
      t: (key, vars) => interpolate(dict[key] ?? fallback[key] ?? key, vars),
    };
  }, [locale, setLocale]);

  return (
    <LocaleContext.Provider value={value}>
      {/* Covers two cases with one wrapper: the language swap above, and route
        * navigations — both are Transitions, so both crossfade. Children that
        * want their own behaviour opt out with `default="none"`, which is what
        * the recipe image morph does. */}
      <ViewTransition default="auto">{children}</ViewTransition>
    </LocaleContext.Provider>
  );
}

function useLocaleContext() {
  const ctx = useContext(LocaleContext);
  if (!ctx) throw new Error("useLocale must be used inside <LocaleProvider>");
  return ctx;
}

/** Full context — locale, setter and translator. */
export const useLocale = useLocaleContext;

/** Just the translator, for the common case. */
export function useT() {
  return useLocaleContext().t;
}

export type { TranslationKey };
