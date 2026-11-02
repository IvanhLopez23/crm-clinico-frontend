"use server";

import { revalidatePath } from "next/cache";
import { API_URL, api, ApiError } from "@/lib/api";
import { getSession } from "@/lib/session";

function value(formData: FormData, key: string): string {
  return String(formData.get(key) ?? "").trim();
}

function coordinates(formData: FormData): {
  latitude: number | null;
  longitude: number | null;
  error?: string;
} {
  const rawLatitude = value(formData, "latitude");
  const rawLongitude = value(formData, "longitude");

  if (!rawLatitude && !rawLongitude) {
    return { latitude: null, longitude: null };
  }
  if (!rawLatitude || !rawLongitude) {
    return {
      latitude: null,
      longitude: null,
      error: "Indica latitud y longitud juntas.",
    };
  }

  const latitude = Number(rawLatitude);
  const longitude = Number(rawLongitude);

  if (!Number.isFinite(latitude) || latitude < -90 || latitude > 90) {
    return {
      latitude: null,
      longitude: null,
      error: "La latitud debe estar entre -90 y 90.",
    };
  }
  if (!Number.isFinite(longitude) || longitude < -180 || longitude > 180) {
    return {
      latitude: null,
      longitude: null,
      error: "La longitud debe estar entre -180 y 180.",
    };
  }

  return { latitude, longitude };
}

async function platformToken(): Promise<string | null> {
  const session = await getSession();
  if (!session || session.scope !== "platform") return null;
  return session.token;
}

export async function createTenantAction(
  _previous: string | null,
  formData: FormData,
): Promise<string | null> {
  const token = await platformToken();
  if (!token) return "La sesión de plataforma expiró.";

  const name = value(formData, "name");
  const timezone = value(formData, "timezone") || "America/Mexico_City";
  const currency = value(formData, "currency") || "MXN";
  const adminName = value(formData, "adminName");
  const adminEmail = value(formData, "adminEmail");
  const adminPassword = value(formData, "adminPassword");
  const coords = coordinates(formData);

  if (!name || !adminName || !adminEmail || !adminPassword) {
    return "Completa los datos de la clínica y del administrador.";
  }
  if (coords.error) return coords.error;
  if (adminPassword.length < 8) {
    return "La contraseña debe tener al menos 8 caracteres.";
  }

  try {
    await api("/api/v1/platform/clinics", {
      method: "POST",
      token,
      body: {
        name,
        timezone,
        currency,
        latitude: coords.latitude,
        longitude: coords.longitude,
        admin: {
          fullName: adminName,
          email: adminEmail,
          password: adminPassword,
        },
      },
    });
  } catch (error) {
    if (error instanceof ApiError) return error.message;
    return "No se pudo crear el tenant.";
  }

  revalidatePath("/platform");
  return null;
}

export async function updateTenantAction(
  _previous: string | null,
  formData: FormData,
): Promise<string | null> {
  const token = await platformToken();
  if (!token) return "La sesión de plataforma expiró.";

  const clinicId = value(formData, "clinicId");
  const name = value(formData, "name");
  const timezone = value(formData, "timezone");
  const currency = value(formData, "currency");
  const isActive = formData.get("isActive") === "on";
  const coords = coordinates(formData);

  if (!clinicId) return "Falta el tenant.";
  if (!name) return "El nombre es obligatorio.";
  if (coords.error) return coords.error;

  try {
    await api(`/api/v1/platform/clinics/${clinicId}`, {
      method: "PATCH",
      token,
      body: {
        name,
        timezone,
        currency,
        latitude: coords.latitude,
        longitude: coords.longitude,
        isActive,
      },
    });
  } catch (error) {
    if (error instanceof ApiError) return error.message;
    return "No se pudo actualizar el tenant.";
  }

  revalidatePath("/platform");
  revalidatePath(`/platform/tenants/${clinicId}`);
  return null;
}

export async function toggleTenantAction(
  clinicId: string,
  isActive: boolean,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const token = await platformToken();
  if (!token) return { ok: false, error: "La sesión de plataforma expiró." };

  try {
    await api(`/api/v1/platform/clinics/${clinicId}`, {
      method: "PATCH",
      token,
      body: { isActive },
    });
  } catch (error) {
    return {
      ok: false,
      error:
        error instanceof ApiError
          ? error.message
          : "No se pudo cambiar el estado del tenant.",
    };
  }

  revalidatePath("/platform");
  revalidatePath(`/platform/tenants/${clinicId}`);
  return { ok: true };
}

