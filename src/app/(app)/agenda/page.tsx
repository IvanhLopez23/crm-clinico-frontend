import { CalendarDays } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { AgendaBoard } from "@/components/agenda/agenda-board";
import { AgendaToolbar } from "@/components/agenda/agenda-toolbar";
import { api } from "@/lib/api";
import {
  dayRange,
  formatDate,
  isValidDate,
  shiftDate,
  todayIn,
} from "@/lib/dates";
import { getI18n } from "@/i18n/server";
import { getSession } from "@/lib/session";
import type {
  Appointment,
  PatientDetail,
  PatientSearchResult,
  Practitioner,
  PractitionerService,
  Service,
} from "@/lib/types";

export default async function AgendaPage({
  searchParams,
}: {
  searchParams: Promise<{ date?: string; patientId?: string; practitionerId?: string }>;
}) {
  const session = await getSession();
  if (!session) redirect("/login");
  if (session.user.role === "practitioner") redirect("/mi-dia");

  const { token, clinic } = session;
  const { t } = await getI18n();
  const params = await searchParams;
  const date = isValidDate(params.date)
    ? params.date
    : todayIn(clinic.timezone);
  const { from, to } = dayRange(date, clinic.timezone);

  const [appointments, practitioners, services, practitionerServices] =
    await Promise.all([
      api<Appointment[]>(
        `/api/v1/appointments?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}`,
        { token },
      ),
      api<Practitioner[]>("/api/v1/practitioners", { token }),
      api<Service[]>("/api/v1/services?active=true", { token }),
      api<PractitionerService[]>(
        "/api/v1/practitioner-services",
        { token },
      ).catch(() => []),
    ]);

  let initialPatient: PatientSearchResult | null = null;
  if (params.patientId) {
    try {
      const patient = await api<PatientDetail>(
        `/api/v1/patients/${params.patientId}`,
        { token },
      );
      const phone = patient.contacts.find(
        (contact) => contact.kind === "phone" && contact.isPrimary,
      );
      const email = patient.contacts.find(
        (contact) => contact.kind === "email" && contact.isPrimary,
      );
      initialPatient = {
        id: patient.id,
        firstName: patient.firstName,
        lastName: patient.lastName,
        preferredName: patient.preferredName,
        birthDate: patient.birthDate,
        status: patient.status,
        householdId: patient.householdId,
        phoneMasked: phone?.valueMasked ?? null,
        emailMasked: email?.valueMasked ?? null,
      };
    } catch {
      // Si el paciente no es visible para el rol, se ignora el prefill.
      initialPatient = null;
    }
  }

  const previous = shiftDate(date, -1, clinic.timezone);
  const next = shiftDate(date, 1, clinic.timezone);
  const filteredPractitioner =
    practitioners.find((item) => item.id === params.practitionerId) ?? null;
  const visibleAppointments = filteredPractitioner
    ? appointments.filter(
        (appointment) => appointment.practitionerId === filteredPractitioner.id,
      )
    : appointments;

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm text-muted">{t("agenda.title")}</p>
          <h1 className="mt-1 text-2xl font-semibold capitalize tracking-tight">
            {formatDate(date, clinic.timezone)}
          </h1>
          <p className="mt-1 text-sm text-muted">
            {filteredPractitioner
              ? t("agenda.filtered", { name: filteredPractitioner.fullName })
              : t("agenda.subtitle")}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <AgendaToolbar
            date={date}
            previous={previous}
            next={next}
            practitioners={practitioners}
            selectedPractitionerId={filteredPractitioner?.id ?? null}
            {...(params.patientId ? { patientId: params.patientId } : {})}
          />

          <Link
            href="/pacientes"
            className="focus-ring inline-flex items-center gap-2 rounded-xl border border-line bg-surface px-3 py-2 text-sm font-medium hover:border-brand-200 hover:text-brand-800"
          >
            <CalendarDays className="h-4 w-4" aria-hidden />
            {t("agenda.patients")}
          </Link>
        </div>
      </header>

      <AgendaBoard
        date={date}
        timezone={clinic.timezone}
        appointments={visibleAppointments}
        practitioners={practitioners}
        services={services}
        practitionerServices={practitionerServices}
        filterPractitionerId={filteredPractitioner?.id ?? null}
        initialPractitionerId={filteredPractitioner?.id ?? null}
        initialPatient={initialPatient}
      />
    </div>
  );
}
