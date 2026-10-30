"use server";

import { revalidatePath } from "next/cache";
import { api, ApiError } from "@/lib/api";
import { getSession } from "@/lib/session";
import type { SystemUser } from "@/lib/types";

type Result = { ok: true } | { ok: false; error: string };

export async function createUserAction(input: {
  email: string;
  password: string;
  fullName: string;
  avatarData?: string | null;
  role: "admin" | "practitioner" | "receptionist";
  practitionerId?: string | null;
}): Promise<Result> {
  const session = await getSession();
  if (!session || session.user.role !== "admin") {
    return { ok: false, error: "Solo administración puede crear usuarios." };
  }

  try {
    await api<SystemUser>("/api/v1/users", {
      method: "POST",
      token: session.token,
      body: input,
    });
  } catch (error) {
    return {
      ok: false,
      error:
        error instanceof ApiError
          ? error.message
          : "No se pudo crear el usuario.",
    };
  }

  revalidatePath("/configuracion");
  return { ok: true };
}

export async function updateUserAction(input: {
  id: string;
  email?: string;
  password?: string;
  fullName?: string;
  avatarData?: string | null;
  role?: "admin" | "practitioner" | "receptionist";
  practitionerId?: string | null;
  isActive?: boolean;
}): Promise<Result> {
  const session = await getSession();
  if (!session || session.user.role !== "admin") {
    return { ok: false, error: "Solo administración puede editar usuarios." };
  }

  try {
    await api<SystemUser>(`/api/v1/users/${input.id}`, {
      method: "PATCH",
      token: session.token,
      body: {
        ...(input.email ? { email: input.email } : {}),
        ...(input.password ? { password: input.password } : {}),
        ...(input.fullName ? { fullName: input.fullName } : {}),
        ...(input.avatarData !== undefined
          ? { avatarData: input.avatarData }
          : {}),
        ...(input.role ? { role: input.role } : {}),
        ...(input.practitionerId !== undefined
          ? { practitionerId: input.practitionerId }
          : {}),
        ...(input.isActive !== undefined ? { isActive: input.isActive } : {}),
      },
    });
  } catch (error) {
    return {
      ok: false,
      error:
        error instanceof ApiError
          ? error.message
          : "No se pudo actualizar el usuario.",
    };
  }

  revalidatePath("/configuracion");
  return { ok: true };
}

export async function deactivateUserAction(id: string): Promise<Result> {
  const session = await getSession();
  if (!session || session.user.role !== "admin") {
    return { ok: false, error: "Solo administración puede desactivar usuarios." };
  }

  try {
    await api(`/api/v1/users/${id}`, {
      method: "DELETE",
      token: session.token,
    });
  } catch (error) {
    return {
      ok: false,
      error:
        error instanceof ApiError
          ? error.message
          : "No se pudo desactivar el usuario.",
    };
  }

  revalidatePath("/configuracion");
  return { ok: true };
}
