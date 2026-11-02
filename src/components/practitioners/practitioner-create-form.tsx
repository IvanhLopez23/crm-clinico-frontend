"use client";

import { LoaderCircle, UserRoundPlus } from "lucide-react";
import { useActionState, useState } from "react";
import { createPractitionerAction } from "@/app/actions/practitioners";
import { Modal } from "@/components/ui/modal";
import { useI18n } from "@/i18n/client";

const inputClass =
  "focus-ring w-full rounded-xl border border-line bg-surface px-3 py-2 text-sm shadow-sm";

export function PractitionerCreateForm() {
  const { t } = useI18n();
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="focus-ring inline-flex items-center gap-2 rounded-xl bg-brand-700 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-brand-800"
      >
        <UserRoundPlus className="h-4 w-4" aria-hidden />
        {t("practitioners.new")}
      </button>

      {open ? (
        <PractitionerCreateDialog onClose={() => setOpen(false)} />
      ) : null}
    </>
  );
}

function PractitionerCreateDialog({ onClose }: { onClose: () => void }) {
  const { t } = useI18n();
  const [error, formAction, pending] = useActionState(
    createPractitionerAction,
    null,
  );

  return (
    <Modal
      title={t("practitioners.new")}
      description={t("practitioners.subtitle")}
      onClose={onClose}
    >
      <form
        action={formAction}
        className="grid gap-4 sm:grid-cols-2"
        noValidate
      >
        <div className="space-y-1.5 sm:col-span-2">
          <label htmlFor="fullName" className="text-xs font-medium text-muted">
            {t("practitioners.fullName")} *
          </label>
          <input
            id="fullName"
            name="fullName"
            required
            autoFocus
            className={inputClass}
          />
        </div>

        <div className="space-y-1.5">
          <label htmlFor="specialty" className="text-xs font-medium text-muted">
            {t("practitioners.specialty")}
          </label>
          <input
            id="specialty"
            name="specialty"
            placeholder={t("practitioners.specialtyPlaceholder")}
            className={inputClass}
          />
        </div>

        <div className="space-y-1.5">
          <label htmlFor="color" className="text-xs font-medium text-muted">
            {t("practitioners.color")}
          </label>
          <input
            id="color"
            name="color"
            type="color"
            defaultValue="#0F766E"
            className="focus-ring h-10 w-full rounded-xl border border-line bg-surface px-2 py-1"
          />
        </div>

        <div className="space-y-1.5">
          <label
            htmlFor="defaultSlotMinutes"
            className="text-xs font-medium text-muted"
          >
            {t("practitioners.defaultDuration")}
          </label>
          <select
            id="defaultSlotMinutes"
            name="defaultSlotMinutes"
            defaultValue="30"
            className={inputClass}
          >
            {[15, 20, 30, 45, 60].map((minutes) => (
              <option key={minutes} value={minutes}>
                {minutes} min
              </option>
            ))}
          </select>
          <p className="text-[11px] text-muted">
            {t("practitioners.defaultDurationHint")}
          </p>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <label
              htmlFor="bufferBeforeMinutes"
              className="text-xs font-medium text-muted"
            >
              Preparación antes
            </label>
            <input
              id="bufferBeforeMinutes"
              name="bufferBeforeMinutes"
              type="number"
              min={0}
              max={120}
              defaultValue={0}
              className={inputClass}
            />
            <p className="text-[11px] text-muted">
              Tiempo para revisar la ficha o preparar el consultorio.
            </p>
          </div>
          <div className="space-y-1.5">
            <label
              htmlFor="bufferAfterMinutes"
              className="text-xs font-medium text-muted"
            >
              Cierre después
            </label>
            <input
              id="bufferAfterMinutes"
              name="bufferAfterMinutes"
              type="number"
              min={0}
              max={120}
              defaultValue={5}
              className={inputClass}
            />
            <p className="text-[11px] text-muted">
              Tiempo para notas, limpieza o esterilización.
            </p>
          </div>
        </div>

        <div className="rounded-xl border border-line bg-canvas px-3.5 py-3 text-xs leading-relaxed text-muted sm:col-span-2">
          <p className="font-medium text-ink">{t("practitioners.blockHow")}</p>
          <p className="mt-1">
            {t("practitioners.blockHowText", {
              slot: 30,
              prep: 5,
              close: 10,
              total: 45,
            })}
          </p>
        </div>

        <label className="flex items-center gap-2 text-sm sm:col-span-2">
          <input
            type="checkbox"
            name="isAcceptingNewPatients"
            defaultChecked
            className="h-4 w-4 rounded border-line text-brand-700"
          />
          {t("practitioners.acceptsNew")}
        </label>

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
            className="focus-ring inline-flex items-center justify-center gap-2 rounded-xl bg-brand-700 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-brand-800 disabled:opacity-60"
          >
            {pending ? (
              <LoaderCircle className="h-4 w-4 animate-spin" aria-hidden />
            ) : null}
            {pending ? t("agenda.creating") : t("practitioners.create")}
          </button>
        </div>
      </form>
    </Modal>
  );
}
