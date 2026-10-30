import { cookies } from "next/headers";
import { DEFAULT_LOCALE, isLocale, LOCALE_COOKIE, type Locale } from "./config";
import { translate, type MessageKey } from "./messages";

export async function getLocale(): Promise<Locale> {
  const store = await cookies();
  const value = store.get(LOCALE_COOKIE)?.value;
  return isLocale(value) ? value : DEFAULT_LOCALE;
}

export async function getI18n(): Promise<{
  locale: Locale;
  t: (key: MessageKey, vars?: Record<string, string | number>) => string;
}> {
  const locale = await getLocale();
  return {
    locale,
    t: (key, vars) => translate(locale, key, vars),
  };
}
