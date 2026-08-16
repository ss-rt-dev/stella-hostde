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
import {
  localeFromPathname,
  resolveLocaleCode,
  withLocalePrefix,
} from "@/lib/i18n/path";
import { translate, type TranslationKey } from "@/lib/i18n/translations";

type I18nContextValue = {
  locale: LocaleCode;
  setLocale: (code: LocaleCode) => void;
  t: (key: TranslationKey) => string;
  info: LocaleInfo;
  locales: LocaleInfo[];
};

const I18nContext = createContext<I18nContextValue | null>(null);

function readLocale(): LocaleCode {
  if (typeof window === "undefined") return DEFAULT_LOCALE;

  const fromPath = localeFromPathname(window.location.pathname);
  if (fromPath) return fromPath;

  try {
    const raw = localStorage.getItem(LOCALE_STORAGE_KEY);
    if (raw) return resolveLocaleCode(raw);
    const match = document.cookie.match(/(?:^|; )stella-locale=([^;]*)/);
    if (match) return resolveLocaleCode(decodeURIComponent(match[1]));
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
    const initial = readLocale();
    setLocaleState(initial);
    persistLocale(initial);
    setReady(true);
  }, []);

  useEffect(() => {
    if (!ready) return;

    const sync = () => {
      const fromPath = localeFromPathname(window.location.pathname);
      if (fromPath) {
        setLocaleState((prev) => {
          if (prev !== fromPath) {
            persistLocale(fromPath);
            return fromPath;
          }
          return prev;
        });
      }
    };

    sync();
    window.addEventListener("popstate", sync);
    const id = window.setInterval(sync, 400);
    return () => {
      window.removeEventListener("popstate", sync);
      window.clearInterval(id);
    };
  }, [ready]);

  const setLocale = useCallback((code: LocaleCode) => {
    const next = isLocaleCode(code) ? code : resolveLocaleCode(code);
    setLocaleState(next);
    persistLocale(next);
    if (typeof window !== "undefined") {
      const path = withLocalePrefix(window.location.pathname, next);
      const search = window.location.search || "";
      window.location.assign(path + search);
    }
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
