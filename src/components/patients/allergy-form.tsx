"use client";

import { LoaderCircle, Plus } from "lucide-react";
import { createAllergyAction } from "@/app/actions/patients";
import { useToastActionState } from "@/lib/use-toast-action";
import { useI18n } from "@/i18n/client";

const inputClass =
  "focus-ring w-full rounded-xl border border-line bg-surface px-3 py-2 text-sm shadow-sm";

export function AllergyForm({ patientId }: { patientId: string }) {
  const { t } = useI18n();
  const [error, formAction, pending] = useToastActionState(
    createAllergyAction,
    "Alergia registrada",
  );

  return (
    <details className="rounded-xl border border-line bg-canvas">
      <summary className="focus-ring flex cursor-pointer list-none items-center gap-2 px-3 py-2 text-sm font-medium text-brand-800">
        <Plus className="h-4 w-4" aria-hidden />
        {t("allergies.title")}
      </summary>

      <form action={formAction} className="space-y-3 border-t border-line p-3">
        <input type="hidden" name="patientId" value={patientId} />

        <div className="space-y-1.5">
          <label htmlFor="allergen" className="text-xs font-medium text-muted">
            {t("allergies.allergen")} *
          </label>
          <input id="allergen" name="allergen" required className={inputClass} />
        </div>

        <div className="space-y-1.5">
          <label htmlFor="severity" className="text-xs font-medium text-muted">
            {t("allergies.severity")} *
          </label>
          <select id="severity" name="severity" className={inputClass} defaultValue="moderate">
            <option value="mild">{t("allergies.mild")}</option>
            <option value="moderate">{t("allergies.moderate")}</option>
            <option value="severe">{t("allergies.severe")}</option>
            <option value="anaphylaxis">{t("allergies.anaphylaxis")}</option>
          </select>
        </div>

        <div className="space-y-1.5">
          <label htmlFor="reaction" className="text-xs font-medium text-muted">
            {t("allergies.reaction")}
          </label>
          <input id="reaction" name="reaction" className={inputClass} />
        </div>

        <div className="space-y-1.5">
          <label htmlFor="notes" className="text-xs font-medium text-muted">
            {t("allergies.notes")}
          </label>
          <textarea id="notes" name="notes" rows={2} className={inputClass} />
        </div>

        {error ? (
          <p role="alert" className="rounded-lg bg-rose-50 px-3 py-2 text-xs text-rose-700">
            {error}
          </p>
        ) : null}

        <button
          type="submit"
          disabled={pending}
          className="focus-ring inline-flex items-center gap-2 rounded-lg bg-brand-700 px-3 py-2 text-xs font-semibold text-white hover:bg-brand-800 disabled:opacity-60"
        >
          {pending ? <LoaderCircle className="h-3.5 w-3.5 animate-spin" aria-hidden /> : null}
          {t("allergies.save")}
        </button>
      </form>
    </details>
  );
}
