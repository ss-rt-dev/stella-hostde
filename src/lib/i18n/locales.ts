export type LocaleCode =
  | "de"
  | "en"
  | "fr"
  | "es"
  | "it"
  | "pt"
  | "nl"
  | "pl"
  | "ru"
  | "tr"
  | "uk"
  | "cs"
  | "hu"
  | "ro"
  | "sv"
  | "da"
  | "fi"
  | "no"
  | "el"
  | "ja"
  | "lb";

export interface LocaleInfo {
  code: LocaleCode;
  name: string;
  native: string;
  flag: string;
}

/** Sprachen – Anzeige mit Flagge + Eigenname */
export const LOCALES: LocaleInfo[] = [
  { code: "de", name: "German", native: "Deutsch", flag: "🇩🇪" },
  { code: "en", name: "English", native: "English", flag: "🇬🇧" },
  { code: "fr", name: "French", native: "Français", flag: "🇫🇷" },
  { code: "es", name: "Spanish", native: "Español", flag: "🇪🇸" },
  { code: "it", name: "Italian", native: "Italiano", flag: "🇮🇹" },
  { code: "pt", name: "Portuguese", native: "Português", flag: "🇵🇹" },
  { code: "nl", name: "Dutch", native: "Nederlands", flag: "🇳🇱" },
  { code: "lb", name: "Luxembourgish", native: "Lëtzebuergesch", flag: "🇱🇺" },
  { code: "pl", name: "Polish", native: "Polski", flag: "🇵🇱" },
  { code: "ru", name: "Russian", native: "Русский", flag: "🇷🇺" },
  { code: "tr", name: "Turkish", native: "Türkçe", flag: "🇹🇷" },
  { code: "uk", name: "Ukrainian", native: "Українська", flag: "🇺🇦" },
  { code: "cs", name: "Czech", native: "Čeština", flag: "🇨🇿" },
  { code: "hu", name: "Hungarian", native: "Magyar", flag: "🇭🇺" },
  { code: "ro", name: "Romanian", native: "Română", flag: "🇷🇴" },
  { code: "sv", name: "Swedish", native: "Svenska", flag: "🇸🇪" },
  { code: "da", name: "Danish", native: "Dansk", flag: "🇩🇰" },
  { code: "fi", name: "Finnish", native: "Suomi", flag: "🇫🇮" },
  { code: "no", name: "Norwegian", native: "Norsk", flag: "🇳🇴" },
  { code: "el", name: "Greek", native: "Ελληνικά", flag: "🇬🇷" },
  { code: "ja", name: "Japanese", native: "日本語", flag: "🇯🇵" },
];

export const DEFAULT_LOCALE: LocaleCode = "de";
export const LOCALE_STORAGE_KEY = "stella-locale";

export function isLocaleCode(v: string): v is LocaleCode {
  return LOCALES.some((l) => l.code === v);
}

export function getLocaleInfo(code: LocaleCode): LocaleInfo {
  return LOCALES.find((l) => l.code === code) || LOCALES[0];
}
