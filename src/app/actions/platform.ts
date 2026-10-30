"use server";

import { revalidatePath } from "next/cache";
import { api, ApiError } from "@/lib/api";
import { getSession } from "@/lib/session";

function value(formData: FormData, key: string): string {
  return String(formData.get(key) ?? "").trim();
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

  if (!name || !adminName || !adminEmail || !adminPassword) {
    return "Completa los datos de la clínica y del administrador.";
  }
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

  if (!clinicId) return "Falta el tenant.";
  if (!name) return "El nombre es obligatorio.";

  try {
    await api(`/api/v1/platform/clinics/${clinicId}`, {
      method: "PATCH",
      token,
      body: { name, timezone, currency, isActive },
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
