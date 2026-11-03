import {
  AlertTriangle,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  FileText,
  Stethoscope,
} from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { EmptyState } from "@/components/empty-state";
import { SpecialistPreferences } from "@/components/specialist/specialist-preferences";
import { AppointmentManageButtons } from "@/components/agenda/appointment-management";
import { PractitionerDayActions } from "@/components/practitioners/practitioner-day-actions";
import { CheckoutButton } from "@/components/payments/checkout-dialog";
import { SpecialistDayFilters } from "@/components/specialist/specialist-day-filters";
import { SpecialistProfileForm } from "@/components/specialist/specialist-profile-form";
import { StatusBadge } from "@/components/status-badge";
import { api } from "@/lib/api";
import {
  dayRange,
  formatDate,
  formatTime,
  isValidDate,
  shiftDate,
  todayIn,
} from "@/lib/dates";
import { ageFromBirthDate } from "@/lib/format";
import { getI18n } from "@/i18n/server";
import { getSession } from "@/lib/session";
import type { Appointment, PatientDetail } from "@/lib/types";

const ACTIVE_STATUSES = ["requested", "confirmed", "arrived", "in_consultation"];

const STATUS_FILTER_VALUES = [
  "",
  "requested",
  "confirmed",
  "arrived",
  "in_consultation",
  "completed",
  "cancelled",
  "no_show",
] as const;

const STATUS_FILTER_KEYS = {
  "": "specialist.allAppointments",
  requested: "specialist.requested",
  confirmed: "specialist.confirmed",
  arrived: "specialist.arrived",
  in_consultation: "specialist.inConsultation",
  completed: "specialist.completed",
  cancelled: "specialist.cancelled",
  no_show: "specialist.noShow",
} as const;

