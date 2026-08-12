import {
  DEFAULT_LOCALE,
  LOCALES,
  getLocaleInfo,
  isLocaleCode,
  type LocaleCode,
} from "./locales";

/** Alle erlaubten URL-Prefixe: Ländercode (gb) + Sprachcode (en) */
const PREFIX_TO_LOCALE = new Map<string, LocaleCode>();
for (const l of LOCALES) {
  PREFIX_TO_LOCALE.set(l.country.toLowerCase(), l.code);
  PREFIX_TO_LOCALE.set(l.code.toLowerCase(), l.code);
}

export function isLocalePrefix(segment: string | undefined): boolean {
  if (!segment) return false;
  return PREFIX_TO_LOCALE.has(segment.toLowerCase());
}

export function localeFromPrefix(segment: string): LocaleCode {
  return PREFIX_TO_LOCALE.get(segment.toLowerCase()) || DEFAULT_LOCALE;
}

/** URL-Prefix für eine Sprache: en → gb, de → de, uk → ua */
export function urlPrefixForLocale(code: LocaleCode): string {
  return getLocaleInfo(code).country.toLowerCase();
}

/**
 * Entfernt optionalen Locale-Prefix vom Pfad.
 * /gb/dashboard/support → /dashboard/support
 * /de → /
 */
export function stripLocalePrefix(pathname: string): string {
  const parts = pathname.split("/").filter(Boolean);
  if (parts.length === 0) return "/";
  if (!isLocalePrefix(parts[0])) {
    return pathname.startsWith("/") ? pathname : `/${pathname}`;
  }
  const rest = parts.slice(1);
  return rest.length === 0 ? "/" : `/${rest.join("/")}`;
}

/** Fügt Locale-Prefix hinzu (ersetzt vorhandenen). */
export function withLocalePrefix(pathname: string, code: LocaleCode): string {
  const clean = stripLocalePrefix(pathname);
  const prefix = urlPrefixForLocale(code);
  if (clean === "/") return `/${prefix}`;
  return `/${prefix}${clean}`;
}

/** Locale aus Pfad lesen, sonst null */
export function localeFromPathname(pathname: string): LocaleCode | null {
  const first = pathname.split("/").filter(Boolean)[0];
  if (!first || !isLocalePrefix(first)) return null;
  return localeFromPrefix(first);
}

export function resolveLocaleCode(raw: string | null | undefined): LocaleCode {
  if (!raw) return DEFAULT_LOCALE;
  const lower = raw.toLowerCase();
  if (isLocaleCode(lower)) return lower;
  if (PREFIX_TO_LOCALE.has(lower)) return PREFIX_TO_LOCALE.get(lower)!;
  return DEFAULT_LOCALE;
}
