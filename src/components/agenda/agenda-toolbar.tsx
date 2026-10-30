"use client";

import { ChevronLeft, ChevronRight, LoaderCircle, SlidersHorizontal } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import { DatePicker } from "@/components/ui/date-picker";
import { useI18n } from "@/i18n/client";
import type { Practitioner } from "@/lib/types";

export function AgendaToolbar({
  date,
  previous,
  next,
  practitioners,
  selectedPractitionerId,
  patientId,
}: {
  date: string;
  previous: string;
  next: string;
  practitioners: Practitioner[];
  selectedPractitionerId: string | null;
  patientId?: string;
}) {
  const router = useRouter();
  const { t } = useI18n();
  const [pending, startTransition] = useTransition();
  const [dateValue, setDateValue] = useState(date);

  useEffect(() => {
    setDateValue(date);
  }, [date]);

  function buildHref(nextDate: string, practitionerId: string): string {
    const params = new URLSearchParams({ date: nextDate });
    if (practitionerId) params.set("practitionerId", practitionerId);
    if (patientId) params.set("patientId", patientId);
    return `/agenda?${params.toString()}`;
  }

  function go(nextDate: string, practitionerId: string) {
    startTransition(() => {
      router.push(buildHref(nextDate, practitionerId));
    });
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Link
        href={buildHref(previous, selectedPractitionerId ?? "")}
        aria-label={t("agenda.previousDay")}
        className="focus-ring inline-flex h-9 w-9 items-center justify-center rounded-lg border border-line bg-surface text-muted hover:text-ink"
      >
        <ChevronLeft className="h-4 w-4" aria-hidden />
      </Link>

      <div className="flex flex-wrap items-center gap-2">
        <label htmlFor="date" className="sr-only">
          {t("common.date")}
        </label>
        <DatePicker
          id="date"
          value={dateValue}
          onChange={(next) => {
            setDateValue(next);
            go(next, selectedPractitionerId ?? "");
          }}
          className="w-auto min-w-44"
        />

        <div className="relative">
          <SlidersHorizontal
            className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted"
            aria-hidden
          />
          <label htmlFor="practitionerId" className="sr-only">
            {t("agenda.filterBySpecialist")}
          </label>
          <select
            id="practitionerId"
            value={selectedPractitionerId ?? ""}
            onChange={(event) => go(dateValue, event.target.value)}
            className="focus-ring rounded-lg border border-line bg-surface py-1.5 pl-8 pr-8 text-sm shadow-sm"
          >
            <option value="">{t("agenda.allSpecialists")}</option>
            {practitioners.map((practitioner) => (
              <option key={practitioner.id} value={practitioner.id}>
                {practitioner.fullName}
              </option>
            ))}
          </select>
        </div>

        {pending ? (
          <LoaderCircle
            className="h-4 w-4 animate-spin text-muted"
            aria-label={t("agenda.updating")}
          />
        ) : null}
      </div>

      <Link
        href={buildHref(next, selectedPractitionerId ?? "")}
        aria-label={t("agenda.nextDay")}
        className="focus-ring inline-flex h-9 w-9 items-center justify-center rounded-lg border border-line bg-surface text-muted hover:text-ink"
      >
        <ChevronRight className="h-4 w-4" aria-hidden />
      </Link>
    </div>
  );
}
