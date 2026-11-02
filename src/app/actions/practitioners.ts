"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { api, ApiError } from "@/lib/api";
import { getSession } from "@/lib/session";
import type { Practitioner } from "@/lib/types";

function value(formData: FormData, key: string): string {
  return String(formData.get(key) ?? "").trim();
}

function checked(formData: FormData, key: string): boolean {
  const raw = formData.get(key);
  return raw === "on" || raw === "true" || raw === "1";
}

function intValue(formData: FormData, key: string): number | undefined {
  const raw = value(formData, key);
  if (!raw) return undefined;
  const parsed = Number(raw);
  return Number.isFinite(parsed) ? parsed : undefined;
}

export async function createPractitionerAction(
  _previous: string | null,
  formData: FormData,
): Promise<string | null> {
  const session = await getSession();
  if (!session) return "La sesion expiro.";
  if (session.user.role !== "admin") return "Solo admin puede crear especialistas.";

  const fullName = value(formData, "fullName");
  if (!fullName) return "El nombre es obligatorio.";

  let created: Practitioner;
  try {
    created = await api<Practitioner>("/api/v1/practitioners", {
      method: "POST",
      token: session.token,
      body: {
        fullName,
        specialty: value(formData, "specialty") || null,
        color: value(formData, "color") || "#0F766E",
        defaultSlotMinutes: intValue(formData, "defaultSlotMinutes") ?? 30,
        bufferBeforeMinutes: intValue(formData, "bufferBeforeMinutes") ?? 0,
        bufferAfterMinutes: intValue(formData, "bufferAfterMinutes") ?? 5,
        isAcceptingNewPatients:
          formData.get("isAcceptingNewPatients") === "on",
      },
    });
  } catch (error) {
    if (error instanceof ApiError) return error.message;
    return "No se pudo crear el especialista.";
  }

  revalidatePath("/especialistas");
  redirect(`/especialistas/${created.id}?created=1`);
}

export async function updatePractitionerAction(
  _previous: string | null,
  formData: FormData,
): Promise<string | null> {
  const session = await getSession();
  if (!session) return "La sesion expiro.";
  if (session.user.role !== "admin") return "Solo admin puede editar especialistas.";

  const id = value(formData, "practitionerId");
  const fullName = value(formData, "fullName");
  if (!id || !fullName) return "Faltan datos del especialista.";

  try {
    await api(`/api/v1/practitioners/${id}`, {
      method: "PATCH",
      token: session.token,
      body: {
        fullName,
        specialty: value(formData, "specialty") || null,
        color: value(formData, "color") || "#0F766E",
        defaultSlotMinutes: intValue(formData, "defaultSlotMinutes") ?? 30,
        bufferBeforeMinutes: intValue(formData, "bufferBeforeMinutes") ?? 0,
        bufferAfterMinutes: intValue(formData, "bufferAfterMinutes") ?? 5,
        isAcceptingNewPatients:
          formData.get("isAcceptingNewPatients") === "on",
        isActive: formData.get("isActive") === "on",
      },
    });
  } catch (error) {
    if (error instanceof ApiError) return error.message;
    return "No se pudo actualizar el especialista.";
  }

  revalidatePath("/especialistas");
  revalidatePath(`/especialistas/${id}`);
  revalidatePath("/agenda");
  revalidatePath("/availability");
  return null;
}

