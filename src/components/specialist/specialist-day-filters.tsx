"use client";

import { LoaderCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import { DatePicker } from "@/components/ui/date-picker";
import { useI18n } from "@/i18n/client";

export function SpecialistDayFilters({
  date,
  status,
  options,
}: {
  date: string;
  status: string;
  options: Array<{ value: string; label: string }>;
}) {
  const router = useRouter();
  const { t } = useI18n();
  const [pending, startTransition] = useTransition();
  const [dateValue, setDateValue] = useState(date);

  useEffect(() => {
    setDateValue(date);
  }, [date]);

  function go(nextDate: string, nextStatus: string) {
    if (!nextDate) return;
    const query = new URLSearchParams({ date: nextDate });
    if (nextStatus) query.set("status", nextStatus);
    startTransition(() => {
      router.replace(`/mi-dia?${query.toString()}`);
    });
  }

  return (
    <div className="flex flex-1 flex-wrap items-center gap-2">
      <label htmlFor="date" className="sr-only">
        {t("availability.day")}
      </label>
      <DatePicker
        id="date"
        value={dateValue}
        onChange={(next) => {
          setDateValue(next);
          go(next, status);
        }}
        className="min-w-36 flex-1 sm:flex-none"
      />

      <label htmlFor="status" className="sr-only">
        {t("common.status")}
      </label>
      <select
        id="status"
        value={status}
        onChange={(event) => go(dateValue, event.target.value)}
        className="focus-ring min-w-0 flex-1 rounded-lg border border-line bg-surface px-3 py-1.5 text-sm shadow-sm sm:flex-none"
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>

      {pending ? (
        <LoaderCircle
          className="h-4 w-4 shrink-0 animate-spin text-muted"
          aria-label={t("agenda.updatingAppointments")}
        />
      ) : null}
    </div>
  );
}
