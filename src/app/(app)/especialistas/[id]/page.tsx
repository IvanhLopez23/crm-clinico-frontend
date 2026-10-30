import { ArrowLeft, CalendarDays, Stethoscope } from "lucide-react";
import { DateTime } from "luxon";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { AvailabilityEditor } from "@/components/practitioners/availability-editor";
import { PractitionerProfileForm } from "@/components/practitioners/practitioner-profile-form";
import { PractitionerServicesEditor } from "@/components/practitioners/practitioner-services-editor";
import { FlashToast } from "@/components/ui/flash-toast";
import { api } from "@/lib/api";
import { todayIn } from "@/lib/dates";
import { getI18n } from "@/i18n/server";
import { getSession } from "@/lib/session";
import type {
  AvailabilityRule,
  Practitioner,
  PractitionerService,
  ScheduleBlock,
} from "@/lib/types";

export default async function PractitionerPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ created?: string }>;
}) {
  const session = await getSession();
  if (!session) redirect("/login");
  if (session.user.role === "practitioner") redirect("/mi-dia");

  const { id } = await params;
  const { created } = await searchParams;
  const { token, clinic, user } = session;

  const practitioners = await api<Practitioner[]>(
    "/api/v1/practitioners?includeInactive=true",
    { token },
  );
  const practitioner = practitioners.find((item) => item.id === id);
  if (!practitioner) notFound();

  const from = DateTime.now().minus({ days: 30 }).toUTC().toISO() ?? "";
  const to = DateTime.now().plus({ days: 90 }).toUTC().toISO() ?? "";

  const [rules, blocks, practitionerServices] = await Promise.all([
    api<AvailabilityRule[]>(
      `/api/v1/availability/rules?practitionerId=${practitioner.id}`,
      { token },
    ),
    api<ScheduleBlock[]>(
      `/api/v1/availability/blocks?practitionerId=${practitioner.id}` +
        `&from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}`,
      { token },
    ),
    api<PractitionerService[]>(
      `/api/v1/practitioner-services?practitionerId=${practitioner.id}`,
      { token },
    ).catch(() => []),
  ]);

  const canEdit = user.role === "admin";
  const { t } = await getI18n();

  return (
    <div className="space-y-6">
      {created === "1" ? (
        <FlashToast
          message={t("practitioners.createdToast")}
          cleanPath={`/especialistas/${practitioner.id}`}
        />
      ) : null}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link
          href="/especialistas"
          className="focus-ring inline-flex items-center gap-2 rounded-lg px-2 py-1 text-sm font-medium text-muted hover:text-ink"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden />
          {t("nav.specialists")}
        </Link>
        <Link
          href="/agenda"
          className="focus-ring inline-flex items-center gap-2 rounded-xl border border-line bg-surface px-3 py-2 text-sm font-medium hover:border-brand-200 hover:text-brand-800"
        >
          <CalendarDays className="h-4 w-4" aria-hidden />
          Ver agenda
        </Link>
      </div>

      <header className="card flex flex-wrap items-start justify-between gap-4 p-5">
        <div className="flex items-start gap-4">
          <span
            className="flex h-12 w-12 items-center justify-center rounded-2xl text-white"
            style={{ backgroundColor: practitioner.color ?? "#0F766E" }}
          >
            <Stethoscope className="h-5 w-5" aria-hidden />
          </span>
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">
              {practitioner.fullName}
            </h1>
            <p className="mt-1 text-sm text-muted">
              {practitioner.specialty ?? t("practitioners.general")} ·{" "}
              {t("practitioners.scheduleSummary", {
                slot: practitioner.defaultSlotMinutes ?? 30,
                buffer: practitioner.bufferAfterMinutes ?? 5,
              })}
            </p>
            <p className="mt-2 text-xs text-muted">
              {practitioner.isActive !== false
                ? t("users.active")
                : t("users.inactive")}{" "}
              ·{" "}
              {practitioner.isAcceptingNewPatients !== false
                ? t("practitioners.acceptingNew")
                : t("practitioners.notAcceptingNew")}
            </p>
          </div>
        </div>
      </header>

      {canEdit ? (
        <PractitionerProfileForm practitioner={practitioner} />
      ) : (
        <p className="rounded-xl border border-line bg-surface px-4 py-3 text-sm text-muted">
          Solo administración puede editar el perfil y la disponibilidad.
        </p>
      )}

      <PractitionerServicesEditor
        practitionerId={practitioner.id}
        assignments={practitionerServices}
        canEdit={canEdit}
      />

      <AvailabilityEditor
        practitionerId={practitioner.id}
        rules={rules}
        blocks={blocks}
        timezone={clinic.timezone}
        today={todayIn(clinic.timezone)}
        canEdit={canEdit}
      />
    </div>
  );
}
