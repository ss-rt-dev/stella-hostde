"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  DEFAULT_LOCALE,
  LOCALE_STORAGE_KEY,
  LOCALES,
  getLocaleInfo,
  isLocaleCode,
  type LocaleCode,
  type LocaleInfo,
} from "@/lib/i18n/locales";
import { translate, type TranslationKey } from "@/lib/i18n/translations";

type I18nContextValue = {
  locale: LocaleCode;
  setLocale: (code: LocaleCode) => void;
  t: (key: TranslationKey) => string;
  info: LocaleInfo;
  locales: LocaleInfo[];
};

const I18nContext = createContext<I18nContextValue | null>(null);

function readStoredLocale(): LocaleCode {
  if (typeof window === "undefined") return DEFAULT_LOCALE;
  try {
    const raw = localStorage.getItem(LOCALE_STORAGE_KEY);
    if (raw && isLocaleCode(raw)) return raw;
    const match = document.cookie.match(/(?:^|; )stella-locale=([^;]*)/);
    if (match && isLocaleCode(decodeURIComponent(match[1]))) {
      return decodeURIComponent(match[1]) as LocaleCode;
    }
  } catch {
    /* ignore */
  }
  return DEFAULT_LOCALE;
}

function persistLocale(code: LocaleCode) {
  try {
    localStorage.setItem(LOCALE_STORAGE_KEY, code);
    document.cookie = `stella-locale=${encodeURIComponent(code)};path=/;max-age=31536000;SameSite=Lax`;
    document.documentElement.lang = code;
  } catch {
    /* ignore */
  }
}

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = useState<LocaleCode>(DEFAULT_LOCALE);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const stored = readStoredLocale();
    setLocaleState(stored);
    persistLocale(stored);
    setReady(true);
  }, []);

  const setLocale = useCallback((code: LocaleCode) => {
    setLocaleState(code);
    persistLocale(code);
  }, []);

  useEffect(() => {
    if (ready) document.documentElement.lang = locale;
  }, [locale, ready]);

  const value = useMemo<I18nContextValue>(
    () => ({
      locale,
      setLocale,
      t: (key) => translate(locale, key),
      info: getLocaleInfo(locale),
      locales: LOCALES,
    }),
    [locale, setLocale]
  );

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n() {
  const ctx = useContext(I18nContext);
  if (!ctx) {
    throw new Error("useI18n must be used within LanguageProvider");
  }
  return ctx;
}

export function useT() {
  const ctx = useContext(I18nContext);
  if (!ctx) {
    return (key: TranslationKey) => translate(DEFAULT_LOCALE, key);
  }
  return ctx.t;
}