export async function createWeeklyScheduleAction(
  _previous: string | null,
  formData: FormData,
): Promise<string | null> {
  const session = await getSession();
  if (!session) return "La sesion expiro.";
  if (session.user.role !== "admin") return "Solo admin puede editar disponibilidad.";

  const practitionerId = value(formData, "practitionerId");
  const weekdays = [...new Set(
    formData
      .getAll("weekdays")
      .map((item) => Number(item))
      .filter((item) => Number.isInteger(item) && item >= 1 && item <= 7),
  )].sort((a, b) => a - b);

  const startTime = value(formData, "startTime");
  const endTime = value(formData, "endTime");
  const validFrom = value(formData, "validFrom");
  const hasLunch = formData.get("hasLunch") === "on";
  const lunchStart = hasLunch ? value(formData, "lunchStart") : "";
  const lunchEnd = hasLunch ? value(formData, "lunchEnd") : "";

  if (!practitionerId) return "Falta el especialista.";
  if (weekdays.length === 0) return "Selecciona al menos un día.";
  if (!startTime || !endTime || !validFrom) {
    return "Completa el horario y la fecha de vigencia.";
  }
  if (startTime >= endTime) {
    return "La hora de inicio debe ser anterior a la de fin.";
  }
  if (hasLunch && (!lunchStart || !lunchEnd)) {
    return "Completa el horario de comida.";
  }
  if (
    hasLunch &&
    !(startTime < lunchStart && lunchStart < lunchEnd && lunchEnd < endTime)
  ) {
    return "La comida debe estar dentro del horario de atención.";
  }

  try {
    await api("/api/v1/availability/rules/bulk", {
      method: "POST",
      token: session.token,
      body: {
        practitionerId,
        weekdays,
        startTime,
        endTime,
        ...(hasLunch ? { lunchStart, lunchEnd } : {}),
        slotMinutes: intValue(formData, "slotMinutes") ?? 15,
        validFrom,
      },
    });
  } catch (error) {
    if (error instanceof ApiError) return error.message;
    return "No se pudo crear el horario semanal.";
  }

  revalidatePath(`/especialistas/${practitionerId}`);
  revalidatePath("/agenda");
  revalidatePath("/availability");
  return null;
}

export async function savePractitionerServiceAction(
  _previous: string | null,
  formData: FormData,
): Promise<string | null> {
  const session = await getSession();
  if (!session) return "La sesion expiro.";
  if (session.user.role !== "admin") {
    return "Solo administración puede editar los servicios del especialista.";
  }

  const practitionerId = value(formData, "practitionerId");
  const assignmentId = value(formData, "assignmentId");
  const serviceName = value(formData, "serviceName");
  const durationMinutes = intValue(formData, "durationMinutes");
  const priceRaw = value(formData, "price").replace(",", ".");
  const price = Number(priceRaw);

  if (!practitionerId) return "Falta el especialista.";
  if (!assignmentId && !serviceName) {
    return "Escribe el nombre del servicio.";
  }
  if (!durationMinutes || durationMinutes < 5 || durationMinutes > 480) {
    return "La duración debe estar entre 5 y 480 minutos.";
  }
  if (!Number.isFinite(price) || price < 0) {
    return "Ingresa un precio válido.";
  }
  const priceCents = Math.round(price * 100);

  try {
    if (assignmentId) {
      await api(`/api/v1/practitioner-services/${assignmentId}`, {
        method: "PATCH",
        token: session.token,
        body: { durationMinutes, priceCents },
      });
    } else {
      await api(`/api/v1/practitioners/${practitionerId}/services`, {
        method: "POST",
        token: session.token,
        body: { serviceName, durationMinutes, priceCents, isActive: true },
      });
    }
  } catch (error) {
    if (error instanceof ApiError) return error.message;
    return "No se pudo guardar el servicio del especialista.";
  }

  revalidatePath(`/especialistas/${practitionerId}`);
  revalidatePath("/agenda");
  return null;
}

export async function deletePractitionerServiceAction(
  formData: FormData,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const session = await getSession();
  if (!session || session.user.role !== "admin") {
    return { ok: false, error: "No tienes permiso para quitar servicios." };
  }

  const assignmentId = value(formData, "assignmentId");
  const practitionerId = value(formData, "practitionerId");
  if (!assignmentId) return { ok: false, error: "Falta el servicio." };

  try {
    await api(`/api/v1/practitioner-services/${assignmentId}`, {
      method: "DELETE",
      token: session.token,
    });
  } catch (error) {
    return {
      ok: false,
      error:
        error instanceof ApiError
          ? error.message
          : "No se pudo quitar el servicio.",
    };
  }

  revalidatePath(`/especialistas/${practitionerId}`);
  revalidatePath("/agenda");
  return { ok: true };
}

