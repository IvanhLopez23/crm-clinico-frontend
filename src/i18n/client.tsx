"use client";

import { createContext, useContext } from "react";
import type { Locale } from "./config";
import { translate, type MessageKey } from "./messages";

type I18nContextValue = {
  locale: Locale;
  t: (key: MessageKey, vars?: Record<string, string | number>) => string;
};

const I18nContext = createContext<I18nContextValue | null>(null);

export function I18nProvider({
  locale,
  children,
}: {
  locale: Locale;
  children: React.ReactNode;
}) {
  return (
    <I18nContext.Provider
      value={{
        locale,
        t: (key, vars) => translate(locale, key, vars),
      }}
    >
      {children}
    </I18nContext.Provider>
  );
}

export function useI18n(): I18nContextValue {
  const context = useContext(I18nContext);
  if (!context) {
    throw new Error("useI18n debe usarse dentro de I18nProvider");
  }
  return context;
}
