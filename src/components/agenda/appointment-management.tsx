"use client";

import {
  CalendarClock,
  LoaderCircle,
  RotateCcw,
  Trash2,
  X,
} from "lucide-react";
import { DateTime } from "luxon";
import { useRouter } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import {
  cancelAppointmentAction,
  getAvailabilityAction,
  rescheduleAppointmentAction,
} from "@/app/actions/appointments";
import { useToast } from "@/components/ui/toast-provider";
import { DatePicker } from "@/components/ui/date-picker";
import { useI18n } from "@/i18n/client";
import { formatTime } from "@/lib/dates";
import type { Appointment, AvailabilitySlot } from "@/lib/types";

const CLOSED_STATUSES = ["completed", "cancelled", "no_show"];

export function AppointmentManageButtons({
  appointment,
  timezone,
  compact = false,
  onChanged,
}: {
  appointment: Appointment;
  timezone: string;
  compact?: boolean;
  onChanged?: () => void;
}) {
  const { t } = useI18n();
  const [dialog, setDialog] = useState<"cancel" | "reschedule" | null>(null);

  if (CLOSED_STATUSES.includes(appointment.status)) return null;

  return (
    <>
      <div className="flex flex-wrap gap-1.5">
        <button
          type="button"
          onClick={() => setDialog("reschedule")}
          className={`focus-ring inline-flex items-center gap-1 rounded-lg border border-line bg-surface font-medium text-ink hover:bg-canvas ${
            compact ? "px-2 py-1 text-[11px]" : "px-2.5 py-1.5 text-xs"
          }`}
        >
          <RotateCcw className={compact ? "h-3 w-3" : "h-3.5 w-3.5"} aria-hidden />
          {t("agenda.reschedule")}
        </button>
        <button
          type="button"
          onClick={() => setDialog("cancel")}
          className={`focus-ring inline-flex items-center gap-1 rounded-lg border border-rose-200 bg-rose-50 font-medium text-rose-700 hover:bg-rose-100 dark:bg-rose-950/30 dark:hover:bg-rose-950/50 ${
            compact ? "px-2 py-1 text-[11px]" : "px-2.5 py-1.5 text-xs"
          }`}
        >
          <Trash2 className={compact ? "h-3 w-3" : "h-3.5 w-3.5"} aria-hidden />
          {t("agenda.cancel")}
        </button>
      </div>

      {dialog === "cancel" ? (
        <CancelDialog
          appointment={appointment}
          timezone={timezone}
          onClose={() => setDialog(null)}
          onDone={() => {
            setDialog(null);
            onChanged?.();
          }}
        />
      ) : null}

      {dialog === "reschedule" ? (
        <RescheduleDialog
          appointment={appointment}
          timezone={timezone}
          onClose={() => setDialog(null)}
          onDone={() => {
            setDialog(null);
            onChanged?.();
          }}
        />
      ) : null}
    </>
  );
}

