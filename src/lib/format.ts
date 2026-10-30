import { DateTime } from "luxon";

export type StatusMeta = {
  label: string;
  className: string;
};

export const STATUS_META: Record<string, StatusMeta> = {
  requested: {
    label: "Solicitada",
    className: "bg-amber-50 text-amber-800 ring-amber-200",
  },
  confirmed: {
    label: "Confirmada",
    className: "bg-emerald-50 text-emerald-800 ring-emerald-200",
  },
  arrived: {
    label: "En sala",
    className: "bg-blue-50 text-blue-800 ring-blue-200",
  },
  in_consultation: {
    label: "En consulta",
    className: "bg-teal-50 text-teal-800 ring-teal-200",
  },
  completed: {
    label: "Atendida",
    className: "bg-slate-100 text-slate-700 ring-slate-200",
  },
  cancelled: {
    label: "Cancelada",
    className: "bg-rose-50 text-rose-700 ring-rose-200",
  },
  no_show: {
    label: "No asistio",
    className: "bg-rose-50 text-rose-700 ring-rose-200",
  },
  active: {
    label: "Activo",
    className: "bg-emerald-50 text-emerald-800 ring-emerald-200",
  },
  lead: {
    label: "Prospecto",
    className: "bg-amber-50 text-amber-800 ring-amber-200",
  },
  inactive: {
    label: "Inactivo",
    className: "bg-slate-100 text-slate-700 ring-slate-200",
  },
  blocked: {
    label: "Bloqueado",
    className: "bg-rose-50 text-rose-700 ring-rose-200",
  },
  deceased: {
    label: "Fallecido",
    className: "bg-slate-100 text-slate-700 ring-slate-200",
  },
};

export function statusMeta(status: string): StatusMeta {
  return (
    STATUS_META[status] ?? {
      label: status,
      className: "bg-slate-100 text-slate-700 ring-slate-200",
    }
  );
}

export const ROLE_LABEL: Record<string, string> = {
  admin: "Administracion",
  practitioner: "Especialista",
  receptionist: "Recepcion",
  platform_admin: "Plataforma",
};

export function initials(fullName: string): string {
  return fullName
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

export function ageFromBirthDate(birthDate: string | null): number | null {
  if (!birthDate) return null;
  const birth = DateTime.fromISO(birthDate, { zone: "utc" });
  if (!birth.isValid) return null;
  return Math.max(0, Math.floor(DateTime.utc().diff(birth, "years").years));
}

export function money(cents: number, currency = "MXN"): string {
  return new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency,
    maximumFractionDigits: 2,
  }).format(cents / 100);
}
