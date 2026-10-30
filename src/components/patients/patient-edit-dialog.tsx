"use client";

import { LoaderCircle, Pencil, Save, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { updatePatientAction } from "@/app/actions/patients";
import { DatePicker } from "@/components/ui/date-picker";
import { useToastActionState } from "@/lib/use-toast-action";
import { useI18n } from "@/i18n/client";
import type { PatientDetail } from "@/lib/types";

const inputClass =
  "focus-ring w-full rounded-xl border border-line bg-surface px-3.5 py-2.5 text-sm shadow-sm placeholder:text-slate-400";

const SEX_OPTIONS = [
  { value: "", labelKey: "patients.sexUnspecified" },
  { value: "female", labelKey: "patients.sexFemale" },
  { value: "male", labelKey: "patients.sexMale" },
  { value: "intersex", labelKey: "patients.sexIntersex" },
  { value: "unknown", labelKey: "patients.sexUnknown" },
] as const;

const DOCUMENT_OPTIONS = [
  { value: "", labelKey: "patients.noDocument" },
  { value: "ine", labelKey: "patients.docIne" },
  { value: "passport", labelKey: "patients.docPassport" },
  { value: "curp", labelKey: "patients.docCurp" },
  { value: "ssn", labelKey: "patients.docSsn" },
  { value: "other", labelKey: "patients.other" },
] as const;

export function PatientEditButton({
  patient,
  canEdit,
}: {
  patient: PatientDetail;
  canEdit: boolean;
}) {
  const { t } = useI18n();
  const [open, setOpen] = useState(false);

  if (!canEdit) return null;

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="focus-ring inline-flex items-center gap-2 rounded-xl border border-line bg-surface px-4 py-2 text-sm font-semibold text-ink shadow-sm hover:border-brand-200 hover:text-brand-800"
      >
        <Pencil className="h-4 w-4" aria-hidden />
        {t("patients.editTitle")}
      </button>

      {open ? (
        <PatientEditDialog
          patient={patient}
          onClose={() => setOpen(false)}
        />
      ) : null}
    </>
  );
}