function CancelDialog({
  appointment,
  timezone,
  onClose,
  onDone,
}: {
  appointment: Appointment;
  timezone: string;
  onClose: () => void;
  onDone: () => void;
}) {
  const router = useRouter();
  const toast = useToast();
  const { t } = useI18n();
  const [reasonCode, setReasonCode] = useState<
    "patient_request" | "clinic_cancelled" | "financial" | "other"
  >("patient_request");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  function submit() {
    setError(null);
    startTransition(async () => {
      const result = await cancelAppointmentAction({
        appointmentId: appointment.id,
        reasonCode,
      });
      if (!result.ok) {
        setError(result.error);
        return;
      }
      toast.success(t("agenda.cancelledToast"));
      onDone();
      router.refresh();
    });
  }

  return (
    <DialogShell title={t("agenda.cancelTitle")} onClose={onClose}>
      <div className="rounded-xl border border-line bg-canvas p-3.5">
        <p className="text-sm font-semibold">
          {appointment.patientFirstName} {appointment.patientLastName}
        </p>
        <p className="mt-0.5 text-xs text-muted">
          {formatTime(appointment.startsAt, timezone)} –{" "}
          {formatTime(appointment.endsAt, timezone)} ·{" "}
          {appointment.serviceNameSnapshot ?? t("sala.consultation")}
        </p>
      </div>

      <label className="mt-4 block space-y-2 text-sm font-medium">
        {t("agenda.cancelReason")}
        <select
          value={reasonCode}
          onChange={(event) =>
            setReasonCode(
              event.target.value as
                | "patient_request"
                | "clinic_cancelled"
                | "financial"
                | "other",
            )
          }
          className="focus-ring w-full rounded-xl border border-line bg-surface px-3.5 py-2.5 text-sm"
        >
          <option value="patient_request">{t("agenda.reasonPatient")}</option>
          <option value="clinic_cancelled">{t("agenda.reasonClinic")}</option>
          <option value="financial">{t("agenda.reasonFinancial")}</option>
          <option value="other">{t("agenda.reasonOther")}</option>
        </select>
      </label>

      <p className="mt-3 rounded-xl bg-amber-50 px-3 py-2.5 text-xs text-amber-800 dark:bg-amber-950/30 dark:text-amber-200">
        Se liberará el horario y se cancelarán los recordatorios pendientes. El
        paciente deberá reagendar si lo necesita.
      </p>

      {error ? (
        <p role="alert" className="mt-3 rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700">
          {error}
        </p>
      ) : null}

      <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
        <button
          type="button"
          onClick={onClose}
          className="focus-ring rounded-xl border border-line px-4 py-2.5 text-sm font-medium"
        >
          Volver
        </button>
        <button
          type="button"
          onClick={submit}
          disabled={pending}
          className="focus-ring inline-flex items-center justify-center gap-2 rounded-xl bg-rose-700 px-4 py-2.5 text-sm font-semibold text-white hover:bg-rose-800 disabled:opacity-60"
        >
          {pending ? (
            <LoaderCircle className="h-4 w-4 animate-spin" aria-hidden />
          ) : (
            <Trash2 className="h-4 w-4" aria-hidden />
          )}
          {pending ? t("agenda.cancelling") : t("agenda.cancelAppointment")}
        </button>
      </div>
    </DialogShell>
  );
}

