import {
  ArrowLeft,
  CalendarDays,
  Mail,
  Phone,
  ShieldCheck,
  Tag,
} from "lucide-react";
import { DateTime } from "luxon";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { AllergyForm } from "@/components/patients/allergy-form";
import { PatientEditButton } from "@/components/patients/patient-edit-dialog";
import { PatientHeader } from "@/components/patients/patient-header";
import { FlashToast } from "@/components/ui/flash-toast";
import { EmptyState } from "@/components/empty-state";
import { StatusBadge } from "@/components/status-badge";
import { api, ApiError } from "@/lib/api";
import { formatDate, formatTime, todayIn } from "@/lib/dates";
import { getI18n } from "@/i18n/server";
import { getSession } from "@/lib/session";
import type {
  Appointment,
  HouseholdDetail,
  PatientDetail,
} from "@/lib/types";

const SEVERITY_LABEL: Record<string, string> = {
  mild: "Leve",
  moderate: "Moderada",
  severe: "Severa",
  anaphylaxis: "Anafilaxia",
};

export default async function PatientPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ created?: string }>;
}) {
  const session = await getSession();
  if (!session) redirect("/login");

  const { id } = await params;
  const { t, locale } = await getI18n();
  const { created } = await searchParams;
  const { token, clinic, user } = session;

  let patient: PatientDetail;
  try {
    patient = await api<PatientDetail>(`/api/v1/patients/${id}`, { token });
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) notFound();
    throw error;
  }

  const from = DateTime.now().minus({ years: 2 }).toUTC().toISO() ?? "";
  const to = DateTime.now().plus({ years: 1 }).toUTC().toISO() ?? "";

  const [appointments, household] = await Promise.all([
    api<Appointment[]>(
      `/api/v1/appointments?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}&patientId=${patient.id}`,
      { token },
    ),
    patient.householdId
      ? api<HouseholdDetail>(`/api/v1/households/${patient.householdId}`, {
          token,
        })
      : Promise.resolve(null),
  ]);

  const canClinical = user.role === "admin" || user.role === "practitioner";
  const canEditPatient =
    user.role === "admin" || user.role === "receptionist";
  const upcoming = [...appointments].sort(
    (a, b) => new Date(b.startsAt).getTime() - new Date(a.startsAt).getTime(),
  );

  return (
    <div className="space-y-6">
      {created === "1" ? (
        <FlashToast
          message={t("patients.createdToast")}
          cleanPath={`/pacientes/${patient.id}`}
        />
      ) : null}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link
          href="/pacientes"
          className="focus-ring inline-flex items-center gap-2 rounded-lg px-2 py-1 text-sm font-medium text-muted hover:text-ink"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden />
          {t("nav.patients")}
        </Link>
        <div className="flex flex-wrap items-center gap-2">
          <PatientEditButton patient={patient} canEdit={canEditPatient} />
          <Link
            href={`/agenda?patientId=${patient.id}&date=${todayIn(clinic.timezone)}`}
            className="focus-ring inline-flex items-center gap-2 rounded-xl bg-brand-700 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-brand-800"
          >
            <CalendarDays className="h-4 w-4" aria-hidden />
            {t("agenda.bookTitle")}
          </Link>
        </div>
      </div>

      <PatientHeader patient={patient} />

      <div className="grid gap-6 xl:grid-cols-[1.5fr_1fr]">
        <div className="space-y-6">
          <section className="card overflow-hidden">
            <div className="flex items-center justify-between border-b border-line px-5 py-4">
              <h2 className="font-semibold">{t("patients.appointments")}</h2>
              <span className="text-xs text-muted">
                {appointments.length} registradas
              </span>
            </div>
            {upcoming.length === 0 ? (
              <EmptyState
                icon={CalendarDays}
                title={t("patients.noAppointments")}
                description={t("patients.noAppointmentsHint")}
              />
            ) : (
              <ul className="divide-y divide-line">
                {upcoming.slice(0, 12).map((appointment) => (
                  <li
                    key={appointment.id}
                    className="flex flex-wrap items-center justify-between gap-3 px-5 py-3"
                  >
                    <div>
                      <p className="text-sm font-medium">
                        {formatDate(appointment.startsAt, clinic.timezone)} ·{" "}
                        {formatTime(appointment.startsAt, clinic.timezone)}
                      </p>
                      <p className="text-xs text-muted">
                        {appointment.serviceNameSnapshot ?? t("sala.consultation")} ·{" "}
                        {appointment.practitionerName}
                      </p>
                    </div>
                    <StatusBadge status={appointment.status} />
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section className="card overflow-hidden">
            <div className="flex items-center justify-between border-b border-line px-5 py-4">
              <h2 className="font-semibold">{t("patients.allergies")}</h2>
              <span className="text-xs text-muted">
                {patient.allergies.length} activas
              </span>
            </div>

            <div className="space-y-3 p-5">
              {patient.allergies.length === 0 ? (
                <p className="text-sm text-muted">{t("patients.noAllergies")}</p>
              ) : (
                <ul className="space-y-2">
                  {patient.allergies.map((allergy) => (
                    <li
                      key={allergy.id}
                      className={`rounded-xl border px-3 py-2 ${
                        allergy.severity === "severe" ||
                        allergy.severity === "anaphylaxis"
                          ? "border-rose-200 bg-rose-50"
                          : "border-line bg-canvas"
                      }`}
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <p className="text-sm font-semibold">{allergy.allergen}</p>
                        <span className="text-xs font-medium">
                          {SEVERITY_LABEL[allergy.severity] ?? allergy.severity}
                        </span>
                      </div>
                      {allergy.reaction ? (
                        <p className="mt-1 text-xs text-muted">
                          Reaccion: {allergy.reaction}
                        </p>
                      ) : null}
                    </li>
                  ))}
                </ul>
              )}

              {canClinical ? <AllergyForm patientId={patient.id} /> : null}
            </div>
          </section>

          <section className="card overflow-hidden">
            <div className="border-b border-line px-5 py-4">
              <h2 className="font-semibold">{t("patients.tags")}</h2>
            </div>
            <div className="flex flex-wrap gap-2 p-5">
              {patient.tags.length === 0 ? (
                <p className="text-sm text-muted">{t("patients.noTagsAssigned")}</p>
              ) : (
                patient.tags.map((tag) => (
                  <span
                    key={tag.id}
                    className="inline-flex items-center gap-1 rounded-full bg-brand-50 px-2.5 py-1 text-xs font-medium text-brand-800 ring-1 ring-inset ring-brand-200"
                  >
                    <Tag className="h-3 w-3" aria-hidden />
                    {tag.label}
                  </span>
                ))
              )}
            </div>
          </section>
        </div>

        <div className="space-y-6">
          <section className="card p-5">
            <h2 className="font-semibold">{t("patients.data")}</h2>
            <dl className="mt-3 space-y-2 text-sm">
              <div className="flex justify-between gap-3">
                <dt className="text-muted">{t("patients.document")}</dt>
                <dd>{patient.documentMasked ?? "—"}</dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="text-muted">{t("patients.tableBirth")}</dt>
                <dd>{patient.birthDate ?? "—"}</dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="text-muted">{t("patients.language")}</dt>
                <dd>{patient.preferredLanguage}</dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="text-muted">{t("patients.source")}</dt>
                <dd>{patient.source ?? "—"}</dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="text-muted">{t("patients.lastVisitShort")}</dt>
                <dd>
                  {patient.lastVisitAt
                    ? new Date(patient.lastVisitAt).toLocaleDateString(
                        locale === "en" ? "en-US" : "es-MX",
                      )
                    : "—"}
                </dd>
              </div>
            </dl>
          </section>

          <section className="card p-5">
            <h2 className="font-semibold">{t("patients.contact")}</h2>
            <ul className="mt-3 space-y-2 text-sm">
              {patient.contacts.length === 0 ? (
                <li className="text-muted">{t("patients.noContacts")}</li>
              ) : (
                patient.contacts.map((contact) => (
                  <li key={contact.id} className="flex items-center gap-2">
                    {contact.kind === "phone" ? (
                      <Phone className="h-3.5 w-3.5 text-muted" aria-hidden />
                    ) : (
                      <Mail className="h-3.5 w-3.5 text-muted" aria-hidden />
                    )}
                    <span>{contact.valueMasked}</span>
                    {contact.isPrimary ? (
                      <span className="rounded-full bg-brand-50 px-1.5 py-0.5 text-[10px] font-medium text-brand-800">
                        Principal
                      </span>
                    ) : null}
                  </li>
                ))
              )}
            </ul>
          </section>

          <section className="card p-5">
            <h2 className="font-semibold">{t("patients.family")}</h2>
            {household ? (
              <div className="mt-3 space-y-2 text-sm">
                <p className="font-medium">{household.name}</p>
                <ul className="space-y-1 text-muted">
                  {household.members.map((member) => (
                    <li key={member.id}>
                      {member.id === patient.id ? (
                        <span className="font-medium text-ink">
                          {member.firstName} {member.lastName} (titular)
                        </span>
                      ) : (
                        <Link
                          href={`/pacientes/${member.id}`}
                          className="focus-ring hover:text-ink hover:underline"
                        >
                          {member.firstName} {member.lastName}
                        </Link>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            ) : (
              <p className="mt-3 text-sm text-muted">{t("patients.noFamily")}</p>
            )}
          </section>

          <section className="card p-5">
            <h2 className="font-semibold">{t("patients.guardians")}</h2>
            {patient.guardians.length === 0 ? (
              <p className="mt-3 text-sm text-muted">{t("patients.noGuardians")}</p>
            ) : (
              <ul className="mt-3 space-y-2 text-sm">
                {patient.guardians.map((guardian) => (
                  <li key={guardian.id}>
                    <p className="font-medium">{guardian.name ?? "Tutor"}</p>
                    <p className="text-xs text-muted">
                      {guardian.relationship}
                      {guardian.isLegalGuardian ? " · tutor legal" : ""}
                      {guardian.phoneMasked ? ` · ${guardian.phoneMasked}` : ""}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section className="card p-5">
            <h2 className="flex items-center gap-2 font-semibold">
              <ShieldCheck className="h-4 w-4 text-brand-700" aria-hidden />
              Recordatorios
            </h2>
            <p className="mt-2 text-sm text-muted">
              {patient.reminderOptOut
                ? "El paciente pidio no recibir recordatorios."
                : "Recordatorios transaccionales activos."}
            </p>
            <p className="mt-1 text-xs text-muted">
              Marketing: {patient.marketingOptIn ? "autorizado" : "no autorizado"}.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
