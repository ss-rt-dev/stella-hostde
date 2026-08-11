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
  /** ISO 3166-1 alpha-2 für Flaggen-Bild (flagcdn) */
  country: string;
  /** Kurzer Anzeige-Code (DE, JP, …) */
  label: string;
}

/** Sprachen – Flagge als Bild + Ländercode */
export const LOCALES: LocaleInfo[] = [
  { code: "de", name: "German", native: "Deutsch", country: "de", label: "DE" },
  { code: "en", name: "English", native: "English", country: "gb", label: "EN" },
  { code: "fr", name: "French", native: "Français", country: "fr", label: "FR" },
  { code: "es", name: "Spanish", native: "Español", country: "es", label: "ES" },
  { code: "it", name: "Italian", native: "Italiano", country: "it", label: "IT" },
  { code: "pt", name: "Portuguese", native: "Português", country: "pt", label: "PT" },
  { code: "nl", name: "Dutch", native: "Nederlands", country: "nl", label: "NL" },
  { code: "lb", name: "Luxembourgish", native: "Lëtzebuergesch", country: "lu", label: "LU" },
  { code: "pl", name: "Polish", native: "Polski", country: "pl", label: "PL" },
  { code: "ru", name: "Russian", native: "Русский", country: "ru", label: "RU" },
  { code: "tr", name: "Turkish", native: "Türkçe", country: "tr", label: "TR" },
  { code: "uk", name: "Ukrainian", native: "Українська", country: "ua", label: "UA" },
  { code: "cs", name: "Czech", native: "Čeština", country: "cz", label: "CZ" },
  { code: "hu", name: "Hungarian", native: "Magyar", country: "hu", label: "HU" },
  { code: "ro", name: "Romanian", native: "Română", country: "ro", label: "RO" },
  { code: "sv", name: "Swedish", native: "Svenska", country: "se", label: "SE" },
  { code: "da", name: "Danish", native: "Dansk", country: "dk", label: "DK" },
  { code: "fi", name: "Finnish", native: "Suomi", country: "fi", label: "FI" },
  { code: "no", name: "Norwegian", native: "Norsk", country: "no", label: "NO" },
  { code: "el", name: "Greek", native: "Ελληνικά", country: "gr", label: "GR" },
  { code: "ja", name: "Japanese", native: "日本語", country: "jp", label: "JP" },
];

export const DEFAULT_LOCALE: LocaleCode = "de";
export const LOCALE_STORAGE_KEY = "stella-locale";

export function isLocaleCode(v: string): v is LocaleCode {
  return LOCALES.some((l) => l.code === v);
}

export function getLocaleInfo(code: LocaleCode): LocaleInfo {
  return LOCALES.find((l) => l.code === code) || LOCALES[0];
}

/** Flaggen-URL (PNG, funktioniert überall) */
export function flagUrl(country: string, width = 40): string {
  return `https://flagcdn.com/w${width}/${country.toLowerCase()}.png`;
}