function RescheduleDialog({
  appointment,
  timezone,
  onClose,
  onDone,
}: {
  appointment: Appointment;
  timezone: string;
  onClose: () => void;
  onDone: () => void;
}) {
  const router = useRouter();
  const toast = useToast();
  const { t } = useI18n();
  const initialDate =
    DateTime.fromISO(appointment.startsAt, { zone: timezone }).toISODate() ??
    DateTime.now().setZone(timezone).toISODate() ??
    "";
  const [date, setDate] = useState(initialDate);
  const [slots, setSlots] = useState<AvailabilitySlot[]>([]);
  const [selected, setSelected] = useState<AvailabilitySlot | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setSelected(null);
    setError(null);

    getAvailabilityAction({
      practitionerId: appointment.practitionerId,
      date,
      ...(appointment.serviceId
        ? { serviceId: appointment.serviceId }
        : { durationMinutes: appointment.durationMinutesSnapshot ?? 30 }),
    }).then((result) => {
      if (!active) return;
      setLoading(false);
      if (!result.ok) {
        setSlots([]);
        setError(result.error);
        return;
      }
      setSlots(result.data.slots);
    });

    return () => {
      active = false;
    };
  }, [
    appointment.durationMinutesSnapshot,
    appointment.practitionerId,
    appointment.serviceId,
    date,
  ]);

  function submit() {
    if (!selected) {
      setError(t("agenda.selectSlotError"));
      return;
    }
    setError(null);
    startTransition(async () => {
      const result = await rescheduleAppointmentAction({
        appointmentId: appointment.id,
        startsAt: selected.startsAt,
        endsAt: selected.endsAt,
        timezone,
      });
      if (!result.ok) {
        setError(result.error);
        return;
      }
      toast.success(t("agenda.rescheduledToast"));
      onDone();
      router.refresh();
    });
  }

  return (
    <DialogShell title={t("agenda.rescheduleTitle")} onClose={onClose}>
      <div className="rounded-xl border border-line bg-canvas p-3.5">
        <p className="text-sm font-semibold">
          {appointment.patientFirstName} {appointment.patientLastName}
        </p>
        <p className="mt-0.5 text-xs text-muted">
          Actualmente: {formatTime(appointment.startsAt, timezone)} ·{" "}
          {appointment.serviceNameSnapshot ?? t("sala.consultation")}
        </p>
      </div>

      <label className="mt-4 block space-y-2 text-sm font-medium">
        {t("agenda.newDate")}
        <DatePicker
          value={date}
          onChange={setDate}
          placeholder={t("common.selectDate")}
        />
      </label>

      <div className="mt-4">
        <p className="text-sm font-medium">{t("agenda.availableTimes")}</p>
        {loading ? (
          <p className="mt-2 flex items-center gap-2 text-xs text-muted">
            <LoaderCircle className="h-3.5 w-3.5 animate-spin" aria-hidden />
            {t("agenda.checking")}
          </p>
        ) : slots.length === 0 ? (
          <p className="mt-2 text-xs text-muted">
            {t("agenda.noTimes")}
          </p>
        ) : (
          <div className="mt-2 grid max-h-48 grid-cols-3 gap-2 overflow-y-auto pr-1 sm:grid-cols-4">
            {slots.map((slot) => {
              const active = selected?.startsAt === slot.startsAt;
              return (
                <button
                  key={slot.startsAt}
                  type="button"
                  onClick={() => setSelected(slot)}
                  className={`focus-ring rounded-lg border px-2 py-2 text-xs font-medium tabular-nums ${
                    active
                      ? "border-brand-700 bg-brand-700 text-white"
                      : "border-line bg-surface hover:bg-canvas"
                  }`}
                >
                  {formatTime(slot.startsAt, timezone)}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {error ? (
        <p role="alert" className="mt-3 rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700">
          {error}
        </p>
      ) : null}

      <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
        <button
          type="button"
          onClick={onClose}
          className="focus-ring rounded-xl border border-line px-4 py-2.5 text-sm font-medium"
        >
          Volver
        </button>
        <button
          type="button"
          onClick={submit}
          disabled={pending || !selected}
          className="focus-ring inline-flex items-center justify-center gap-2 rounded-xl bg-brand-700 px-4 py-2.5 text-sm font-semibold text-white hover:bg-brand-800 disabled:opacity-60"
        >
          {pending ? (
            <LoaderCircle className="h-4 w-4 animate-spin" aria-hidden />
          ) : (
            <CalendarClock className="h-4 w-4" aria-hidden />
          )}
          {pending ? t("agenda.rescheduling") : t("agenda.confirmNew")}
        </button>
      </div>
    </DialogShell>
  );
}

function DialogShell({
  title,
  onClose,
  children,
}: {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
}) {
  const { t } = useI18n();
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/30 p-4 dark:bg-black/60">
      <button
        type="button"
        aria-label={t("common.close")}
        className="absolute inset-0 cursor-default"
        onClick={onClose}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className="relative z-10 max-h-[92vh] w-full max-w-md overflow-y-auto rounded-2xl border border-line bg-surface shadow-2xl"
      >
        <div className="flex items-center justify-between border-b border-line px-5 py-4">
          <div>
            <p className="text-xs text-muted">{t("agenda.appointment")}</p>
            <h2 className="font-semibold">{title}</h2>
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
        <div className="p-5">{children}</div>
      </div>
    </div>
  );
}