export async function createTenantUserAction(
  _previous: string | null,
  formData: FormData,
): Promise<string | null> {
  const token = await platformToken();
  if (!token) return "La sesión de plataforma expiró.";

  const clinicId = value(formData, "clinicId");
  const fullName = value(formData, "fullName");
  const email = value(formData, "email");
  const password = value(formData, "password");
  const role = value(formData, "role");
  const practitionerId = value(formData, "practitionerId");

  if (!clinicId) return "Falta el tenant.";
  if (!fullName || !email || !password) {
    return "Completa nombre, correo y contraseña.";
  }
  if (password.length < 8) {
    return "La contraseña debe tener al menos 8 caracteres.";
  }
  if (role === "practitioner" && !practitionerId) {
    return "Selecciona el especialista.";
  }

  try {
    await api(`/api/v1/platform/clinics/${clinicId}/users`, {
      method: "POST",
      token,
      body: {
        fullName,
        email,
        password,
        role,
        ...(role === "practitioner" ? { practitionerId } : {}),
      },
    });
  } catch (error) {
    if (error instanceof ApiError) return error.message;
    return "No se pudo crear el usuario.";
  }

  revalidatePath(`/platform/tenants/${clinicId}`);
  return null;
}

export async function updateTenantUserAction(
  _previous: string | null,
  formData: FormData,
): Promise<string | null> {
  const token = await platformToken();
  if (!token) return "La sesión de plataforma expiró.";

  const clinicId = value(formData, "clinicId");
  const userId = value(formData, "userId");
  const fullName = value(formData, "fullName");
  const email = value(formData, "email");
  const password = value(formData, "password");
  const role = value(formData, "role");
  const practitionerId = value(formData, "practitionerId");

  if (!clinicId || !userId) return "Falta el usuario.";
  if (!fullName || !email) return "Nombre y correo son obligatorios.";
  if (password && password.length < 8) {
    return "La contraseña debe tener al menos 8 caracteres.";
  }
  if (role === "practitioner" && !practitionerId) {
    return "Selecciona el especialista.";
  }

  try {
    await api(`/api/v1/platform/clinics/${clinicId}/users/${userId}`, {
      method: "PATCH",
      token,
      body: {
        fullName,
        email,
        role,
        ...(password ? { password } : {}),
        ...(role === "practitioner" ? { practitionerId } : { practitionerId: null }),
      },
    });
  } catch (error) {
    if (error instanceof ApiError) return error.message;
    return "No se pudo actualizar el usuario.";
  }

  revalidatePath(`/platform/tenants/${clinicId}`);
  return null;
}

export async function toggleTenantUserAction(
  clinicId: string,
  userId: string,
  isActive: boolean,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const token = await platformToken();
  if (!token) return { ok: false, error: "La sesión de plataforma expiró." };

  try {
    await api(`/api/v1/platform/clinics/${clinicId}/users/${userId}`, {
      method: "PATCH",
      token,
      body: { isActive },
    });
  } catch (error) {
    return {
      ok: false,
      error:
        error instanceof ApiError
          ? error.message
          : "No se pudo cambiar el estado del usuario.",
    };
  }

  revalidatePath(`/platform/tenants/${clinicId}`);
  return { ok: true };
}

export async function uploadTenantContractAction(
  _previous: string | null,
  formData: FormData,
): Promise<string | null> {
  const token = await platformToken();
  if (!token) return "La sesión de plataforma expiró.";

  const clinicId = value(formData, "clinicId");
  const name = value(formData, "name");
  const startsAt = value(formData, "startsAt");
  const endsAt = value(formData, "endsAt");
  const notes = value(formData, "notes");
  const file = formData.get("file");

  if (!clinicId) return "Falta el tenant.";
  if (!name || !startsAt) {
    return "Completa el nombre y la fecha de inicio.";
  }
  if (!(file instanceof File) || file.size === 0) {
    return "Adjunta el archivo del contrato.";
  }
  if (file.size > 10 * 1024 * 1024) {
    return "El archivo supera el límite de 10 MB.";
  }

  const body = new FormData();
  body.append("name", name);
  body.append("startsAt", startsAt);
  if (endsAt) body.append("endsAt", endsAt);
  if (notes) body.append("notes", notes);
  body.append("isActive", "true");
  body.append("file", file, file.name);

  try {
    const response = await fetch(
      `${API_URL}/api/v1/platform/clinics/${clinicId}/contracts`,
      {
        method: "POST",
        headers: { authorization: `Bearer ${token}` },
        body,
        cache: "no-store",
      },
    );

    if (!response.ok) {
      const payload = (await response.json().catch(() => null)) as {
        error?: { message?: string };
      } | null;
      return payload?.error?.message ?? "No se pudo subir el contrato.";
    }
  } catch {
    return "No se pudo conectar con el servidor.";
  }

  revalidatePath("/platform");
  revalidatePath(`/platform/tenants/${clinicId}`);
  return null;
}

export async function deleteTenantContractAction(
  formData: FormData,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const token = await platformToken();
  if (!token) return { ok: false, error: "La sesión de plataforma expiró." };

  const clinicId = value(formData, "clinicId");
  const contractId = value(formData, "contractId");

  if (!clinicId || !contractId) {
    return { ok: false, error: "Falta el contrato o el tenant." };
  }

  try {
    await api(
      `/api/v1/platform/clinics/${clinicId}/contracts/${contractId}`,
      { method: "DELETE", token },
    );
  } catch (error) {
    return {
      ok: false,
      error:
        error instanceof ApiError
          ? error.message
          : "No se pudo eliminar el contrato.",
    };
  }

  revalidatePath("/platform");
  revalidatePath(`/platform/tenants/${clinicId}`);
  return { ok: true };
}
