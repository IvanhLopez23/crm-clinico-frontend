"use client";

import { CheckCheck, LoaderCircle, Play } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { transitionAppointmentAction } from "@/app/actions/appointments";
import { useToast } from "@/components/ui/toast-provider";
import { useI18n } from "@/i18n/client";

export function PractitionerDayActions({
  appointmentId,
  status,
}: {
  appointmentId: string;
  status: string;
}) {
  const router = useRouter();
  const toast = useToast();
  const { t } = useI18n();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  if (status !== "arrived" && status !== "in_consultation") {
    return null;
  }

  const action = status === "arrived" ? "start" : "complete";
  const label = status === "arrived" ? "Iniciar consulta" : "Finalizar consulta";

  function run() {
    setError(null);
    startTransition(async () => {
      const result = await transitionAppointmentAction({
        appointmentId,
        action,
      });
      if (!result.ok) {
        setError(result.error);
        return;
      }
      toast.success(
        status === "arrived" ? t("sala.startToast") : t("sala.completeToast"),
      );
      router.refresh();
    });
  }

  return (
    <div className="space-y-1.5">
      <button
        type="button"
        onClick={run}
        disabled={pending}
        className="focus-ring inline-flex items-center gap-1.5 rounded-lg bg-brand-700 px-2.5 py-1.5 text-xs font-semibold text-white hover:bg-brand-800 disabled:opacity-60"
      >
        {pending ? (
          <LoaderCircle className="h-3.5 w-3.5 animate-spin" aria-hidden />
        ) : status === "arrived" ? (
          <Play className="h-3.5 w-3.5" aria-hidden />
        ) : (
          <CheckCheck className="h-3.5 w-3.5" aria-hidden />
        )}
        {pending ? t("practitioners.saving") : label}
      </button>
      {error ? (
        <p role="alert" className="max-w-44 text-[11px] text-rose-700">
          {error}
        </p>
      ) : null}
    </div>
  );
}
