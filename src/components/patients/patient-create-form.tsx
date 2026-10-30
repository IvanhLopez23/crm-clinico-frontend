"use client";

import { LoaderCircle, UserPlus } from "lucide-react";
import { useActionState, useState } from "react";
import { createPatientAction } from "@/app/actions/patients";
import { DatePicker } from "@/components/ui/date-picker";
import { Modal } from "@/components/ui/modal";
import { useI18n } from "@/i18n/client";

const inputClass =
  "focus-ring w-full rounded-xl border border-line bg-surface px-3 py-2 text-sm shadow-sm placeholder:text-slate-400";

export function PatientCreateForm() {
  const { t } = useI18n();
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="focus-ring inline-flex items-center gap-2 rounded-xl bg-brand-700 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-brand-800"
      >
        <UserPlus className="h-4 w-4" aria-hidden />
        {t("patients.createTitle")}
      </button>

      {open ? <PatientCreateDialog onClose={() => setOpen(false)} /> : null}
    </>
  );
}

function PatientCreateDialog({ onClose }: { onClose: () => void }) {
  const { t } = useI18n();
  const [error, formAction, pending] = useActionState(createPatientAction, null);

  return (
    <Modal
      title={t("patients.createTitle")}
      description={t("patients.createHint")}
      onClose={onClose}
    >
      <form
        action={formAction}
        className="grid gap-4 sm:grid-cols-2"
        noValidate
      >
        <div className="space-y-1.5">
          <label htmlFor="firstName" className="text-xs font-medium text-muted">
            {t("patients.firstName")} *
          </label>
          <input
            id="firstName"
            name="firstName"
            required
            autoFocus
            className={inputClass}
          />
        </div>

        <div className="space-y-1.5">
          <label htmlFor="lastName" className="text-xs font-medium text-muted">
            {t("patients.lastName")} *
          </label>
          <input id="lastName" name="lastName" required className={inputClass} />
        </div>

        <div className="space-y-1.5">
          <label htmlFor="birthDate" className="text-xs font-medium text-muted">
            {t("patients.birthDate")}
          </label>
          <DatePicker
            id="birthDate"
            name="birthDate"
            placeholder={t("common.selectDate")}
            disableFuture
          />
        </div>

        <div className="space-y-1.5">
          <label htmlFor="phone" className="text-xs font-medium text-muted">{t("patients.phone")}</label>
          <input
            id="phone"
            name="phone"
            type="tel"
            placeholder="+52 55 1234 5678"
            className={inputClass}
          />
        </div>

        <div className="space-y-1.5">
          <label htmlFor="email" className="text-xs font-medium text-muted">
            {t("patients.email")}
          </label>
          <input id="email" name="email" type="email" className={inputClass} />
        </div>

        <div className="space-y-1.5">
          <label
            htmlFor="documentType"
            className="text-xs font-medium text-muted"
          >
            {t("patients.document")}
          </label>
          <select id="documentType" name="documentType" className={inputClass}>
            <option value="">{t("patients.noDocument")}</option>
            <option value="ine">{t("patients.docIne")}</option>
            <option value="passport">{t("patients.docPassport")}</option>
            <option value="curp">{t("patients.docCurp")}</option>
            <option value="ssn">{t("patients.docSsn")}</option>
            <option value="other">{t("patients.other")}</option>
          </select>
        </div>

        <div className="space-y-1.5 sm:col-span-2">
          <label
            htmlFor="documentNumber"
            className="text-xs font-medium text-muted"
          >{t("patients.documentNumber")}</label>
          <input
            id="documentNumber"
            name="documentNumber"
            className={inputClass}
            autoComplete="off"
          />
        </div>

        <div className="rounded-xl border border-line bg-canvas px-3.5 py-3 sm:col-span-2">
          <p className="text-xs font-medium">{t("patients.guardian")}</p>
          <p className="mt-1 text-xs text-muted">
            Obligatorio si el paciente es menor de 18 años. Se guarda cifrado.
          </p>

          <div className="mt-3 grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <label
                htmlFor="guardianName"
                className="text-xs font-medium text-muted"
              >
                {t("patients.guardianName")}
              </label>
              <input
                id="guardianName"
                name="guardianName"
                className={inputClass}
              />
            </div>

            <div className="space-y-1.5">
              <label
                htmlFor="guardianRelationship"
                className="text-xs font-medium text-muted"
              >
                {t("patients.relationship")}
              </label>
              <select
                id="guardianRelationship"
                name="guardianRelationship"
                className={inputClass}
                defaultValue="parent"
              >
                <option value="parent">{t("patients.parent")}</option>
                <option value="legal_guardian">{t("patients.legalGuardian")}</option>
                <option value="caregiver">{t("patients.caregiver")}</option>
                <option value="other">{t("patients.other")}</option>
              </select>
            </div>

            <div className="space-y-1.5 sm:col-span-2">
              <label
                htmlFor="guardianPhone"
                className="text-xs font-medium text-muted"
              >{t("patients.guardianPhone")}</label>
              <input
                id="guardianPhone"
                name="guardianPhone"
                type="tel"
                className={inputClass}
              />
            </div>
          </div>
        </div>

        {error ? (
          <p
            role="alert"
            className="rounded-xl border border-rose-200 bg-rose-50 px-3.5 py-2.5 text-sm text-rose-700 sm:col-span-2"
          >
            {error}
          </p>
        ) : null}

        <div className="flex flex-col-reverse gap-2 border-t border-line pt-4 sm:col-span-2 sm:flex-row sm:justify-end">
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
            className="focus-ring inline-flex items-center justify-center gap-2 rounded-xl bg-brand-700 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-brand-800 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {pending ? (
              <LoaderCircle className="h-4 w-4 animate-spin" aria-hidden />
            ) : null}
            {pending ? t("patients.creating") : t("patients.create")}
          </button>
        </div>
      </form>
    </Modal>
  );
}
