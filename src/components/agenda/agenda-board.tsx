"use client";

import {
  CalendarPlus,
  Check,
  ChevronRight,
  Clock3,
  LoaderCircle,
  Search,
  UserPlus,
  X,
} from "lucide-react";
import { DateTime } from "luxon";
import { useEffect, useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { StatusBadge } from "@/components/status-badge";
import { AppointmentManageButtons } from "@/components/agenda/appointment-management";
import { CheckoutButton } from "@/components/payments/checkout-dialog";
import {
  bookAppointmentAction,
  getAvailabilityAction,
  transitionAppointmentAction,
  type AppointmentAction,
} from "@/app/actions/appointments";
import {
  createPatientQuickAction,
  searchPatientsAction,
} from "@/app/actions/patients";
import { formatTime } from "@/lib/dates";
import { money } from "@/lib/format";
import { useRealtimeRefresh } from "@/lib/use-realtime-refresh";
import { useToast } from "@/components/ui/toast-provider";
import { DatePicker } from "@/components/ui/date-picker";
import { useI18n } from "@/i18n/client";
import { servicesForPractitioner } from "@/lib/practitioner-services";
import type {
  Appointment,
  AvailabilitySlot,
  PatientSearchResult,
  Practitioner,
  PractitionerService,
  Service,
} from "@/lib/types";

const ROW_MINUTES = 30;
const ROW_HEIGHT = 52;

type Props = {
  date: string;
  timezone: string;
  appointments: Appointment[];
  practitioners: Practitioner[];
  services: Service[];
  practitionerServices: PractitionerService[];
  initialPatient?: PatientSearchResult | null;
  filterPractitionerId?: string | null;
  initialPractitionerId?: string | null;
};

export function AgendaBoard({
  date,
  timezone,
  appointments,
  practitioners,
  services,
  practitionerServices,
  initialPatient = null,
  filterPractitionerId = null,
  initialPractitionerId = null,
}: Props) {
  const { t } = useI18n();
  const [selected, setSelected] = useState<Appointment | null>(null);
  const [newOpen, setNewOpen] = useState(false);
  useRealtimeRefresh(["agenda"]);

  const { startMinute, endMinute } = useMemo(() => {
    const hours = appointments.map((appointment) =>
      DateTime.fromISO(appointment.startsAt, { zone: timezone }).hour,
    );
    const start = Math.max(0, Math.min(8, ...hours));
    const end = Math.min(24, Math.max(19, ...hours.map((hour) => hour + 1)));
    return { startMinute: start * 60, endMinute: end * 60 };
  }, [appointments, timezone]);

  const rows = Math.max(1, Math.ceil((endMinute - startMinute) / ROW_MINUTES));
  const columns = filterPractitionerId
    ? practitioners.filter((item) => item.id === filterPractitionerId)
    : practitioners;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-sm text-muted">
          <Clock3 className="h-4 w-4" aria-hidden />
          {t("agenda.appointments", { count: appointments.length })} · {timezone}
        </div>
        <button
          type="button"
          onClick={() => setNewOpen(true)}
          disabled={services.length === 0 || practitioners.length === 0}
          className="focus-ring inline-flex items-center gap-2 rounded-xl bg-brand-700 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-brand-800 disabled:cursor-not-allowed disabled:opacity-60"
        >
          <CalendarPlus className="h-4 w-4" aria-hidden />
          {t("agenda.newAppointment")}
        </button>
      </div>

      {services.length === 0 ? (
        <p className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          No hay servicios activos. Configura el catalogo antes de agendar.
        </p>
      ) : null}

      <section className="card overflow-x-auto">
        <div className="min-w-[720px]">
          <div
            className="grid border-b border-line bg-canvas"
            style={{
              gridTemplateColumns: `64px repeat(${Math.max(columns.length, 1)}, minmax(220px, 1fr))`,
            }}
          >
            <div className="px-2 py-3 text-[11px] font-medium uppercase tracking-wide text-muted">
              {t("common.hour")}
            </div>
            {columns.length === 0 ? (
              <div className="px-4 py-3 text-sm text-muted">
                {t("agenda.noActiveSpecialists")}
              </div>
            ) : (
              columns.map((practitioner) => (
                <div
                  key={practitioner.id}
                  className="border-l border-line px-3 py-2.5"
                >
                  <p className="truncate text-sm font-semibold">
                    {practitioner.fullName}
                  </p>
                  <p className="truncate text-[11px] text-muted">
                    {practitioner.specialty ?? t("practitioners.general")}
                  </p>
                </div>
              ))
            )}
          </div>

          <div
            className="relative grid"
            style={{
              gridTemplateColumns: `64px repeat(${Math.max(columns.length, 1)}, minmax(220px, 1fr))`,
            }}
          >
            <div className="border-r border-line">
              {Array.from({ length: rows }).map((_, index) => {
                const minute = startMinute + index * ROW_MINUTES;
                const hour = Math.floor(minute / 60);
                const mins = minute % 60;
                return (
                  <div
                    key={minute}
                    className="border-b border-line/70 px-2 pt-1 text-right text-[11px] tabular-nums text-muted"
                    style={{ height: ROW_HEIGHT }}
                  >
                    {String(hour).padStart(2, "0")}:{String(mins).padStart(2, "0")}
                  </div>
                );
              })}
            </div>

            {columns.length === 0 ? (
              <div className="min-h-64 border-l border-line" />
            ) : (
              columns.map((practitioner) => {
                const items = appointments.filter(
                  (appointment) => appointment.practitionerId === practitioner.id,
                );
                return (
                  <div
                    key={practitioner.id}
                    className="relative border-l border-line"
                    style={{ height: rows * ROW_HEIGHT }}
                  >
                    {Array.from({ length: rows }).map((_, index) => (
                      <div
                        key={index}
                        className="border-b border-line/60"
                        style={{ height: ROW_HEIGHT }}
                      />
                    ))}

                    {items.map((appointment) => {
                      const start = DateTime.fromISO(appointment.startsAt, {
                        zone: timezone,
                      });
                      const end = DateTime.fromISO(appointment.endsAt, {
                        zone: timezone,
                      });
                      const startOffset =
                        (start.hour * 60 +
                          start.minute -
                          startMinute) /
                        ROW_MINUTES;
                      const duration = Math.max(
                        15,
                        end.diff(start, "minutes").minutes,
                      );
                      const top = Math.max(0, startOffset * ROW_HEIGHT + 2);
                      const height = Math.max(
                        30,
                        (duration / ROW_MINUTES) * ROW_HEIGHT - 4,
                      );

                      return (
                        <button
                          key={appointment.id}
                          type="button"
                          onClick={() => setSelected(appointment)}
                          className={`focus-ring absolute left-1 right-1 overflow-hidden rounded-lg border bg-surface px-2 py-1.5 text-left shadow-sm transition-shadow hover:shadow-md ${
                            appointment.isOverbooking
                              ? "overbooking-stripes border-amber-300"
                              : "border-line"
                          }`}
                          style={{
                            top,
                            height,
                            borderLeftColor: practitioner.color ?? "#0F766E",
                            borderLeftWidth: 3,
                          }}
                        >
                          <p className="truncate text-[11px] font-semibold tabular-nums text-muted">
                            {formatTime(appointment.startsAt, timezone)} ·{" "}
                            {appointment.durationMinutesSnapshot ?? 30} min
                          </p>
                          <p className="truncate text-xs font-semibold">
                            {appointment.patientFirstName}{" "}
                            {appointment.patientLastName}
                          </p>
                          <p className="truncate text-[11px] text-muted">
                            {appointment.serviceNameSnapshot ?? t("sala.consultation")}
                          </p>
                          <div className="mt-1">
                            <StatusBadge status={appointment.status} />
                          </div>
                        </button>
                      );
                    })}
                  </div>
                );
              })
            )}
          </div>
        </div>
      </section>

      {selected ? (
        <AppointmentDrawer
          appointment={selected}
          timezone={timezone}
          onClose={() => setSelected(null)}
        />
      ) : null}

      {newOpen ? (
        <NewAppointmentDialog
          date={date}
          timezone={timezone}
          services={services}
          practitioners={practitioners}
          practitionerServices={practitionerServices}
          initialPatient={initialPatient}
          initialPractitionerId={initialPractitionerId}
          onClose={() => setNewOpen(false)}
        />
      ) : null}
    </div>
  );
}

