"use server";

import { revalidatePath } from "next/cache";
import { api, ApiError } from "@/lib/api";
import { getSession } from "@/lib/session";

export async function updateMyProfileAction(input: {
  fullName?: string;
  email?: string;
  password?: string;
  avatarData?: string | null;
}): Promise<{ ok: true } | { ok: false; error: string }> {
  const session = await getSession();
  if (!session) return { ok: false, error: "La sesion expiro." };

  try {
    await api("/api/v1/users/me", {
      method: "PATCH",
      token: session.token,
      body: {
        ...(input.fullName ? { fullName: input.fullName } : {}),
        ...(input.email ? { email: input.email } : {}),
        ...(input.password ? { password: input.password } : {}),
        ...(input.avatarData !== undefined
          ? { avatarData: input.avatarData }
          : {}),
      },
    });
  } catch (error) {
    return {
      ok: false,
      error:
        error instanceof ApiError
          ? error.message
          : "No se pudo actualizar tu perfil.",
    };
  }

  revalidatePath("/mi-dia");
  return { ok: true };
}
