import { cookies } from "next/headers";
import { DEFAULT_LOCALE, isLocaleCode, type LocaleCode } from "./locales";
import { translate, type TranslationKey } from "./translations";

export async function getLocale(): Promise<LocaleCode> {
  const jar = await cookies();
  const raw = jar.get("stella-locale")?.value;
  if (raw && isLocaleCode(raw)) return raw;
  return DEFAULT_LOCALE;
}

export async function getServerT() {
  const locale = await getLocale();
  return (key: TranslationKey) => translate(locale, key);
}
