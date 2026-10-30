"use server";

import { revalidatePath } from "next/cache";
import { api, ApiError } from "@/lib/api";
import { getSession } from "@/lib/session";

type Result = { ok: true } | { ok: false; error: string };

async function token(): Promise<string | null> {
  const session = await getSession();
  return session?.scope === "tenant" ? session.token : null;
}

export async function cancelReminderAction(id: string): Promise<Result> {
  const sessionToken = await token();
  if (!sessionToken) return { ok: false, error: "La sesión expiró." };

  try {
    await api(`/api/v1/reminders/${id}/cancel`, {
      method: "POST",
      token: sessionToken,
    });
  } catch (error) {
    return {
      ok: false,
      error:
        error instanceof ApiError
          ? error.message
          : "No se pudo cancelar el recordatorio.",
    };
  }
  revalidatePath("/mensajes");
  return { ok: true };
}

export async function retryReminderAction(id: string): Promise<Result> {
  const sessionToken = await token();
  if (!sessionToken) return { ok: false, error: "La sesión expiró." };

  try {
    await api(`/api/v1/reminders/${id}/retry`, {
      method: "POST",
      token: sessionToken,
    });
  } catch (error) {
    return {
      ok: false,
      error:
        error instanceof ApiError
          ? error.message
          : "No se pudo reintentar el recordatorio.",
    };
  }
  revalidatePath("/mensajes");
  return { ok: true };
}

export async function createWaitlistEntryAction(input: {
  patientId: string;
  practitionerId?: string;
  earliestDate: string;
  latestDate: string;
  preferredTimeFrom?: string;
  preferredTimeTo?: string;
  priority: number;
  notes?: string;
}): Promise<Result> {
  const sessionToken = await token();
  if (!sessionToken) return { ok: false, error: "La sesión expiró." };

  try {
    await api("/api/v1/waitlist", {
      method: "POST",
      token: sessionToken,
      body: input,
    });
  } catch (error) {
    return {
      ok: false,
      error:
        error instanceof ApiError
          ? error.message
          : "No se pudo agregar a la lista de espera.",
    };
  }
  revalidatePath("/mensajes");
  return { ok: true };
}

export async function cancelWaitlistEntryAction(id: string): Promise<Result> {
  const sessionToken = await token();
  if (!sessionToken) return { ok: false, error: "La sesión expiró." };

  try {
    await api(`/api/v1/waitlist/${id}`, {
      method: "DELETE",
      token: sessionToken,
    });
  } catch (error) {
    return {
      ok: false,
      error:
        error instanceof ApiError
          ? error.message
          : "No se pudo cancelar la entrada.",
    };
  }
  revalidatePath("/mensajes");
  return { ok: true };
}

export async function acceptWaitlistOfferAction(id: string): Promise<Result> {
  const sessionToken = await token();
  if (!sessionToken) return { ok: false, error: "La sesión expiró." };

  try {
    await api(`/api/v1/waitlist/offers/${id}/accept`, {
      method: "POST",
      token: sessionToken,
    });
  } catch (error) {
    return {
      ok: false,
      error:
        error instanceof ApiError
          ? error.message
          : "No se pudo aceptar la oferta.",
    };
  }
  revalidatePath("/mensajes");
  revalidatePath("/agenda");
  return { ok: true };
}

export async function declineWaitlistOfferAction(id: string): Promise<Result> {
  const sessionToken = await token();
  if (!sessionToken) return { ok: false, error: "La sesión expiró." };

  try {
    await api(`/api/v1/waitlist/offers/${id}/decline`, {
      method: "POST",
      token: sessionToken,
    });
  } catch (error) {
    return {
      ok: false,
      error:
        error instanceof ApiError
          ? error.message
          : "No se pudo rechazar la oferta.",
    };
  }
  revalidatePath("/mensajes");
  return { ok: true };
}
