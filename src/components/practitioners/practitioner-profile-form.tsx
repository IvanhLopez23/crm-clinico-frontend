"use client";

import { LoaderCircle, Save } from "lucide-react";
import { useToastActionState } from "@/lib/use-toast-action";
import { useI18n } from "@/i18n/client";
import { updatePractitionerAction } from "@/app/actions/practitioners";
import type { Practitioner } from "@/lib/types";

const inputClass =
  "focus-ring w-full rounded-xl border border-line bg-surface px-3 py-2 text-sm shadow-sm";

export function PractitionerProfileForm({
  practitioner,
}: {
  practitioner: Practitioner;
}) {
  const { t } = useI18n();
  const [error, formAction, pending] = useToastActionState(
    updatePractitionerAction,
    t("practitioners.updatedToast"),
  );

  return (
    <form
      action={formAction}
      className="card grid gap-4 p-5 sm:grid-cols-2"
      noValidate
    >
      <input
        type="hidden"
        name="practitionerId"
        value={practitioner.id}
      />

      <div className="space-y-1.5 sm:col-span-2">
        <label htmlFor="p-fullName" className="text-xs font-medium text-muted">
          {t("practitioners.fullName")} *
        </label>
        <input
          id="p-fullName"
          name="fullName"
          defaultValue={practitioner.fullName}
          required
          className={inputClass}
        />
      </div>

      <div className="space-y-1.5">
        <label htmlFor="p-specialty" className="text-xs font-medium text-muted">
          {t("practitioners.specialty")}
        </label>
        <input
          id="p-specialty"
          name="specialty"
          defaultValue={practitioner.specialty ?? ""}
          className={inputClass}
        />
      </div>

      <div className="space-y-1.5">
        <label htmlFor="p-color" className="text-xs font-medium text-muted">
          {t("practitioners.color")}
        </label>
        <input
          id="p-color"
          name="color"
          type="color"
          defaultValue={practitioner.color ?? "#0F766E"}
          className="focus-ring h-10 w-full rounded-xl border border-line bg-surface px-2 py-1"
        />
      </div>

      <div className="space-y-1.5">
        <label
          htmlFor="p-defaultSlotMinutes"
          className="text-xs font-medium text-muted"
        >
          Duración habitual de la cita
        </label>
        <select
          id="p-defaultSlotMinutes"
          name="defaultSlotMinutes"
          defaultValue={String(practitioner.defaultSlotMinutes ?? 30)}
          className={inputClass}
        >
          {[15, 20, 30, 45, 60].map((minutes) => (
            <option key={minutes} value={minutes}>
              {minutes} min
            </option>
          ))}
        </select>
        <p className="text-[11px] text-muted">
          {t("practitioners.defaultDurationHintShort")}
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <label
            htmlFor="p-bufferBeforeMinutes"
            className="text-xs font-medium text-muted"
          >
            Preparación antes
          </label>
          <input
            id="p-bufferBeforeMinutes"
            name="bufferBeforeMinutes"
            type="number"
            min={0}
            max={120}
            defaultValue={practitioner.bufferBeforeMinutes ?? 0}
            className={inputClass}
          />
          <p className="text-[11px] text-muted">
            Revisar ficha, preparar equipo o consultorio.
          </p>
        </div>
        <div className="space-y-1.5">
          <label
            htmlFor="p-bufferAfterMinutes"
            className="text-xs font-medium text-muted"
          >
            Cierre después
          </label>
          <input
            id="p-bufferAfterMinutes"
            name="bufferAfterMinutes"
            type="number"
            min={0}
            max={120}
            defaultValue={practitioner.bufferAfterMinutes ?? 5}
            className={inputClass}
          />
          <p className="text-[11px] text-muted">
            Notas, limpieza o esterilización antes del siguiente paciente.
          </p>
        </div>
      </div>

      <div className="rounded-xl border border-line bg-canvas px-3.5 py-3 text-xs leading-relaxed text-muted sm:col-span-2">
        <p className="font-medium text-ink">{t("practitioners.blockExample")}</p>
        <p className="mt-1">
          {t("practitioners.blockExampleText", {
            slot: 30,
            prep: 5,
            close: 10,
            total: 45,
          })}
        </p>
      </div>

      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          name="isAcceptingNewPatients"
          defaultChecked={practitioner.isAcceptingNewPatients ?? true}
          className="h-4 w-4 rounded border-line text-brand-700"
        />
        {t("practitioners.acceptsNew")}
      </label>

      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          name="isActive"
          defaultChecked={practitioner.isActive ?? true}
          className="h-4 w-4 rounded border-line text-brand-700"
        />
        {t("practitioners.activeLabel")}
      </label>

      {error ? (
        <p
          role="alert"
          className="rounded-xl border border-rose-200 bg-rose-50 px-3.5 py-2.5 text-sm text-rose-700 sm:col-span-2"
        >
          {error}
        </p>
      ) : null}

      <div className="flex justify-end sm:col-span-2">
        <button
          type="submit"
          disabled={pending}
          className="focus-ring inline-flex items-center gap-2 rounded-xl bg-brand-700 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-brand-800 disabled:opacity-60"
        >
          {pending ? (
            <LoaderCircle className="h-4 w-4 animate-spin" aria-hidden />
          ) : (
            <Save className="h-4 w-4" aria-hidden />
          )}
          {pending ? t("practitioners.saving") : t("practitioners.save")}
        </button>
      </div>
    </form>
  );
}
