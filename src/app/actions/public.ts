"use server";

import { api, ApiError } from "@/lib/api";
import type { AvailabilityResponse } from "@/lib/types";

type PublicAvailabilityResult =
  | { ok: true; data: AvailabilityResponse }
  | { ok: false; error: string };

export async function getPublicAvailabilityAction(input: {
  slug: string;
  serviceId: string;
  practitionerId: string;
  date: string;
}): Promise<PublicAvailabilityResult> {
  try {
    const query = new URLSearchParams({
      serviceId: input.serviceId,
      practitionerId: input.practitionerId,
      date: input.date,
    });
    const data = await api<AvailabilityResponse>(
      `/api/v1/public/clinics/${encodeURIComponent(input.slug)}/availability?${query.toString()}`,
    );
    return { ok: true, data };
  } catch (error) {
    return {
      ok: false,
      error:
        error instanceof ApiError
          ? error.message
          : "No se pudo consultar la disponibilidad.",
    };
  }
}

export async function bookPublicAppointmentAction(input: {
  slug: string;
  serviceId: string;
  practitionerId: string;
  startsAt: string;
  endsAt: string;
  patient: {
    firstName: string;
    lastName: string;
    phone: string;
    email?: string;
  };
}): Promise<
  | {
      ok: true;
      appointment: {
        id: string;
        startsAt: string;
        status: string;
        clinicName: string;
      };
    }
  | { ok: false; error: string }
> {
  try {
    const appointment = await api<{
      id: string;
      startsAt: string;
      status: string;
      clinicName: string;
    }>(`/api/v1/public/clinics/${encodeURIComponent(input.slug)}/appointments`, {
      method: "POST",
      body: {
        serviceId: input.serviceId,
        practitionerId: input.practitionerId,
        startsAt: input.startsAt,
        endsAt: input.endsAt,
        patient: input.patient,
      },
    });
    return { ok: true, appointment };
  } catch (error) {
    return {
      ok: false,
      error:
        error instanceof ApiError
          ? error.message
          : "No se pudo confirmar la cita.",
    };
  }
}
