import { Activity } from "lucide-react";
import Link from "next/link";
import { Suspense } from "react";
import { LanguageSwitcher } from "@/components/language-switcher";
import { ThemeToggle } from "@/components/theme-toggle";
import { SpecialistBottomNav } from "@/components/specialist/specialist-bottom-nav";
import { getI18n } from "@/i18n/server";
import { initials } from "@/lib/format";
import type { Clinic, SessionUser } from "@/lib/session";

export async function SpecialistShell({
  clinic,
  user,
  children,
}: {
  clinic: Clinic;
  user: SessionUser;
  children: React.ReactNode;
}) {
  const { t } = await getI18n();

  return (
    <div className="min-h-dvh bg-canvas">
      <header className="sticky top-0 z-30 border-b border-line bg-surface/95 pt-[env(safe-area-inset-top)] backdrop-blur">
        <div className="mx-auto flex min-h-16 w-full max-w-xl flex-wrap items-center justify-between gap-3 px-4 py-2">
          <div className="flex min-w-0 items-center gap-2">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-brand-700 text-white">
              <Activity className="h-4 w-4" aria-hidden />
            </span>
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold">{clinic.name}</p>
              <p className="text-[11px] text-muted">{t("specialist.portal")}</p>
            </div>
          </div>

          <div className="flex shrink-0 items-center gap-2">
            <LanguageSwitcher compact toggle />
            <ThemeToggle />
            <Link
              href="/mi-dia?tab=perfil"
              aria-label={t("common.profile")}
              className="focus-ring flex items-center gap-2 rounded-full border border-line bg-canvas py-1 pl-1 pr-2.5"
            >
              <span className="flex h-7 w-7 items-center justify-center overflow-hidden rounded-full bg-brand-100 text-[10px] font-semibold text-brand-800">
                {user.avatarData ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={user.avatarData}
                    alt=""
                    className="h-full w-full object-cover"
                  />
                ) : (
                  initials(user.fullName)
                )}
              </span>
              <span className="hidden max-w-24 truncate text-xs font-medium sm:block">
                {user.fullName.split(" ")[0]}
              </span>
            </Link>
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-xl px-4 pb-28 pt-5">{children}</main>

      <Suspense fallback={null}>
        <SpecialistBottomNav />
      </Suspense>
    </div>
  );
}