function AppointmentDrawer({
  appointment,
  timezone,
  onClose,
}: {
  appointment: Appointment;
  timezone: string;
  onClose: () => void;
}) {
  const router = useRouter();
  const toast = useToast();
  const { t } = useI18n();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const successByAction: Record<AppointmentAction, string> = {
    confirm: t("agenda.confirmedToast"),
    "check-in": t("sala.checkedInToast"),
    room: t("sala.roomToast"),
    start: t("sala.startToast"),
    complete: t("sala.completeToast"),
    "no-show": t("agenda.noShowToast"),
  };

  function run(action: AppointmentAction) {
    setError(null);
    startTransition(async () => {
      const result = await transitionAppointmentAction({
        appointmentId: appointment.id,
        action,
      });
      if (!result.ok) {
        setError(result.error);
        return;
      }
      toast.success(successByAction[action]);
      onClose();
      router.refresh();
    });
  }

  const actions: Array<{
    action: AppointmentAction;
    label: string;
    show: boolean;
    primary?: boolean;
  }> = [
    {
      action: "confirm",
      label: "Confirmar",
      show: appointment.status === "requested",
    },
    {
      action: "check-in",
      label: "Llegó",
      show: ["requested", "confirmed"].includes(appointment.status),
      primary: true,
    },
    {
      action: "room",
      label: "Pasar a consultorio",
      show: appointment.status === "arrived" && !appointment.roomedAt,
    },
    {
      action: "start",
      label: "Iniciar consulta",
      show: appointment.status === "arrived",
      primary: true,
    },
    {
      action: "complete",
      label: "Finalizar consulta",
      show: appointment.status === "in_consultation",
      primary: true,
    },
    {
      action: "no-show",
      label: "No asistió",
      show: ["requested", "confirmed"].includes(appointment.status),
    },
  ];

  return (
    <div className="fixed inset-0 z-40 flex justify-end bg-slate-900/20 dark:bg-black/60">
      <button
        type="button"
        aria-label={t("agenda.closePanel")}
        className="absolute inset-0 cursor-default"
        onClick={onClose}
      />
      <aside
        role="dialog"
        aria-modal="true"
        aria-label={t("agenda.detail")}
        className="relative z-10 flex h-full w-full max-w-md flex-col overflow-y-auto border-l border-line bg-surface shadow-2xl"
      >
        <div className="flex items-center justify-between border-b border-line px-5 py-4">
          <div>
            <p className="text-xs text-muted">{t("agenda.appointment")}</p>
            <h2 className="font-semibold">
              {appointment.patientFirstName} {appointment.patientLastName}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="focus-ring rounded-lg p-1.5 text-muted hover:bg-canvas hover:text-ink"
            aria-label={t("common.close")}
          >
            <X className="h-5 w-5" aria-hidden />
          </button>
        </div>

        <div className="space-y-4 p-5">
          <div className="rounded-xl border border-line bg-canvas p-4">
            <p className="text-sm font-medium">
              {formatTime(appointment.startsAt, timezone)} –{" "}
              {formatTime(appointment.endsAt, timezone)}
            </p>
            <p className="mt-1 text-sm text-muted">
              {appointment.serviceNameSnapshot ?? t("sala.consultation")} ·{" "}
              {appointment.practitionerName}
            </p>
            <div className="mt-2 flex flex-wrap gap-2">
              <StatusBadge status={appointment.status} />
              {appointment.isOverbooking ? (
                <span className="rounded-full bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-800 ring-1 ring-inset ring-amber-200">
                  {t("agenda.overbooking")}
                </span>
              ) : null}
            </div>
          </div>

          <dl className="space-y-2 text-sm">
            <div className="flex justify-between gap-3">
              <dt className="text-muted">{t("agenda.checkInLabel")}</dt>
              <dd>
                {appointment.checkedInAt
                  ? formatTime(appointment.checkedInAt, timezone)
                  : t("agenda.pending")}
              </dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt className="text-muted">{t("agenda.actualStart")}</dt>
              <dd>
                {appointment.consultStartedAt
                  ? formatTime(appointment.consultStartedAt, timezone)
                  : t("agenda.pending")}
              </dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt className="text-muted">{t("agenda.actualEnd")}</dt>
              <dd>
                {appointment.consultEndedAt
                  ? formatTime(appointment.consultEndedAt, timezone)
                  : t("agenda.pending")}
              </dd>
            </div>
          </dl>

          {error ? (
            <p role="alert" className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700">
              {error}
            </p>
          ) : null}

          <div className="grid gap-2">
            {actions
              .filter((item) => item.show)
              .map((item) => (
                <button
                  key={item.action}
                  type="button"
                  disabled={pending}
                  onClick={() => run(item.action)}
                  className={`focus-ring inline-flex items-center justify-center gap-2 rounded-xl px-3 py-2.5 text-sm font-semibold disabled:opacity-60 ${
                    item.primary
                      ? "bg-brand-700 text-white hover:bg-brand-800"
                      : "border border-line bg-surface text-ink hover:bg-canvas"
                  }`}
                >
                  {pending ? (
                    <LoaderCircle className="h-4 w-4 animate-spin" aria-hidden />
                  ) : (
                    <Check className="h-4 w-4" aria-hidden />
                  )}
                  {item.label}
                </button>
              ))}
          </div>

          {!["completed", "cancelled", "no_show"].includes(appointment.status) ? (
            <div className="space-y-2 border-t border-line pt-4">
              <p className="text-xs font-medium text-muted">{t("agenda.manage")}</p>
              <AppointmentManageButtons
                appointment={appointment}
                timezone={timezone}
                onChanged={onClose}
              />
              <CheckoutButton appointment={appointment} />
            </div>
          ) : appointment.status === "completed" ? (
            <div className="space-y-2 border-t border-line pt-4">
              <p className="text-xs font-medium text-muted">{t("agenda.charge")}</p>
              <CheckoutButton appointment={appointment} />
            </div>
          ) : null}
        </div>
      </aside>
    </div>
  );
}

