import { Activity } from "lucide-react";
import { redirect } from "next/navigation";
import { AppHeader } from "@/components/app-header";
import { AppNav } from "@/components/app-nav";
import { SpecialistShell } from "@/components/specialist/specialist-shell";
import { getI18n } from "@/i18n/server";
import { api } from "@/lib/api";
import { getSession } from "@/lib/session";
import type { NotificationsResponse } from "@/lib/types";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();
  if (!session) redirect("/login");
  if (session.scope === "platform") redirect("/platform");
  const { t } = await getI18n();

  const { user, clinic } = session;

  if (user.role === "practitioner") {
    return (
      <SpecialistShell clinic={clinic} user={user}>
        {children}
      </SpecialistShell>
    );
  }

  const initialNotifications = await api<NotificationsResponse>(
    "/api/v1/notifications",
    { token: session.token },
  ).catch(() => ({ items: [], unreadCount: 0 }));

  return (
    <div className="min-h-dvh lg:grid lg:grid-cols-[264px_1fr]">
      <aside className="hidden border-r border-line bg-surface px-5 py-6 lg:flex lg:flex-col">
        <div className="flex items-center gap-2.5">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-700 text-white">
            <Activity className="h-5 w-5" aria-hidden />
          </span>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold leading-tight">
              {clinic.name}
            </p>
            <p className="text-xs text-muted">{t("app.clinicalCrm")}</p>
          </div>
        </div>

        <div className="mt-8">
          <AppNav role={user.role} />
        </div>

        <p className="mt-auto px-3 text-[11px] leading-relaxed text-muted">
          {t("app.tagline")}
          <br />
          {t("app.tagline2")}
        </p>
      </aside>

      <div className="flex min-h-dvh min-w-0 flex-col">
        <AppHeader
          clinic={clinic}
          user={user}
          initialNotifications={initialNotifications}
        />

        <div className="overflow-x-auto border-b border-line bg-surface px-3 py-2 lg:hidden">
          <AppNav role={user.role} />
        </div>

        <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-6 lg:px-8 lg:py-10">
          {children}
        </main>
      </div>
    </div>
  );
}
