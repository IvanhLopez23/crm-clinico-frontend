"use server";

import { api, ApiError } from "@/lib/api";
import { getSession } from "@/lib/session";

type ActionResult = { ok: true } | { ok: false; error: string };

async function tenantToken(): Promise<string | null> {
  const session = await getSession();
  return session && session.scope === "tenant" ? session.token : null;
}

export async function markNotificationReadAction(
  notificationId: string,
): Promise<ActionResult> {
  const token = await tenantToken();
  if (!token) return { ok: false, error: "La sesión expiró." };

  try {
    await api(`/api/v1/notifications/${notificationId}/read`, {
      method: "POST",
      token,
    });
    return { ok: true };
  } catch (error) {
    return {
      ok: false,
      error:
        error instanceof ApiError
          ? error.message
          : "No se pudo actualizar la notificación.",
    };
  }
}

export async function markAllNotificationsReadAction(): Promise<ActionResult> {
  const token = await tenantToken();
  if (!token) return { ok: false, error: "La sesión expiró." };

  try {
    await api("/api/v1/notifications/read-all", {
      method: "POST",
      token,
    });
    return { ok: true };
  } catch (error) {
    return {
      ok: false,
      error:
        error instanceof ApiError
          ? error.message
          : "No se pudieron actualizar las notificaciones.",
    };
  }
}