export default async function MyDayPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string; date?: string; status?: string }>;
}) {
  const session = await getSession();
  if (!session) redirect("/login");
  if (session.user.role !== "practitioner") redirect("/");
  const { t } = await getI18n();
  if (!session.user.practitionerId) {
    return (
      <div className="card">
        <EmptyState
          icon={Stethoscope}
          title={t("specialist.noProfileTitle")}
          description={t("specialist.noProfileHint")}
        />
      </div>
    );
  }

  const params = await searchParams;
  if (params.tab === "perfil") {
    return (
      <div className="space-y-5">
        <header>
          <p className="flex items-center gap-2 text-sm text-muted">
            <Stethoscope className="h-4 w-4" aria-hidden />
            {t("specialist.profileTitle")}
          </p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight">
            {t("specialist.profileHeading")}
          </h1>
          <p className="mt-1 text-sm text-muted">
            {t("specialist.profileHint")}
          </p>
        </header>
        <SpecialistProfileForm user={session.user} />
        <SpecialistPreferences />
      </div>
    );
  }

  const { token, clinic, user } = session;
  const today = todayIn(clinic.timezone);
  const date = isValidDate(params.date) ? params.date : today;
  const statusFilter = STATUS_FILTER_VALUES.includes(
    (params.status ?? "") as (typeof STATUS_FILTER_VALUES)[number],
  )
    ? (params.status ?? "")
    : "";
  const previous = shiftDate(date, -1, clinic.timezone);
  const next = shiftDate(date, 1, clinic.timezone);

  function dayHref(nextDate: string): string {
    const query = new URLSearchParams({ date: nextDate });
    if (statusFilter) query.set("status", statusFilter);
    return `/mi-dia?${query.toString()}`;
  }

  const { from, to } = dayRange(date, clinic.timezone);
  const appointments = await api<Appointment[]>(
    `/api/v1/appointments?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}`,
    { token },
  );

  const patientIds = [...new Set(appointments.map((item) => item.patientId))];
  const patientRows = await Promise.all(
    patientIds.map(async (id) => {
      try {
        return await api<PatientDetail>(`/api/v1/patients/${id}`, { token });
      } catch {
        return null;
      }
    }),
  );
  const patients = new Map(
    patientRows
      .filter((patient): patient is PatientDetail => Boolean(patient))
      .map((patient) => [patient.id, patient]),
  );

  const sorted = [...appointments].sort(
    (a, b) => new Date(a.startsAt).getTime() - new Date(b.startsAt).getTime(),
  );
  const visible = statusFilter
    ? sorted.filter((appointment) => appointment.status === statusFilter)
    : sorted;

  const criticalAllergies = patientRows
    .filter((patient): patient is PatientDetail => Boolean(patient))
    .filter((patient) =>
      appointments.some(
        (appointment) =>
          appointment.patientId === patient.id &&
          ACTIVE_STATUSES.includes(appointment.status),
      ),
    )
    .flatMap((patient) =>
      patient.allergies
        .filter(
          (allergy) =>
            allergy.severity === "severe" || allergy.severity === "anaphylaxis",
        )
        .map((allergy) => ({
          patientId: patient.id,
          patientName: `${patient.firstName} ${patient.lastName}`,
          allergen: allergy.allergen,
        })),
    );

  const firstName = user.fullName.split(" ")[0] ?? user.fullName;
  const isToday = date === today;

  return (
    <div className="space-y-5">
      <header>
        <p className="flex items-center gap-2 text-sm text-muted">
          <Stethoscope className="h-4 w-4" aria-hidden />{t("specialist.myDay")}</p>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight">
          {t("specialist.hello", { name: firstName })}
        </h1>
        <p className="mt-1 text-sm capitalize text-muted">
          {formatDate(date, clinic.timezone)} · {t("specialist.onlyMine")}
        </p>
      </header>

      <section className="card p-3">
        <div className="flex flex-wrap items-center gap-2">
          <Link
            href={dayHref(previous)}
            aria-label={t("agenda.previousDay")}
            className="focus-ring inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-line bg-surface text-muted hover:text-ink"
          >
            <ChevronLeft className="h-4 w-4" aria-hidden />
          </Link>

          <SpecialistDayFilters
            date={date}
            status={statusFilter}
            options={STATUS_FILTER_VALUES.map((value) => ({
              value,
              label: t(STATUS_FILTER_KEYS[value]),
            }))}
          />

          <Link
            href={dayHref(next)}
            aria-label={t("agenda.nextDay")}
            className="focus-ring inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-line bg-surface text-muted hover:text-ink"
          >
            <ChevronRight className="h-4 w-4" aria-hidden />
          </Link>
        </div>

        {!isToday ? (
          <Link
            href={dayHref(today)}
            className="focus-ring mt-2 inline-flex items-center gap-1 text-xs font-medium text-brand-700 hover:underline"
          >
            <CalendarDays className="h-3.5 w-3.5" aria-hidden />
            {t("specialist.backToday")}
          </Link>
        ) : null}
      </section>

      {criticalAllergies.length > 0 ? (
        <div
          role="alert"
          className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-rose-800"
        >
          <div className="flex items-start gap-3">
            <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0" aria-hidden />
            <div>
              <p className="text-sm font-semibold">{t("patients.criticalAllergies")}</p>
              <ul className="mt-1 space-y-0.5 text-sm">
                {criticalAllergies.map((allergy) => (
                  <li key={`${allergy.patientId}:${allergy.allergen}`}>
                    {allergy.patientName}: {allergy.allergen}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      ) : null}

      <section className="card overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-line px-4 py-3.5">
          <div>
            <h2 className="font-semibold">
              {isToday ? t("specialist.appointmentsToday") : t("specialist.appointmentsDay")}
            </h2>
            <p className="text-xs text-muted">
              {statusFilter
                ? t("specialist.appointmentCountFiltered", { count: visible.length })
                : t("specialist.appointmentCount", { count: visible.length })}
            </p>
          </div>
          <span className="text-xs text-muted">{clinic.timezone}</span>
        </div>

        {visible.length === 0 ? (
          <EmptyState
            icon={CalendarDays}
            title={
              isToday ? t("specialist.emptyToday") : t("specialist.emptyDay")
            }
            description={
              statusFilter
                ? t("specialist.emptyFilterHint")
                : t("specialist.emptyHint")
            }
          />
        ) : (
          <ul className="divide-y divide-line">
            {visible.map((appointment) => {
              const patient = patients.get(appointment.patientId);
              const age = ageFromBirthDate(patient?.birthDate ?? null);
              const critical = patient?.allergies.some(
                (allergy) =>
                  allergy.severity === "severe" ||
                  allergy.severity === "anaphylaxis",
              );

              return (
                <li key={appointment.id} className="px-4 py-4">
                  <div className="flex items-start gap-3">
                    <div className="w-14 shrink-0 text-sm font-semibold tabular-nums">
                      {formatTime(appointment.startsAt, clinic.timezone)}
                      <span className="block text-[10px] font-normal text-muted">
                        {appointment.durationMinutesSnapshot ?? 30} min
                      </span>
                    </div>

                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold">
                        {appointment.patientFirstName}{" "}
                        {appointment.patientLastName}
                        {age !== null ? (
                          <span className="ml-1.5 text-xs font-normal text-muted">
                            {t("patients.years", { age })}
                          </span>
                        ) : null}
                      </p>
                      <p className="mt-0.5 truncate text-xs text-muted">
                        {appointment.serviceNameSnapshot ?? t("sala.consultation")}
                        {appointment.isOverbooking
                          ? ` · ${t("specialist.overbooking")}`
                          : ""}
                      </p>

                      <div className="mt-2 flex flex-wrap items-center gap-1.5">
                        <StatusBadge status={appointment.status} />
                        {critical ? (
                          <span className="inline-flex items-center gap-1 rounded-full bg-rose-50 px-2 py-0.5 text-[10px] font-semibold text-rose-700 ring-1 ring-inset ring-rose-200">
                            <AlertTriangle className="h-3 w-3" aria-hidden />
                            Alergia crítica
                          </span>
                        ) : null}
                      </div>
                    </div>
                  </div>

                  <div className="mt-3 flex flex-wrap items-center gap-2">
                    {patient ? (
                      <Link
                        href={`/pacientes/${appointment.patientId}`}
                        className="focus-ring inline-flex items-center gap-1 rounded-lg border border-line bg-surface px-2.5 py-1.5 text-xs font-medium text-ink hover:bg-canvas"
                      >
                        <FileText className="h-3.5 w-3.5" aria-hidden />
                        {t("specialist.viewRecord")}
                      </Link>
                    ) : null}

                    <PractitionerDayActions
                      appointmentId={appointment.id}
                      status={appointment.status}
                    />
                    <CheckoutButton appointment={appointment} compact />
                    <AppointmentManageButtons
                      appointment={appointment}
                      timezone={clinic.timezone}
                      compact
                    />
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </div>
  );
}