export async function updateAvailabilityRuleAction(
  _previous: string | null,
  formData: FormData,
): Promise<string | null> {
  const session = await getSession();
  if (!session) return "La sesion expiro.";
  if (session.user.role !== "admin") return "Solo admin puede editar disponibilidad.";

  const ruleId = value(formData, "ruleId");
  const practitionerId = value(formData, "practitionerId");
  if (!ruleId || !practitionerId) return "Faltan datos de la regla.";

  try {
    await api(`/api/v1/availability/rules/${ruleId}`, {
      method: "PATCH",
      token: session.token,
      body: {
        weekday: intValue(formData, "weekday"),
        startTime: value(formData, "startTime") || undefined,
        endTime: value(formData, "endTime") || undefined,
        validFrom: value(formData, "validFrom") || undefined,
        slotMinutes: intValue(formData, "slotMinutes"),
      },
    });
  } catch (error) {
    if (error instanceof ApiError) return error.message;
    return "No se pudo actualizar la regla.";
  }

  revalidatePath(`/especialistas/${practitionerId}`);
  revalidatePath("/agenda");
  return null;
}

export async function deleteAvailabilityRuleAction(
  formData: FormData,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const session = await getSession();
  if (!session || session.user.role !== "admin") {
    return { ok: false, error: "No tienes permiso para eliminar reglas." };
  }

  const ruleId = value(formData, "ruleId");
  const practitionerId = value(formData, "practitionerId");
  if (!ruleId || !practitionerId) {
    return { ok: false, error: "Faltan datos de la regla." };
  }

  try {
    await api(`/api/v1/availability/rules/${ruleId}`, {
      method: "DELETE",
      token: session.token,
    });
  } catch (error) {
    return {
      ok: false,
      error:
        error instanceof ApiError
          ? error.message
          : "No se pudo eliminar la regla.",
    };
  }

  revalidatePath(`/especialistas/${practitionerId}`);
  revalidatePath("/agenda");
  return { ok: true };
}

export async function createBlockAction(
  _previous: string | null,
  formData: FormData,
): Promise<string | null> {
  const session = await getSession();
  if (!session) return "La sesion expiro.";
  if (session.user.role !== "admin") return "Solo admin puede editar bloqueos.";

  const practitionerId = value(formData, "practitionerId");
  const day = value(formData, "day");
  const allDay = checked(formData, "allDay");
  const endDate = value(formData, "endDate") || day;
  const startAllDay = allDay || checked(formData, "startAllDay");
  const endAllDay = allDay || checked(formData, "endAllDay");
  const startTime = value(formData, "startTime");
  const endTime = value(formData, "endTime");

  if (!practitionerId || !day) return "Selecciona el dia del bloqueo.";
  if (!allDay && !startAllDay && !startTime) {
    return "Indica la hora de inicio o marca todo el dia.";
  }
  if (!allDay && !endAllDay && !endTime) {
    return "Indica la hora de fin o marca todo el dia.";
  }

  try {
    await api("/api/v1/availability/blocks", {
      method: "POST",
      token: session.token,
      body: {
        practitionerId,
        startDate: day,
        endDate: allDay ? day : endDate,
        startAllDay,
        endAllDay,
        startTime: startAllDay ? undefined : startTime,
        endTime: endAllDay ? undefined : endTime,
        type: value(formData, "type") || "other",
        reason: value(formData, "reason") || undefined,
      },
    });
  } catch (error) {
    if (error instanceof ApiError) return error.message;
    return "No se pudo crear el bloqueo.";
  }

  revalidatePath(`/especialistas/${practitionerId}`);
  revalidatePath("/agenda");
  return null;
}

export async function deleteBlockAction(
  formData: FormData,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const session = await getSession();
  if (!session || session.user.role !== "admin") {
    return { ok: false, error: "No tienes permiso para eliminar bloqueos." };
  }

  const blockId = value(formData, "blockId");
  const practitionerId = value(formData, "practitionerId");
  if (!blockId || !practitionerId) {
    return { ok: false, error: "Faltan datos del bloqueo." };
  }

  try {
    await api(`/api/v1/availability/blocks/${blockId}`, {
      method: "DELETE",
      token: session.token,
    });
  } catch (error) {
    return {
      ok: false,
      error:
        error instanceof ApiError
          ? error.message
          : "No se pudo eliminar el bloqueo.",
    };
  }

  revalidatePath(`/especialistas/${practitionerId}`);
  revalidatePath("/agenda");
  return { ok: true };
}
