import { ArrowLeft, CalendarDays, ExternalLink, Stethoscope, UsersRound } from "lucide-react";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { TenantSettingsForm } from "@/components/platform/tenant-settings-form";
import { TenantUsersManager } from "@/components/platform/tenant-users-manager";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { api, ApiError } from "@/lib/api";
import { getI18n } from "@/i18n/server";
import { getSession } from "@/lib/session";
import type { TenantDetail } from "@/lib/types";

export default async function TenantPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await getSession();
  if (!session) redirect("/login");
  if (session.scope !== "platform") redirect("/");
  const { t, locale } = await getI18n();

  const { id } = await params;

  let tenant: TenantDetail;
  try {
    tenant = await api<TenantDetail>(`/api/v1/platform/clinics/${id}`, {
      token: session.token,
    });
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) notFound();
    throw error;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link
          href="/platform"
          className="focus-ring inline-flex items-center gap-2 rounded-lg px-2 py-1 text-sm font-medium text-muted hover:text-ink"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden />
          {t("platform.tenants")}
        </Link>
        <div className="flex items-center gap-2">
          <Link
            href={`/reservar/${tenant.slug}`}
            target="_blank"
            className="focus-ring inline-flex items-center gap-1.5 rounded-lg border border-line bg-surface px-3 py-1.5 text-xs font-medium hover:text-brand-800"
          >
            <ExternalLink className="h-3.5 w-3.5" aria-hidden />
            {t("platform.publicPortal")}
          </Link>
          <Badge variant={tenant.isActive ? "success" : "destructive"}>
            {tenant.isActive
              ? t("platform.activeTenant")
              : t("platform.suspendedTenant")}
          </Badge>
        </div>
      </div>

      <header>
        <p className="text-sm text-muted">{t("platform.title")}</p>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight">
          {tenant.name}
        </h1>
        <p className="mt-1 text-sm text-muted">
          {tenant.timezone} · {tenant.currency} · {t("platform.created")}{" "}
          {new Date(tenant.createdAt).toLocaleDateString(
            locale === "en" ? "en-US" : "es-MX",
          )}
        </p>
      </header>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Stat label={t("platform.users")} value={tenant.usersCount} icon={UsersRound} />
        <Stat
          label={t("nav.specialists")}
          value={tenant.practitionersCount}
          icon={Stethoscope}
        />
        <Stat
          label={t("platform.patients")}
          value={tenant.patientsCount}
          icon={UsersRound}
        />
        <Stat
          label={t("platform.appointments")}
          value={tenant.appointmentsCount}
          icon={CalendarDays}
        />
      </div>

      <TenantSettingsForm tenant={tenant} />
      <TenantUsersManager tenant={tenant} />
    </div>
  );
}

function Stat({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value: number;
  icon: typeof UsersRound;
}) {
  return (
    <Card>
      <CardContent className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm text-muted">{label}</p>
          <p className="mt-1 text-2xl font-semibold tabular-nums">{value}</p>
        </div>
        <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-50 text-brand-700">
          <Icon className="h-4 w-4" aria-hidden />
        </span>
      </CardContent>
    </Card>
  );
}
