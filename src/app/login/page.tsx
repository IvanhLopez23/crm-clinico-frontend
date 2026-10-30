import { Activity, CalendarCheck2, ShieldCheck } from "lucide-react";
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { LanguageSwitcher } from "@/components/language-switcher";
import { ThemeToggle } from "@/components/theme-toggle";
import { getI18n } from "@/i18n/server";
import { getSession } from "@/lib/session";
import { LoginForm } from "./login-form";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getI18n();
  return { title: t("login.metaTitle") };
}

const HIGHLIGHTS = [
  {
    icon: CalendarCheck2,
    title: "login.featureAgenda",
    description: "login.featureAgendaText",
  },
  {
    icon: ShieldCheck,
    title: "login.featureData",
    description: "login.featureDataText",
  },
] as const;

export default async function LoginPage() {
  const session = await getSession();
  if (session) redirect(session.scope === "platform" ? "/platform" : "/");
  const { t } = await getI18n();

  return (
    <div className="grid min-h-dvh lg:grid-cols-2">
      <section className="relative hidden overflow-hidden bg-brand-900 p-12 text-white lg:flex lg:flex-col lg:justify-between">
        <div
          className="pointer-events-none absolute inset-0 opacity-30"
          style={{
            backgroundImage:
              "radial-gradient(circle at 20% 20%, #14b8a6 0, transparent 45%), radial-gradient(circle at 80% 70%, #0d9488 0, transparent 40%)",
          }}
          aria-hidden
        />

        <div className="relative flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white/10 ring-1 ring-white/20">
            <Activity className="h-5 w-5" aria-hidden />
          </span>
          <div>
            <p className="text-sm font-semibold tracking-tight">Aurora CRM</p>
            <p className="text-xs text-brand-200">{t("login.brandSubtitle")}</p>
          </div>
        </div>

        <div className="relative max-w-md">
          <h2 className="text-3xl font-semibold leading-tight tracking-tight">
            {t("login.heroTitle")}
          </h2>
          <p className="mt-4 text-sm leading-relaxed text-brand-100">
            {t("login.heroText")}
          </p>

          <div className="mt-10 space-y-5">
            {HIGHLIGHTS.map(({ icon: Icon, title, description }) => (
              <div key={title} className="flex gap-3">
                <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white/10 ring-1 ring-white/15">
                  <Icon className="h-4 w-4" aria-hidden />
                </span>
                <div>
                  <p className="text-sm font-medium">{t(title)}</p>
                  <p className="mt-0.5 text-xs leading-relaxed text-brand-200">
                    {t(description)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <p className="relative text-xs text-brand-300">{t("login.secure")}</p>
      </section>

      <section className="relative flex items-center justify-center px-5 py-12">
        <div className="absolute right-5 top-5 flex items-center gap-2">
          <LanguageSwitcher compact />
          <ThemeToggle />
        </div>
        <div className="w-full max-w-sm">
          <div className="mb-8 flex items-center gap-3 lg:hidden">
            <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-brand-700 text-white">
              <Activity className="h-5 w-5" aria-hidden />
            </span>
            <div>
              <p className="text-sm font-semibold">Aurora CRM</p>
              <p className="text-xs text-muted">{t("login.brandSubtitle")}</p>
            </div>
          </div>

          <h1 className="text-2xl font-semibold tracking-tight">
            {t("login.welcome")}
          </h1>
          <p className="mt-1.5 text-sm text-muted">
            {t("login.subtitle")}
          </p>

          <div className="mt-8">
            <LoginForm />
          </div>

          {process.env.NODE_ENV !== "production" ? (
            <div className="mt-8 rounded-xl border border-line bg-brand-50/60 px-4 py-3 text-xs text-brand-900">
              <p className="font-medium">{t("login.demo")}</p>
              <p className="mt-1 text-brand-800">
                {t("login.demoClinic")}
              </p>
              <p className="mt-1 text-brand-800">
                {t("login.demoPlatform")}
              </p>
            </div>
          ) : null}
        </div>
      </section>
    </div>
  );
}
