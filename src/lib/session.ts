import { cookies } from "next/headers";
import { cache } from "react";
import { api } from "./api";

export const SESSION_COOKIE = "crm_session";

export type SessionRole = "admin" | "practitioner" | "receptionist" | "platform_admin";

export type SessionUser = {
  userId: string;
  clinicId: string;
  role: SessionRole;
  practitionerId: string | null;
  email: string;
  fullName: string;
  avatarData: string | null;
};

export type Clinic = {
  id: string;
  name: string;
  slug?: string;
  timezone: string;
};

export type Session = {
  token: string;
  scope: "tenant" | "platform";
  user: SessionUser;
  clinic: Clinic;
};

type TenantMe = {
  scope: "tenant";
  userId: string;
  clinicId: string;
  role: "admin" | "practitioner" | "receptionist";
  practitionerId: string | null;
  email: string;
  fullName: string;
  avatarData: string | null;
};

type PlatformMe = {
  scope: "platform";
  userId: string;
  platformAdminId: string;
  email: string;
  fullName: string;
  role: "platform_admin";
  avatarData: null;
};

const PLATFORM_CLINIC: Clinic = {
  id: "",
  name: "Plataforma",
  timezone: "America/Mexico_City",
};

/**
 * Sesion por request: lee la cookie httpOnly y valida contra el backend.
 * Devuelve null si el token falta o expiro; las paginas deciden redirigir.
 */
export const getSession = cache(async (): Promise<Session | null> => {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE)?.value;

  if (!token) return null;

  try {
    const me = await api<TenantMe | PlatformMe>("/api/v1/auth/me", { token });

    if (me.scope === "platform") {
      return {
        token,
        scope: "platform",
        user: {
          userId: me.userId,
          clinicId: "",
          role: "platform_admin",
          practitionerId: null,
          email: me.email,
          fullName: me.fullName,
          avatarData: null,
        },
        clinic: PLATFORM_CLINIC,
      };
    }

    const clinic = await api<Clinic>("/api/v1/clinic", { token });

    return {
      token,
      scope: "tenant",
      user: {
        userId: me.userId,
        clinicId: me.clinicId,
        role: me.role,
        practitionerId: me.practitionerId,
        email: me.email,
        fullName: me.fullName,
        avatarData: me.avatarData,
      },
      clinic,
    };
  } catch (error) {
    console.warn(
      "[session] error",
      error instanceof Error ? error.message : error,
    );
    return null;
  }
});
