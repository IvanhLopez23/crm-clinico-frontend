export const LOCALES = ["es", "en"] as const;
export type Locale = (typeof LOCALES)[number];
export const DEFAULT_LOCALE: Locale = "es";
export const LOCALE_COOKIE = "crm_locale";

export function isLocale(value: string | undefined | null): value is Locale {
  return value === "es" || value === "en";
}
