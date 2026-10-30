import {
  AlertTriangle,
  CalendarDays,
  Home,
  IdCard,
  Mail,
  Phone,
  ShieldCheck,
  Tag,
} from "lucide-react";
import { StatusBadge } from "@/components/status-badge";
import { ageFromBirthDate, initials } from "@/lib/format";
import { getI18n } from "@/i18n/server";
import type { PatientDetail } from "@/lib/types";

export async function PatientHeader({ patient }: { patient: PatientDetail }) {
  const { t, locale } = await getI18n();
  const age = ageFromBirthDate(patient.birthDate);
  const critical = patient.allergies.filter(
    (allergy) => allergy.severity === "severe" || allergy.severity === "anaphylaxis",
  );
  const primaryPhone = patient.contacts.find(
    (contact) => contact.kind === "phone" && contact.isPrimary,
  );
  const primaryEmail = patient.contacts.find(
    (contact) => contact.kind === "email" && contact.isPrimary,
  );

  return (
    <div className="space-y-4">
      {critical.length > 0 ? (
        <div
          role="alert"
          className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-rose-800"
        >
          <div className="flex items-start gap-3">
            <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0" aria-hidden />
            <div>
              <p className="text-sm font-semibold">{t("patients.criticalAllergy")}</p>
              <p className="mt-0.5 text-sm">
                {critical.map((allergy) => allergy.allergen).join(" · ")}
                {" — "}
                {t("patients.criticalAllergyHint")}
              </p>
            </div>
          </div>
        </div>
      ) : null}

      <section className="card overflow-hidden">
        <div className="flex flex-wrap items-start justify-between gap-4 p-5">
          <div className="flex items-start gap-4">
            <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-100 text-lg font-semibold text-brand-800">
              {initials(`${patient.firstName} ${patient.lastName}`)}
            </span>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-2xl font-semibold tracking-tight">
                  {patient.preferredName ?? patient.firstName} {patient.lastName}
                </h1>
                <StatusBadge status={patient.status} />
              </div>
              <p className="mt-1 text-sm text-muted">
                {age !== null ? t("patients.years", { age }) : t("patients.ageUnknown")}
                {patient.sexAtBirth ? ` · ${patient.sexAtBirth}` : ""}
                {patient.bloodType ? ` · ${patient.bloodType}` : ""}
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                {patient.tags.map((tag) => (
                  <span
                    key={tag.id}
                    className="inline-flex items-center gap-1 rounded-full bg-brand-50 px-2.5 py-0.5 text-xs font-medium text-brand-800 ring-1 ring-inset ring-brand-200"
                  >
                    <Tag className="h-3 w-3" aria-hidden />
                    {tag.label}
                  </span>
                ))}
                {patient.tags.length === 0 ? (
                  <span className="text-xs text-muted">{t("patients.noTags")}</span>
                ) : null}
              </div>
            </div>
          </div>

          <div className="grid gap-1.5 text-sm text-muted">
            {primaryPhone ? (
              <span className="inline-flex items-center gap-2">
                <Phone className="h-3.5 w-3.5" aria-hidden />
                {primaryPhone.valueMasked}
              </span>
            ) : null}
            {primaryEmail ? (
              <span className="inline-flex items-center gap-2">
                <Mail className="h-3.5 w-3.5" aria-hidden />
                {primaryEmail.valueMasked}
              </span>
            ) : null}
            {patient.household ? (
              <span className="inline-flex items-center gap-2">
                <Home className="h-3.5 w-3.5" aria-hidden />
                {patient.household.name}
              </span>
            ) : null}
            {patient.documentMasked ? (
              <span className="inline-flex items-center gap-2">
                <IdCard className="h-3.5 w-3.5" aria-hidden />
                {patient.documentMasked}
              </span>
            ) : null}
            <span className="inline-flex items-center gap-2">
              <CalendarDays className="h-3.5 w-3.5" aria-hidden />
              {patient.lastVisitAt
                ? t("patients.lastVisit", { date: new Date(patient.lastVisitAt).toLocaleDateString(locale === "en" ? "en-US" : "es-MX") })
                : t("patients.noVisits")}
            </span>
            <span className="inline-flex items-center gap-2">
              <ShieldCheck className="h-3.5 w-3.5" aria-hidden />
              {patient.reminderOptOut ? t("patients.remindersOff") : t("patients.remindersOn")}
            </span>
          </div>
        </div>
      </section>
    </div>
  );
}
