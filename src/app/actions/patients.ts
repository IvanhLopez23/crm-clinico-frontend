"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { api, ApiError } from "@/lib/api";
import { getSession } from "@/lib/session";
import type { PatientDetail, PatientSearchResult } from "@/lib/types";

function value(formData: FormData, key: string): string {
  return String(formData.get(key) ?? "").trim();
}

export async function createPatientAction(
  _previous: string | null,
  formData: FormData,
): Promise<string | null> {
  const session = await getSession();
  if (!session) return "La sesion expiro. Vuelve a entrar.";

  const firstName = value(formData, "firstName");
  const lastName = value(formData, "lastName");
  if (!firstName || !lastName) {
    return "Nombre y apellido son obligatorios.";
  }

  const guardianName = value(formData, "guardianName");
  const guardianPhone = value(formData, "guardianPhone");

  const body = {
    firstName,
    lastName,
    ...(value(formData, "birthDate")
      ? { birthDate: value(formData, "birthDate") }
      : {}),
    ...(value(formData, "phone") ? { phone: value(formData, "phone") } : {}),
    ...(value(formData, "email") ? { email: value(formData, "email") } : {}),
    ...(value(formData, "documentType")
      ? { documentType: value(formData, "documentType") }
      : {}),
    ...(value(formData, "documentNumber")
      ? { documentNumber: value(formData, "documentNumber") }
      : {}),
    ...(guardianName
      ? {
          guardian: {
            name: guardianName,
            relationship: value(formData, "guardianRelationship") || "parent",
            isLegalGuardian: true,
            ...(guardianPhone ? { phone: guardianPhone } : {}),
          },
        }
      : {}),
  };

  let created: PatientDetail;
  try {
    created = await api<PatientDetail>("/api/v1/patients", {
      method: "POST",
      token: session.token,
      body,
    });
  } catch (error) {
    if (error instanceof ApiError) return error.message;
    return "No se pudo crear el paciente.";
  }

  revalidatePath("/pacientes");
  redirect(`/pacientes/${created.id}?created=1`);
}

export async function updatePatientAction(
  _previous: string | null,
  formData: FormData,
): Promise<string | null> {
  const session = await getSession();
  if (!session) return "La sesion expiro. Vuelve a entrar.";
  if (session.user.role === "practitioner") {
    return "Solo administracion o recepcion pueden editar pacientes.";
  }

  const patientId = value(formData, "patientId");
  const firstName = value(formData, "firstName");
  const lastName = value(formData, "lastName");
  if (!patientId) return "Falta el paciente.";
  if (!firstName || !lastName) return "Nombre y apellido son obligatorios.";

  const phone = value(formData, "phone");
  const email = value(formData, "email");
  const documentType = value(formData, "documentType");
  const documentNumber = value(formData, "documentNumber");

  try {
    await api(`/api/v1/patients/${patientId}`, {
      method: "PATCH",
      token: session.token,
      body: {
        firstName,
        lastName,
        preferredName: value(formData, "preferredName") || null,
        birthDate: value(formData, "birthDate") || null,
        sexAtBirth: value(formData, "sexAtBirth") || null,
        genderIdentity: value(formData, "genderIdentity") || null,
        bloodType: value(formData, "bloodType") || null,
        preferredLanguage: value(formData, "preferredLanguage") || "es",
        source: value(formData, "source") || null,
        marketingOptIn: formData.get("marketingOptIn") === "on",
        ...(phone ? { phone } : {}),
        ...(email ? { email } : {}),
        ...(documentNumber
          ? { documentType: documentType || "other", documentNumber }
          : {}),
      },
    });
  } catch (error) {
    if (error instanceof ApiError) return error.message;
    return "No se pudo actualizar el paciente.";
  }

  revalidatePath("/pacientes");
  revalidatePath(`/pacientes/${patientId}`);
  revalidatePath("/agenda");
  revalidatePath("/");
  return null;
}

export async function searchPatientsAction(
  query: string,
): Promise<PatientSearchResult[]> {
  const session = await getSession();
  if (!session || query.trim().length < 2) return [];

  try {
    return await api<PatientSearchResult[]>(
      `/api/v1/patients?q=${encodeURIComponent(query.trim())}&limit=10`,
      { token: session.token },
    );
  } catch {
    return [];
  }
}

export async function createPatientQuickAction(input: {
  firstName: string;
  lastName: string;
  birthDate?: string;
  phone?: string;
  email?: string;
  documentType?: string;
  documentNumber?: string;
  guardianName?: string;
  guardianRelationship?: string;
  guardianPhone?: string;
}): Promise<
  { ok: true; patient: PatientDetail } | { ok: false; error: string }
> {
  const session = await getSession();
  if (!session) return { ok: false, error: "La sesion expiro." };

  if (!input.firstName.trim() || !input.lastName.trim()) {
    return { ok: false, error: "Nombre y apellido son obligatorios." };
  }

  try {
    const patient = await api<PatientDetail>("/api/v1/patients", {
      method: "POST",
      token: session.token,
      body: {
        firstName: input.firstName.trim(),
        lastName: input.lastName.trim(),
        ...(input.birthDate ? { birthDate: input.birthDate } : {}),
        ...(input.phone ? { phone: input.phone } : {}),
        ...(input.email ? { email: input.email } : {}),
        ...(input.documentType ? { documentType: input.documentType } : {}),
        ...(input.documentNumber
          ? { documentNumber: input.documentNumber }
          : {}),
        ...(input.guardianName
          ? {
              guardian: {
                name: input.guardianName,
                relationship: input.guardianRelationship || "parent",
                isLegalGuardian: true,
                ...(input.guardianPhone ? { phone: input.guardianPhone } : {}),
              },
            }
          : {}),
      },
    });

    revalidatePath("/pacientes");
    revalidatePath("/agenda");
    return { ok: true, patient };
  } catch (error) {
    return {
      ok: false,
      error:
        error instanceof ApiError
          ? error.message
          : "No se pudo crear el paciente.",
    };
  }
}

export async function createAllergyAction(
  _previous: string | null,
  formData: FormData,
): Promise<string | null> {
  const session = await getSession();
  if (!session) return "La sesion expiro. Vuelve a entrar.";

  const patientId = value(formData, "patientId");
  const allergen = value(formData, "allergen");
  const severity = value(formData, "severity");
  if (!patientId || !allergen || !severity) {
    return "Alergeno y severidad son obligatorios.";
  }

  try {
    await api(`/api/v1/patients/${patientId}/allergies`, {
      method: "POST",
      token: session.token,
      body: {
        allergen,
        severity,
        ...(value(formData, "reaction")
          ? { reaction: value(formData, "reaction") }
          : {}),
        ...(value(formData, "notes")
          ? { notes: value(formData, "notes") }
          : {}),
      },
    });
  } catch (error) {
    if (error instanceof ApiError) return error.message;
    return "No se pudo registrar la alergia.";
  }

  revalidatePath(`/pacientes/${patientId}`);
  return null;
}
