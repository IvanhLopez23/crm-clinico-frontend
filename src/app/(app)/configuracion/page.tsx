import { Settings, ShieldCheck } from "lucide-react";
import { redirect } from "next/navigation";
import { UsersManager } from "@/components/users/users-manager";
import { EmptyState } from "@/components/empty-state";
import { api } from "@/lib/api";
import { getI18n } from "@/i18n/server";
import { getSession } from "@/lib/session";
import type { Practitioner, SystemUser } from "@/lib/types";

export default async function SettingsPage() {
  const session = await getSession();
  if (!session) redirect("/login");
  if (session.user.role === "practitioner") redirect("/mi-dia");
  const { t } = await getI18n();

  if (session.user.role !== "admin") {
    return (
      <div className="card">
        <EmptyState
          icon={ShieldCheck}
          title={t("users.adminOnlyTitle")}
          description={t("users.adminOnlyHint")}
        />
      </div>
    );
  }

  const [users, practitioners] = await Promise.all([
    api<SystemUser[]>("/api/v1/users", { token: session.token }),
    api<Practitioner[]>("/api/v1/practitioners?includeInactive=true", {
      token: session.token,
    }),
  ]);

  return (
    <div className="space-y-6">
      <header>
        <p className="flex items-center gap-2 text-sm text-muted">
          <Settings className="h-4 w-4" aria-hidden />
          {t("nav.settings")}
        </p>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight">
          {t("users.systemTitle")}
        </h1>
        <p className="mt-1 text-sm text-muted">
          {t("users.systemHint")}
        </p>
      </header>

      <UsersManager
        users={users}
        practitioners={practitioners.filter(
          (practitioner) => practitioner.isActive !== false,
        )}
        currentUserId={session.user.userId}
      />
    </div>
  );
}
