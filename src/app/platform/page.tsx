import { Building2, CalendarDays, Stethoscope, UsersRound } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { CreateTenantDialog } from "@/components/platform/create-tenant-dialog";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { api } from "@/lib/api";
import { formatDate } from "@/lib/dates";
import { getI18n } from "@/i18n/server";
import { getSession } from "@/lib/session";
import type { TenantSummary } from "@/lib/types";

export default async function PlatformPage() {
  const session = await getSession();
  if (!session) redirect("/login");
  if (session.scope !== "platform") redirect("/");

  const { t } = await getI18n();
  const tenants = await api<TenantSummary[]>("/api/v1/platform/clinics", {
    token: session.token,
  });

  const active = tenants.filter((tenant) => tenant.isActive).length;
  const users = tenants.reduce((total, tenant) => total + tenant.usersCount, 0);
  const patients = tenants.reduce(
    (total, tenant) => total + tenant.patientsCount,
    0,
  );

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm text-muted">{t("platform.panel")}</p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight">{t("platform.title")}</h1>
          <p className="mt-1 text-sm text-muted">{t("platform.subtitle")}</p>
        </div>
        <CreateTenantDialog />
      </header>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label={t("platform.tenants")}
          value={tenants.length}
          hint={`${active} ${t("platform.active").toLowerCase()}`}
          icon={Building2}
        />
        <StatCard
          label={t("platform.users")}
          value={users}
          hint={t("platform.allUsers")}
          icon={UsersRound}
        />
        <StatCard
          label={t("platform.patients")}
          value={patients}
          hint={t("platform.registered")}
          icon={Stethoscope}
        />
        <StatCard
          label={t("platform.appointments")}
          value={tenants.reduce(
            (total, tenant) => total + tenant.appointmentsCount,
            0,
          )}
          hint={t("platform.history")}
          icon={CalendarDays}
        />
      </div>

      <Card>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-canvas text-left text-xs uppercase tracking-wide text-muted">
              <tr>
                <th className="px-5 py-2.5 font-medium">{t("platform.clinic")}</th>
                <th className="px-5 py-2.5 font-medium">{t("platform.timezone")}</th>
                <th className="px-5 py-2.5 font-medium">{t("platform.users")}</th>
                <th className="px-5 py-2.5 font-medium">{t("platform.patients")}</th>
                <th className="px-5 py-2.5 font-medium">{t("platform.appointments")}</th>
                <th className="px-5 py-2.5 font-medium">{t("common.status")}</th>
                <th className="px-5 py-2.5 font-medium">{t("platform.created")}</th>
                <th className="px-5 py-2.5 font-medium" />
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {tenants.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-5 py-10 text-center text-muted">{t("platform.empty")}</td>
                </tr>
              ) : (
                tenants.map((tenant) => (
                  <tr key={tenant.id} className="hover:bg-canvas/60">
                    <td className="px-5 py-3">
                      <Link
                        href={`/platform/tenants/${tenant.id}`}
                        className="focus-ring font-medium text-brand-800 hover:underline"
                      >
                        {tenant.name}
                      </Link>
                    </td>
                    <td className="px-5 py-3 text-muted">{tenant.timezone}</td>
                    <td className="px-5 py-3 tabular-nums">{tenant.usersCount}</td>
                    <td className="px-5 py-3 tabular-nums">
                      {tenant.patientsCount}
                    </td>
                    <td className="px-5 py-3 tabular-nums">
                      {tenant.appointmentsCount}
                    </td>
                    <td className="px-5 py-3">
                      <Badge variant={tenant.isActive ? "success" : "destructive"}>
                        {tenant.isActive ? t("platform.active") : t("platform.suspended")}
                      </Badge>
                    </td>
                    <td className="px-5 py-3 text-muted">
                      {formatDate(
                        tenant.createdAt.slice(0, 10),
                        "America/Mexico_City",
                      )}
                    </td>
                    <td className="px-5 py-3 text-right">
                      <Link
                        href={`/platform/tenants/${tenant.id}`}
                        className="focus-ring rounded-lg px-2 py-1 text-xs font-medium text-brand-700 hover:underline"
                      >
                        {t("platform.manage")}
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}

function StatCard({
  label,
  value,
  hint,
  icon: Icon,
}: {
  label: string;
  value: number;
  hint: string;
  icon: typeof Building2;
}) {
  return (
    <Card>
      <CardContent className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm text-muted">{label}</p>
          <p className="mt-1 text-2xl font-semibold tabular-nums">{value}</p>
          <p className="mt-1 text-xs text-muted">{hint}</p>
        </div>
        <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-50 text-brand-700">
          <Icon className="h-4 w-4" aria-hidden />
        </span>
      </CardContent>
    </Card>
  );
}