function PatientEditDialog({
  patient,
  onClose,
}: {
  patient: PatientDetail;
  onClose: () => void;
}) {
  const router = useRouter();
  const { t } = useI18n();
  const [error, formAction, pending] = useToastActionState(
    updatePatientAction,
    t("patients.updatedToast"),
    () => {
      router.refresh();
      onClose();
    },
  );

  const primaryPhone = patient.contacts.find(
    (contact) => contact.kind === "phone" && contact.isPrimary,
  );
  const primaryEmail = patient.contacts.find(
    (contact) => contact.kind === "email" && contact.isPrimary,
  );

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/30 p-4 dark:bg-black/60">
      <button
        type="button"
        aria-label={t("common.close")}
        className="absolute inset-0 cursor-default"
        onClick={onClose}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-label={t("patients.editTitle")}
        className="relative z-10 max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-2xl border border-line bg-surface shadow-2xl"
      >
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-line bg-surface px-6 py-5">
          <div>
            <p className="text-xs text-muted">{t("common.patient")}</p>
            <h2 className="mt-0.5 text-lg font-semibold">{t("patients.editTitle")}</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="focus-ring rounded-lg p-2 text-muted hover:bg-canvas hover:text-ink"
            aria-label={t("common.close")}
          >
            <X className="h-5 w-5" aria-hidden />
          </button>
        </div>

        <form action={formAction} className="space-y-6 p-6 sm:p-7" noValidate>
          <input type="hidden" name="patientId" value={patient.id} />

          <section className="space-y-4">
            <div>
              <h3 className="text-sm font-semibold">{t("patients.personalData")}</h3>
              <p className="mt-0.5 text-xs text-muted">
                Nombre, fecha de nacimiento y datos clínicos básicos.
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <label className="space-y-1.5 text-sm font-medium">
                {t("patients.firstName")} *
                <input
                  name="firstName"
                  defaultValue={patient.firstName}
                  required
                  className={inputClass}
                />
              </label>

              <label className="space-y-1.5 text-sm font-medium">
                {t("patients.lastName")} *
                <input
                  name="lastName"
                  defaultValue={patient.lastName}
                  required
                  className={inputClass}
                />
              </label>

              <label className="space-y-1.5 text-sm font-medium">
                {t("patients.preferredName")}
                <input
                  name="preferredName"
                  defaultValue={patient.preferredName ?? ""}
                  className={inputClass}
                  placeholder={t("patients.preferredNameHint")}
                />
              </label>

              <label className="space-y-1.5 text-sm font-medium">
                {t("patients.birthDate")}
                <DatePicker
                  name="birthDate"
                  defaultValue={patient.birthDate ?? ""}
                  placeholder={t("common.selectDate")}
                  disableFuture
                />
              </label>

              <label className="space-y-1.5 text-sm font-medium">
                {t("patients.sexAtBirth")}
                <select
                  name="sexAtBirth"
                  defaultValue={patient.sexAtBirth ?? ""}
                  className={inputClass}
                >
                  {SEX_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {t(option.labelKey)}
                    </option>
                  ))}
                </select>
              </label>

              <label className="space-y-1.5 text-sm font-medium">
                Identidad de género
                <input
                  name="genderIdentity"
                  defaultValue={patient.genderIdentity ?? ""}
                  className={inputClass}
                  placeholder={t("common.optional")}
                />
              </label>

              <label className="space-y-1.5 text-sm font-medium">
                {t("patients.bloodType")}
                <input
                  name="bloodType"
                  defaultValue={patient.bloodType ?? ""}
                  maxLength={8}
                  className={inputClass}
                  placeholder={t("patients.bloodTypeHint")}
                />
              </label>

              <label className="space-y-1.5 text-sm font-medium">
                {t("patients.language")}
                <input
                  name="preferredLanguage"
                  defaultValue={patient.preferredLanguage}
                  className={inputClass}
                  placeholder="es"
                />
              </label>

              <label className="space-y-1.5 text-sm font-medium sm:col-span-2">
                {t("patients.source")}
                <input
                  name="source"
                  defaultValue={patient.source ?? ""}
                  className={inputClass}
                  placeholder={t("patients.sourceHint")}
                />
              </label>
            </div>
          </section>

          <section className="space-y-4 border-t border-line pt-5">
            <div>
              <h3 className="text-sm font-semibold">{t("patients.document")}</h3>
              <p className="mt-0.5 text-xs text-muted">
                {patient.documentMasked
                  ? t("patients.documentCurrent", { value: patient.documentMasked })
                  : t("patients.documentNone")}
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <label className="space-y-1.5 text-sm font-medium">
                Tipo
                <select
                  name="documentType"
                  defaultValue={patient.documentType ?? ""}
                  className={inputClass}
                >
                  {DOCUMENT_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {t(option.labelKey)}
                    </option>
                  ))}
                </select>
              </label>

              <label className="space-y-1.5 text-sm font-medium">
                {t("patients.newNumber")}
                <input
                  name="documentNumber"
                  className={inputClass}
                  placeholder={t("common.optional")}
                  autoComplete="off"
                />
              </label>
            </div>
          </section>

          <section className="space-y-4 border-t border-line pt-5">
            <div>
              <h3 className="text-sm font-semibold">{t("patients.contactData")}</h3>
              <p className="mt-0.5 text-xs text-muted">
                Los datos actuales se muestran enmascarados. Escribe un valor
                nuevo solo si deseas reemplazarlo.
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <label className="space-y-1.5 text-sm font-medium">
                {t("patients.newPhone")}
                <input
                  name="phone"
                  type="tel"
                  className={inputClass}
                  placeholder={
                    primaryPhone ? primaryPhone.valueMasked : "Opcional"
                  }
                />
              </label>

              <label className="space-y-1.5 text-sm font-medium">
                {t("patients.newEmail")}
                <input
                  name="email"
                  type="email"
                  className={inputClass}
                  placeholder={
                    primaryEmail ? primaryEmail.valueMasked : "Opcional"
                  }
                />
              </label>
            </div>
          </section>

          <section className="border-t border-line pt-5">
            <label className="flex items-start gap-2.5 text-sm">
              <input
                type="checkbox"
                name="marketingOptIn"
                defaultChecked={patient.marketingOptIn}
                className="mt-0.5 h-4 w-4 rounded border-line"
              />
              <span>
                {t("patients.marketing")}
                <span className="mt-0.5 block text-xs font-normal text-muted">
                  {t("patients.marketingHint")}
                </span>
              </span>
            </label>
          </section>

          {error ? (
            <p
              role="alert"
              className="rounded-xl border border-rose-200 bg-rose-50 px-3.5 py-2.5 text-sm text-rose-700"
            >
              {error}
            </p>
          ) : null}

          <div className="flex flex-col-reverse gap-2 border-t border-line pt-5 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={onClose}
              className="focus-ring rounded-xl border border-line px-4 py-2.5 text-sm font-medium hover:bg-canvas"
            >
              {t("common.cancel")}
            </button>
            <button
              type="submit"
              disabled={pending}
              className="focus-ring inline-flex items-center justify-center gap-2 rounded-xl bg-brand-700 px-4 py-2.5 text-sm font-semibold text-white hover:bg-brand-800 disabled:opacity-60"
            >
              {pending ? (
                <LoaderCircle className="h-4 w-4 animate-spin" aria-hidden />
              ) : (
                <Save className="h-4 w-4" aria-hidden />
              )}
              {pending ? t("patients.saving") : t("patients.saveChanges")}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
