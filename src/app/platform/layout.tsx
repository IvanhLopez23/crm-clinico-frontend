import { Activity, Building2, LogOut } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { logoutAction } from "@/app/actions/auth";
import { LanguageSwitcher } from "@/components/language-switcher";
import { ThemeToggle } from "@/components/theme-toggle";
import { getI18n } from "@/i18n/server";
import { getSession } from "@/lib/session";

export default async function PlatformLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();
  const { t } = await getI18n();
  if (!session) redirect("/login");
  if (session.scope !== "platform") redirect("/");

  return (
    <div className="min-h-dvh lg:grid lg:grid-cols-[260px_1fr]">
      <aside className="hidden border-r border-line bg-surface px-5 py-6 lg:flex lg:flex-col">
        <div className="flex items-center gap-2.5">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-700 text-white">
            <Activity className="h-5 w-5" aria-hidden />
          </span>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold leading-tight">
              Aurora SaaS
            </p>
            <p className="text-xs text-muted">{t("platform.adminSubtitle")}</p>
          </div>
        </div>

        <nav aria-label={t("nav.platform")} className="mt-8 space-y-1">
          <Link
            href="/platform"
            className="focus-ring flex items-center gap-2.5 rounded-xl bg-brand-50 px-3 py-2 text-sm font-medium text-brand-800"
          >
            <Building2 className="h-4 w-4" aria-hidden />
            {t("platform.tenants")}
          </Link>
        </nav>

        <div className="mt-auto space-y-3">
          <div className="rounded-xl border border-line bg-canvas px-3 py-2.5">
            <p className="truncate text-sm font-medium">{session.user.fullName}</p>
            <p className="truncate text-xs text-muted">{session.user.email}</p>
          </div>
          <form action={logoutAction}>
            <button
              type="submit"
              className="focus-ring inline-flex w-full items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium text-muted hover:bg-canvas hover:text-ink"
            >
              <LogOut className="h-4 w-4" aria-hidden />
              {t("common.logout")}
            </button>
          </form>
        </div>
      </aside>

      <div className="flex min-h-dvh min-w-0 flex-col">
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between gap-3 border-b border-line bg-surface/95 px-4 backdrop-blur lg:px-8">
          <div className="flex items-center gap-2 lg:hidden">
            <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-brand-700 text-white">
              <Activity className="h-4 w-4" aria-hidden />
            </span>
            <p className="text-sm font-semibold">Aurora SaaS</p>
          </div>
          <div className="hidden lg:block">
            <p className="text-xs text-muted">{t("platform.panel")}</p>
            <p className="text-sm font-semibold">{t("platform.allTenants")}</p>
          </div>
          <div className="flex items-center gap-2">
            <LanguageSwitcher compact />
            <ThemeToggle />
            <form action={logoutAction} className="lg:hidden">
              <button
                type="submit"
                aria-label={t("common.logout")}
              >
                <LogOut className="h-4 w-4" aria-hidden />
              </button>
            </form>
          </div>
        </header>

        <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-6 lg:px-8 lg:py-10">
          {children}
        </main>
      </div>
    </div>
  );
}
