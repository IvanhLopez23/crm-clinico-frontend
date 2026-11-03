import { Activity, LogOut } from "lucide-react";
import { logoutAction } from "@/app/actions/auth";
import { LanguageSwitcher } from "@/components/language-switcher";
import { NotificationBell } from "@/components/notifications/notification-bell";
import { ThemeToggle } from "@/components/theme-toggle";
import { getI18n } from "@/i18n/server";
import { initials } from "@/lib/format";
import type { Clinic, SessionUser } from "@/lib/session";
import type { NotificationsResponse } from "@/lib/types";

export async function AppHeader({
  clinic,
  user,
  initialNotifications,
}: {
  clinic: Clinic;
  user: SessionUser;
  initialNotifications: NotificationsResponse;
}) {
  const { t } = await getI18n();
  const roleLabel =
    user.role === "admin"
      ? t("role.admin")
      : user.role === "practitioner"
        ? t("role.practitioner")
        : user.role === "receptionist"
          ? t("role.receptionist")
          : t("role.platform_admin");
  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between gap-3 border-b border-line bg-surface/95 px-4 backdrop-blur lg:px-8">
      <div className="flex min-w-0 items-center gap-2 lg:hidden">
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-brand-700 text-white">
          <Activity className="h-4 w-4" aria-hidden />
        </span>
        <span className="truncate text-sm font-semibold">{clinic.name}</span>
      </div>

      <div className="hidden min-w-0 lg:block">
        <p className="text-sm font-medium">{t("app.clinicOperations")}</p>
        <p className="truncate text-xs text-muted">{clinic.name}</p>
      </div>

      <div className="flex shrink-0 items-center gap-2">
        <NotificationBell
          initial={initialNotifications}
          timezone={clinic.timezone}
        />
        <LanguageSwitcher compact />
        <ThemeToggle />
        <div className="flex items-center gap-2 rounded-xl border border-line bg-canvas px-2 py-1.5">
          <span className="flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-full bg-brand-100 text-xs font-semibold text-brand-800">
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
          <div className="hidden min-w-0 max-w-44 sm:block">
            <p className="truncate text-sm font-medium leading-tight">
              {user.fullName}
            </p>
            <p className="truncate text-[11px] leading-tight text-muted">
              {roleLabel}
            </p>
          </div>
          <form action={logoutAction}>
            <button
              type="submit"
              aria-label={t("common.logout")}
              title={t("common.logout")}
              className="focus-ring ml-0.5 inline-flex h-7 w-7 items-center justify-center rounded-lg text-muted transition-colors hover:bg-surface hover:text-ink"
            >
              <LogOut className="h-3.5 w-3.5" aria-hidden />
            </button>
          </form>
        </div>
      </div>
    </header>
  );
}
