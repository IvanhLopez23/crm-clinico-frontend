"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { api, ApiError } from "@/lib/api";
import { SESSION_COOKIE } from "@/lib/session";

export async function loginAction(
  _previous: string | null,
  formData: FormData,
): Promise<string | null> {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");

  if (!email || !password) {
    return "Completa correo y contrasena.";
  }

  let destination = "/";

  try {
    const result = await api<{
      token: string;
      user: { role: string };
    }>("/api/v1/auth/login", {
      method: "POST",
      body: { email, password },
    });

    const store = await cookies();
    store.set(SESSION_COOKIE, result.token, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 60 * 60 * 8,
    });

    destination = result.user.role === "platform_admin" ? "/platform" : "/";
  } catch (error) {
    if (error instanceof ApiError && error.status === 401) {
      return "Correo o contrasena incorrectos.";
    }
    if (error instanceof ApiError && error.status === 403) {
      return error.message;
    }
    return "No se pudo conectar con el servidor. Intenta de nuevo.";
  }

  redirect(destination);
}

export async function logoutAction(): Promise<void> {
  const store = await cookies();
  store.delete(SESSION_COOKIE);
  redirect("/login");
}
