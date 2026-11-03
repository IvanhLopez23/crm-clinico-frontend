"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { setLocaleAction } from "@/app/actions/locale";
import { useI18n } from "@/i18n/client";

const inputClass =
  "focus-ring rounded-xl border border-line bg-surface px-3 py-2 text-sm shadow-sm";

export function SpecialistPreferences() {
  const { locale, t } = useI18n();
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [dark, setDark] = useState(false);

  useEffect(() => {
    setDark(document.documentElement.classList.contains("dark"));
  }, []);

  function changeLocale(next: string) {
    startTransition(async () => {
      await setLocaleAction(next);
      router.refresh();
    });
  }

  function setTheme(next: boolean) {
    document.documentElement.classList.toggle("dark", next);
    document.documentElement.style.colorScheme = next ? "dark" : "light";
    try {
      localStorage.setItem("crm-theme", next ? "dark" : "light");
    } catch {
      // navegacion privada sin storage
    }
    setDark(next);
  }

  return (
    <section className="card p-5">
      <h2 className="font-semibold">{t("common.preferences")}</h2>
      <p className="text-xs text-muted">{t("common.preferencesHint")}</p>

      <div className="mt-4 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-line bg-canvas p-3">
          <div>
            <p className="text-sm font-medium">{t("common.language")}</p>
            <p className="text-xs text-muted">{t("common.languageHint")}</p>
          </div>
          <select
            value={locale}
            onChange={(event) => changeLocale(event.target.value)}
            disabled={pending}
            aria-label={t("common.language")}
            className={inputClass}
          >
            <option value="es">{t("common.spanish")}</option>
            <option value="en">{t("common.english")}</option>
          </select>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-line bg-canvas p-3">
          <div>
            <p className="text-sm font-medium">{t("common.theme")}</p>
            <p className="text-xs text-muted">{t("common.themeHint")}</p>
          </div>
          <div className="inline-flex rounded-xl border border-line bg-surface p-1">
            <button
              type="button"
              onClick={() => setTheme(false)}
              aria-pressed={!dark}
              className={`focus-ring rounded-lg px-3 py-1.5 text-xs font-medium ${
                !dark
                  ? "bg-brand-700 text-white"
                  : "text-muted hover:bg-canvas hover:text-ink"
              }`}
            >
              {t("theme.light")}
            </button>
            <button
              type="button"
              onClick={() => setTheme(true)}
              aria-pressed={dark}
              className={`focus-ring rounded-lg px-3 py-1.5 text-xs font-medium ${
                dark
                  ? "bg-brand-700 text-white"
                  : "text-muted hover:bg-canvas hover:text-ink"
              }`}
            >
              {t("theme.dark")}
            </button>
          </div>
        </div>
      </div>

      {pending ? (
        <p className="mt-3 text-xs text-muted">{t("common.loading")}</p>
      ) : null}
    </section>
  );
}