function QuickPatientForm({
  onCreated,
  onCancel,
}: {
  onCreated: (patient: PatientSearchResult) => void;
  onCancel: () => void;
}) {
  const toast = useToast();
  const { t } = useI18n();
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [birthDate, setBirthDate] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [documentType, setDocumentType] = useState("");
  const [documentNumber, setDocumentNumber] = useState("");
  const [guardianName, setGuardianName] = useState("");
  const [guardianRelationship, setGuardianRelationship] = useState("parent");
  const [guardianPhone, setGuardianPhone] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const minor =
    birthDate.length > 0 &&
    DateTime.fromISO(birthDate).isValid &&
    DateTime.now().diff(DateTime.fromISO(birthDate), "years").years < 18;

  function submit() {
    setError(null);
    if (!firstName.trim() || !lastName.trim()) {
      setError(t("patients.nameRequired"));
      return;
    }
    if (minor && !guardianName.trim()) {
      setError(t("patients.guardianRequired"));
      return;
    }

    startTransition(async () => {
      const result = await createPatientQuickAction({
        firstName,
        lastName,
        ...(birthDate ? { birthDate } : {}),
        ...(phone ? { phone } : {}),
        ...(email ? { email } : {}),
        ...(documentType ? { documentType } : {}),
        ...(documentNumber ? { documentNumber } : {}),
        ...(guardianName
          ? {
              guardianName,
              guardianRelationship,
              ...(guardianPhone ? { guardianPhone } : {}),
            }
          : {}),
      });

      if (!result.ok) {
        setError(result.error);
        return;
      }

      const primaryPhone = result.patient.contacts.find(
        (contact) => contact.kind === "phone" && contact.isPrimary,
      );
      const primaryEmail = result.patient.contacts.find(
        (contact) => contact.kind === "email" && contact.isPrimary,
      );

      toast.success(t("patients.createdToast"));
      onCreated({
        id: result.patient.id,
        firstName: result.patient.firstName,
        lastName: result.patient.lastName,
        preferredName: result.patient.preferredName,
        birthDate: result.patient.birthDate,
        status: result.patient.status,
        householdId: result.patient.householdId,
        phoneMasked: primaryPhone?.valueMasked ?? null,
        emailMasked: primaryEmail?.valueMasked ?? null,
      });
    });
  }

  return (
    <div className="space-y-3 rounded-xl border border-brand-200 bg-brand-50/60 p-3.5 dark:bg-brand-900/20">
      <div>
        <p className="text-sm font-semibold text-brand-900">{t("agenda.quickCreate")}</p>
        <p className="text-xs text-brand-800">
          {t("agenda.quickCreateHint")}
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <input
          value={firstName}
          onChange={(event) => setFirstName(event.target.value)}
          placeholder={`${t("patients.firstName")} *`}
          className="focus-ring w-full rounded-xl border border-line bg-surface px-3 py-2 text-sm shadow-sm"
        />
        <input
          value={lastName}
          onChange={(event) => setLastName(event.target.value)}
          placeholder={`${t("patients.lastName")} *`}
          className="focus-ring w-full rounded-xl border border-line bg-surface px-3 py-2 text-sm shadow-sm"
        />
        <DatePicker
          value={birthDate}
          onChange={setBirthDate}
          placeholder={t("patients.birthDate")}
          disableFuture
        />
        <input
          value={phone}
          onChange={(event) => setPhone(event.target.value)}
          placeholder={t("patients.phone")}
          className="focus-ring w-full rounded-xl border border-line bg-surface px-3 py-2 text-sm shadow-sm"
        />
        <input
          type="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          placeholder={t("patients.email")}
          className="focus-ring w-full rounded-xl border border-line bg-surface px-3 py-2 text-sm shadow-sm"
        />
        <select
          value={documentType}
          onChange={(event) => setDocumentType(event.target.value)}
          className="focus-ring w-full rounded-xl border border-line bg-surface px-3 py-2 text-sm shadow-sm"
        >
          <option value="">{t("patients.noDocument")}</option>
          <option value="ine">{t("patients.docIne")}</option>
          <option value="passport">{t("patients.docPassport")}</option>
          <option value="curp">{t("patients.docCurp")}</option>
          <option value="ssn">{t("patients.docSsn")}</option>
          <option value="other">{t("patients.other")}</option>
        </select>
        <input
          value={documentNumber}
          onChange={(event) => setDocumentNumber(event.target.value)}
          placeholder={t("patients.documentNumber")}
          className="focus-ring w-full rounded-xl border border-line bg-surface px-3 py-2 text-sm shadow-sm sm:col-span-2"
        />
      </div>

      {minor ? (
        <div className="grid gap-3 border-t border-brand-200 pt-3 sm:grid-cols-3">
          <input
            value={guardianName}
            onChange={(event) => setGuardianName(event.target.value)}
            placeholder={`${t("patients.guardianName")} *`}
            className="focus-ring w-full rounded-xl border border-line bg-surface px-3 py-2 text-sm shadow-sm"
          />
          <select
            value={guardianRelationship}
            onChange={(event) => setGuardianRelationship(event.target.value)}
            className="focus-ring w-full rounded-xl border border-line bg-surface px-3 py-2 text-sm shadow-sm"
          >
            <option value="parent">{t("patients.parent")}</option>
            <option value="legal_guardian">{t("patients.legalGuardian")}</option>
            <option value="caregiver">{t("patients.caregiver")}</option>
            <option value="other">{t("patients.other")}</option>
          </select>
          <input
            value={guardianPhone}
            onChange={(event) => setGuardianPhone(event.target.value)}
            placeholder={t("patients.guardianPhone")}
            className="focus-ring w-full rounded-xl border border-line bg-surface px-3 py-2 text-sm shadow-sm"
          />
        </div>
      ) : null}

      {error ? (
        <p role="alert" className="rounded-lg bg-rose-50 px-3 py-2 text-xs text-rose-700">
          {error}
        </p>
      ) : null}

      <div className="flex flex-wrap justify-end gap-2">
        <button
          type="button"
          onClick={onCancel}
          className="focus-ring rounded-lg border border-line px-3 py-2 text-xs font-medium"
        >
          {t("common.cancel")}
        </button>
        <button
          type="button"
          onClick={submit}
          disabled={pending}
          className="focus-ring inline-flex items-center gap-1.5 rounded-lg bg-brand-700 px-3 py-2 text-xs font-semibold text-white hover:bg-brand-800 disabled:opacity-60"
        >
          {pending ? (
            <LoaderCircle className="h-3.5 w-3.5 animate-spin" aria-hidden />
          ) : (
            <UserPlus className="h-3.5 w-3.5" aria-hidden />
          )}
          {pending ? t("agenda.creating") : t("agenda.saveAndSelect")}
        </button>
      </div>
    </div>
  );
}

