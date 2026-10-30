"use server";

import { revalidatePath } from "next/cache";
import { api, ApiError } from "@/lib/api";
import { shiftDate } from "@/lib/dates";
import { getSession } from "@/lib/session";
import type { Appointment, AvailabilityResponse } from "@/lib/types";

export type AvailabilityResult =
  | { ok: true; data: AvailabilityResponse }
  | { ok: false; error: string };

export async function getAvailabilityAction(input: {
  practitionerId: string;
  serviceId?: string;
  durationMinutes?: number;
  date: string;
}): Promise<AvailabilityResult> {
  const session = await getSession();
  if (!session) return { ok: false, error: "La sesion expiro." };

  try {
    const query = new URLSearchParams({
      practitionerId: input.practitionerId,
      from: input.date,
      to: shiftDate(input.date, 1, session.clinic.timezone),
      durationMinutes: String(input.durationMinutes ?? 30),
    });
    if (input.serviceId) query.set("serviceId", input.serviceId);

    const data = await api<AvailabilityResponse>(
      `/api/v1/availability?${query.toString()}`,
      { token: session.token },
    );
    return { ok: true, data };
  } catch (error) {
    if (error instanceof ApiError) return { ok: false, error: error.message };
    return { ok: false, error: "No se pudo consultar la disponibilidad." };
  }
}

export async function bookAppointmentAction(input: {
  patientId: string;
  practitionerId: string;
  serviceId: string;
  startsAt: string;
  endsAt: string;
}): Promise<{ ok: true; id: string } | { ok: false; error: string }> {
  const session = await getSession();
  if (!session) return { ok: false, error: "La sesion expiro." };

  try {
    const appointment = await api<Appointment>("/api/v1/appointments", {
      method: "POST",
      token: session.token,
      body: {
        patientId: input.patientId,
        practitionerId: input.practitionerId,
        serviceId: input.serviceId,
        startsAt: input.startsAt,
        endsAt: input.endsAt,
        timezone: session.clinic.timezone,
        confirm: true,
      },
    });

    revalidatePath("/agenda");
    revalidatePath("/");
    revalidatePath(`/pacientes/${input.patientId}`);
    return { ok: true, id: appointment.id };
  } catch (error) {
    if (error instanceof ApiError) return { ok: false, error: error.message };
    return { ok: false, error: "No se pudo crear la cita." };
  }
}

export type AppointmentAction =
  | "confirm"
  | "check-in"
  | "room"
  | "start"
  | "complete"
  | "no-show";

export async function transitionAppointmentAction(input: {
  appointmentId: string;
  action: AppointmentAction;
  reason?: string;
}): Promise<{ ok: true; patientId: string } | { ok: false; error: string }> {
  const session = await getSession();
  if (!session) return { ok: false, error: "La sesion expiro." };

  const paths: Record<AppointmentAction, string> = {
    confirm: "confirm",
    "check-in": "check-in",
    room: "room",
    start: "start",
    complete: "complete",
    "no-show": "no-show",
  };

  try {
    const appointment = await api<Appointment>(
      `/api/v1/appointments/${input.appointmentId}/${paths[input.action]}`,
      {
        method: "POST",
        token: session.token,
        body:
          input.action === "no-show"
            ? { reason: input.reason ?? "No asistio" }
            : {},
      },
    );

    revalidatePath("/agenda");
    revalidatePath("/");
    revalidatePath(`/pacientes/${appointment.patientId}`);
    return { ok: true, patientId: appointment.patientId };
  } catch (error) {
    if (error instanceof ApiError) return { ok: false, error: error.message };
    return { ok: false, error: "No se pudo actualizar la cita." };
  }
}

export async function cancelAppointmentAction(input: {
  appointmentId: string;
  reasonCode: "patient_request" | "clinic_cancelled" | "financial" | "other";
}): Promise<{ ok: true; patientId: string } | { ok: false; error: string }> {
  const session = await getSession();
  if (!session) return { ok: false, error: "La sesion expiro." };

  try {
    const appointment = await api<Appointment>(
      `/api/v1/appointments/${input.appointmentId}/cancel`,
      {
        method: "POST",
        token: session.token,
        body: { reasonCode: input.reasonCode },
      },
    );

    revalidatePath("/agenda");
    revalidatePath("/");
    revalidatePath("/mi-dia");
    revalidatePath(`/pacientes/${appointment.patientId}`);
    return { ok: true, patientId: appointment.patientId };
  } catch (error) {
    if (error instanceof ApiError) return { ok: false, error: error.message };
    return { ok: false, error: "No se pudo cancelar la cita." };
  }
}

export async function rescheduleAppointmentAction(input: {
  appointmentId: string;
  startsAt: string;
  endsAt: string;
  timezone: string;
}): Promise<{ ok: true; patientId: string } | { ok: false; error: string }> {
  const session = await getSession();
  if (!session) return { ok: false, error: "La sesion expiro." };

  try {
    const appointment = await api<Appointment>(
      `/api/v1/appointments/${input.appointmentId}/reschedule`,
      {
        method: "POST",
        token: session.token,
        body: {
          startsAt: input.startsAt,
          endsAt: input.endsAt,
          timezone: input.timezone,
        },
      },
    );

    revalidatePath("/agenda");
    revalidatePath("/");
    revalidatePath("/mi-dia");
    revalidatePath(`/pacientes/${appointment.patientId}`);
    return { ok: true, patientId: appointment.patientId };
  } catch (error) {
    if (error instanceof ApiError) return { ok: false, error: error.message };
    return { ok: false, error: "No se pudo reagendar la cita." };
  }
}
