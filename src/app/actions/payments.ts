"use server";

import { revalidatePath } from "next/cache";
import { api, ApiError } from "@/lib/api";
import { getSession } from "@/lib/session";
import type { AppointmentPayment } from "@/lib/types";

type Result =
  | { ok: true; payment: AppointmentPayment }
  | { ok: false; error: string };

export async function checkoutAppointmentAction(input: {
  appointmentId: string;
  amountCents: number;
  method: "cash" | "card" | "transfer" | "other";
  notes?: string;
}): Promise<Result> {
  const session = await getSession();
  if (!session || session.scope !== "tenant") {
    return { ok: false, error: "La sesión expiró." };
  }

  try {
    const result = await api<{
      appointment: { patientId: string };
      payment: AppointmentPayment;
    }>(`/api/v1/appointments/${input.appointmentId}/checkout`, {
      method: "POST",
      token: session.token,
      body: {
        amountCents: input.amountCents,
        method: input.method,
        ...(input.notes ? { notes: input.notes } : {}),
      },
    });

    revalidatePath("/agenda");
    revalidatePath("/mi-dia");
    revalidatePath("/sala");
    revalidatePath(`/pacientes/${result.appointment.patientId}`);
    return { ok: true, payment: result.payment };
  } catch (error) {
    return {
      ok: false,
      error:
        error instanceof ApiError
          ? error.message
          : "No se pudo registrar el cobro.",
    };
  }
}