function NewAppointmentDialog({
  date,
  timezone,
  services,
  practitioners,
  practitionerServices,
  initialPatient,
  initialPractitionerId = null,
  onClose,
}: {
  date: string;
  timezone: string;
  services: Service[];
  practitioners: Practitioner[];
  practitionerServices: PractitionerService[];
  initialPatient: PatientSearchResult | null;
  initialPractitionerId?: string | null;
  onClose: () => void;
}) {
  const router = useRouter();
  const toast = useToast();
  const { t } = useI18n();
  const [patientQuery, setPatientQuery] = useState("");
  const [patientResults, setPatientResults] = useState<PatientSearchResult[]>([]);
  const [patient, setPatient] = useState<PatientSearchResult | null>(initialPatient);
  const [creatingPatient, setCreatingPatient] = useState(false);
  const [practitionerId, setPractitionerId] = useState(
    initialPractitionerId ?? practitioners[0]?.id ?? "",
  );
  const [serviceId, setServiceId] = useState(
    () =>
      servicesForPractitioner(
        initialPractitionerId ?? practitioners[0]?.id ?? "",
        services,
        practitionerServices,
      )[0]?.id ?? "",
  );
  const [slotDate, setSlotDate] = useState(date);
  const [slots, setSlots] = useState<AvailabilitySlot[]>([]);
  const [slot, setSlot] = useState<AvailabilitySlot | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [searching, setSearching] = useState(false);
  const [searchAttempted, setSearchAttempted] = useState(false);
  const [loadingSlots, startSlots] = useTransition();
  const [booking, startBooking] = useTransition();

  const availableServices = servicesForPractitioner(
    practitionerId,
    services,
    practitionerServices,
  );
  const service = availableServices.find((item) => item.id === serviceId);

  useEffect(() => {
    const options = servicesForPractitioner(
      practitionerId,
      services,
      practitionerServices,
    );
    setServiceId((current) =>
      options.some((item) => item.id === current)
        ? current
        : options[0]?.id ?? "",
    );
    setSlots([]);
    setSlot(null);
    // Solo al cambiar de especialista; las listas vienen del servidor.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [practitionerId]);

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  useEffect(() => {
    const query = patientQuery.trim();
    if (query.length < 2) {
      setPatientResults([]);
      setSearching(false);
      setSearchAttempted(false);
      return;
    }

    let active = true;
    const timer = setTimeout(async () => {
      setSearching(true);
      setSearchAttempted(false);
      const results = await searchPatientsAction(query);
      if (!active) return;
      setPatientResults(results);
      setSearching(false);
      setSearchAttempted(true);
    }, 350);

    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [patientQuery]);

  function loadSlots() {
    setError(null);
    setSlot(null);
    startSlots(async () => {
      const result = await getAvailabilityAction({
        practitionerId,
        serviceId,
        date: slotDate,
      });
      if (!result.ok) {
        setSlots([]);
        setError(result.error);
        return;
      }
      setSlots(result.data.slots);
    });
  }

  function submit() {
    if (!patient || !service || !slot) {
      setError(t("agenda.selectBookingError"));
      return;
    }

    setError(null);
    startBooking(async () => {
      const result = await bookAppointmentAction({
        patientId: patient.id,
        practitionerId,
        serviceId,
        startsAt: slot.startsAt,
        endsAt: slot.endsAt,
      });
      if (!result.ok) {
        setError(result.error);
        return;
      }
      toast.success(t("agenda.booked"));
      onClose();
      router.refresh();
    });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/30 dark:bg-black/60 p-4">
      <button
        type="button"
        aria-label={t("common.close")}
        className="absolute inset-0 cursor-default"
        onClick={onClose}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-label={t("agenda.newAppointment")}
        className="relative z-10 max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-2xl border border-line bg-surface shadow-2xl"
      >
        <div className="flex items-center justify-between border-b border-line px-5 py-4">
          <div>
            <p className="text-xs text-muted">{t("nav.agenda")}</p>
            <h2 className="font-semibold">{t("agenda.newAppointment")}</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="focus-ring rounded-lg p-1.5 text-muted hover:bg-canvas hover:text-ink"
            aria-label={t("common.close")}
          >
            <X className="h-5 w-5" aria-hidden />
          </button>
        </div>

        <div className="space-y-5 p-5">
          <section className="space-y-2">
            <p className="text-sm font-medium">{t("agenda.patientStep")}</p>
            {patient ? (
              <div className="flex items-center justify-between rounded-xl border border-brand-200 bg-brand-50 px-3 py-2">
                <div>
                  <p className="text-sm font-semibold text-brand-900">
                    {patient.preferredName ?? patient.firstName} {patient.lastName}
                  </p>
                  <p className="text-xs text-brand-800">
                    {patient.phoneMasked ?? patient.emailMasked ?? t("patients.noContact")}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setPatient(null)}
                  className="text-xs font-medium text-brand-800 hover:underline"
                >
                  {t("agenda.changePatient")}
                </button>
              </div>
            ) : (
              <>
                <div className="relative">
                  <Search
                    className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted"
                    aria-hidden
                  />
                  <input
                    value={patientQuery}
                    onChange={(event) => setPatientQuery(event.target.value)}
                    placeholder={t("patients.searchPlaceholder")}
                    autoComplete="off"
                    className="focus-ring w-full rounded-xl border border-line bg-surface py-2.5 pl-9 pr-10 text-sm shadow-sm"
                  />
                  {searching ? (
                    <LoaderCircle
                      className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-muted"
                      aria-hidden
                    />
                  ) : null}
                </div>
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="text-xs text-muted">
                    ¿El paciente aún no existe?
                  </p>
                  <button
                    type="button"
                    onClick={() => setCreatingPatient((value) => !value)}
                    className="focus-ring inline-flex items-center gap-1.5 rounded-lg border border-line px-2.5 py-1.5 text-xs font-medium text-brand-800 hover:bg-canvas"
                  >
                    <UserPlus className="h-3.5 w-3.5" aria-hidden />
                    {creatingPatient ? t("agenda.closeCreate") : t("agenda.createPatient")}
                  </button>
                </div>

                {creatingPatient ? (
                  <QuickPatientForm
                    onCancel={() => setCreatingPatient(false)}
                    onCreated={(created) => {
                      setPatient(created);
                      setCreatingPatient(false);
                      setPatientResults([]);
                      setPatientQuery("");
                    }}
                  />
                ) : null}

                {patientResults.length > 0 ? (
                  <ul className="divide-y divide-line rounded-xl border border-line">
                    {patientResults.map((result) => (
                      <li key={result.id}>
                        <button
                          type="button"
                          onClick={() => {
                            setPatient(result);
                            setPatientResults([]);
                          }}
                          className="flex w-full items-center justify-between gap-2 px-3 py-2 text-left text-sm hover:bg-canvas"
                        >
                          <span>
                            {result.preferredName ?? result.firstName} {result.lastName}
                          </span>
                          <ChevronRight className="h-4 w-4 text-muted" aria-hidden />
                        </button>
                      </li>
                    ))}
                  </ul>
                ) : null}
                {!creatingPatient &&
                !searching &&
                searchAttempted &&
                patientQuery.length >= 2 &&
                patientResults.length === 0 ? (
                  <p className="text-xs text-muted">
                    {t("agenda.noResults")}
                  </p>
                ) : null}
              </>
            )}
          </section>

          <section className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <label htmlFor="serviceId" className="text-sm font-medium">
                {t("agenda.serviceStep")}
              </label>
              <select
                id="serviceId"
                value={serviceId}
                onChange={(event) => {
                  setServiceId(event.target.value);
                  setSlots([]);
                  setSlot(null);
                }}
                className="focus-ring w-full rounded-xl border border-line bg-surface px-3 py-2 text-sm shadow-sm"
              >
                {availableServices.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.name} · {item.durationMinutes} min ·{" "}
                    {money(item.priceCents, item.currency)}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <label htmlFor="practitionerId" className="text-sm font-medium">
                {t("agenda.specialistStep")}
              </label>
              <select
                id="practitionerId"
                value={practitionerId}
                onChange={(event) => {
                  setPractitionerId(event.target.value);
                  setSlots([]);
                  setSlot(null);
                }}
                className="focus-ring w-full rounded-xl border border-line bg-surface px-3 py-2 text-sm shadow-sm"
              >
                {practitioners.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.fullName}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <label htmlFor="slotDate" className="text-sm font-medium">
                {t("agenda.dateStep")}
              </label>
              <DatePicker
                id="slotDate"
                value={slotDate}
                onChange={(next) => {
                  setSlotDate(next);
                  setSlots([]);
                  setSlot(null);
                }}
              />
            </div>

            <div className="flex items-end">
              <button
                type="button"
                onClick={loadSlots}
                disabled={loadingSlots || !practitionerId || !serviceId}
                className="focus-ring inline-flex w-full items-center justify-center gap-2 rounded-xl border border-line px-3 py-2 text-sm font-semibold hover:bg-canvas disabled:opacity-60"
              >
                {loadingSlots ? (
                  <LoaderCircle className="h-4 w-4 animate-spin" aria-hidden />
                ) : (
                  <Clock3 className="h-4 w-4" aria-hidden />
                )}
                {t("agenda.viewSlots")}
              </button>
            </div>
          </section>

          <section className="space-y-2">
            <p className="text-sm font-medium">{t("agenda.slotStep")}</p>
            {slots.length === 0 ? (
              <p className="text-xs text-muted">
                Selecciona fecha y pulsa “{t("agenda.viewSlots")}”.
              </p>
            ) : (
              <div className="grid grid-cols-4 gap-2 sm:grid-cols-6">
                {slots.map((item) => {
                  const active = slot?.startsAt === item.startsAt;
                  return (
                    <button
                      key={item.startsAt}
                      type="button"
                      onClick={() => setSlot(item)}
                      className={`focus-ring rounded-lg border px-2 py-2 text-sm font-medium tabular-nums ${
                        active
                          ? "border-brand-700 bg-brand-700 text-white"
                          : "border-line bg-surface hover:bg-canvas"
                      }`}
                    >
                      {formatTime(item.startsAt, timezone)}
                    </button>
                  );
                })}
              </div>
            )}
          </section>

          {error ? (
            <p role="alert" className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700">
              {error}
            </p>
          ) : null}

          <div className="flex flex-wrap items-center justify-between gap-2 border-t border-line pt-4">
            <p className="text-xs text-muted">
              {service
                ? `${service.name} · ${service.durationMinutes} min`
                : "Selecciona un servicio"}
            </p>
            <button
              type="button"
              onClick={submit}
              disabled={booking || !patient || !slot}
              className="focus-ring inline-flex items-center gap-2 rounded-xl bg-brand-700 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-brand-800 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {booking ? (
                <LoaderCircle className="h-4 w-4 animate-spin" aria-hidden />
              ) : (
                <Check className="h-4 w-4" aria-hidden />
              )}
              {booking ? t("agenda.booking") : t("agenda.confirm")}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
