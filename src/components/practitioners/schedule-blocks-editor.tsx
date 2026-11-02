"use client";

import { LoaderCircle, Plus, Trash2 } from "lucide-react";
import { DateTime } from "luxon";
import { useRef, useState } from "react";
import {
  createBlockAction,
  deleteBlockAction,
} from "@/app/actions/practitioners";
import { ActionForm } from "@/components/ui/action-form";
import { DatePicker } from "@/components/ui/date-picker";
import { useI18n } from "@/i18n/client";
import { useToastActionState } from "@/lib/use-toast-action";
import type { ScheduleBlock } from "@/lib/types";

const BLOCK_TYPES: Record<string, string> = {
  break: "Descanso",
  vacation: "Vacaciones",
  meeting: "Reunión",
  surgery: "Cirugía",
  personal: "Personal",
  holiday: "Feriado",
  maintenance: "Mantenimiento",
  other: "Otro",
};

const inputClass =
  "focus-ring w-full rounded-xl border border-line bg-surface px-3 py-2 text-sm shadow-sm";

export function ScheduleBlocksEditor({
  practitionerId,
  blocks,
  timezone,
  today,
  canEdit,
}: {
  practitionerId: string;
  blocks: ScheduleBlock[];
  timezone: string;
  today: string;
  canEdit: boolean;
}) {
  const { t } = useI18n();

  return (
    <section className="card overflow-hidden">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-line px-5 py-4">
        <div>
          <h2 className="font-semibold">{t("availability.blocks")}</h2>
          <p className="text-xs text-muted">{t("availability.blocksHint")}</p>
        </div>
        <span className="text-xs text-muted">
          {blocks.length} {blocks.length === 1 ? "bloqueo" : "bloqueos"}
        </span>
      </div>

      <div className="space-y-3 p-5">
        {blocks.length === 0 ? (
          <p className="text-sm text-muted">{t("availability.noBlocks")}</p>
        ) : (
          <ul className="divide-y divide-line rounded-xl border border-line">
            {blocks.map((block) => (
              <li
                key={block.id}
                className="flex flex-wrap items-center justify-between gap-2 px-3 py-2.5"
              >
                <div>
                  <p className="text-sm font-medium">
                    {formatRange(
                      block.startsAt,
                      block.endsAt,
                      timezone,
                      t("availability.allDay"),
                    )}
                  </p>
                  <p className="text-xs text-muted">
                    {BLOCK_TYPES[block.type] ?? block.type}
                    {block.reason ? ` · ${block.reason}` : ""}
                  </p>
                </div>
                {canEdit ? (
                  <ActionForm
                    action={deleteBlockAction}
                    successMessage={t("availability.blockDeleted")}
                  >
                    <input type="hidden" name="blockId" value={block.id} />
                    <input
                      type="hidden"
                      name="practitionerId"
                      value={practitionerId}
                    />
                    <button
                      type="submit"
                      className="focus-ring inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-medium text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/30"
                    >
                      <Trash2 className="h-3 w-3" aria-hidden />
                      {t("availability.delete")}
                    </button>
                  </ActionForm>
                ) : null}
              </li>
            ))}
          </ul>
        )}

        {canEdit ? (
          <AddBlockForm practitionerId={practitionerId} today={today} />
        ) : null}
      </div>
    </section>
  );
}

function AddBlockForm({
  practitionerId,
  today,
}: {
  practitionerId: string;
  today: string;
}) {
  const { t } = useI18n();
  const detailsRef = useRef<HTMLDetailsElement>(null);
  const [day, setDay] = useState(today);
  const [endDate, setEndDate] = useState(today);
  const [allDay, setAllDay] = useState(false);
  const [startAllDay, setStartAllDay] = useState(false);
  const [endAllDay, setEndAllDay] = useState(false);
  const [startTime, setStartTime] = useState("09:00");
  const [endTime, setEndTime] = useState("10:00");
  const [error, formAction, pending] = useToastActionState(
    createBlockAction,
    t("availability.blockCreated"),
    () => {
      detailsRef.current?.removeAttribute("open");
      setDay(today);
      setEndDate(today);
      setAllDay(false);
      setStartAllDay(false);
      setEndAllDay(false);
      setStartTime("09:00");
      setEndTime("10:00");
    },
  );

  return (
    <details ref={detailsRef} className="rounded-xl border border-line bg-surface">
      <summary className="focus-ring flex cursor-pointer list-none items-center gap-2 px-3 py-2.5 text-sm font-medium text-brand-800">
        <Plus className="h-4 w-4" aria-hidden />
        {t("availability.addBlock")}
      </summary>
      <form action={formAction} className="space-y-4 border-t border-line p-3">
        <input type="hidden" name="practitionerId" value={practitionerId} />

        <div className="grid gap-3 sm:grid-cols-2">
          <label className="space-y-1 text-xs text-muted">
            {t("availability.blockDay")}
            <DatePicker
              name="day"
              value={day}
              onChange={(next) => {
                setDay(next);
                setEndDate((current) =>
                  current === day || current < next ? next : current,
                );
              }}
              placeholder={t("common.selectDate")}
            />
          </label>

          <label className="flex items-end gap-2 pb-2 text-sm font-medium">
            <input
              type="checkbox"
              name="allDay"
              checked={allDay}
              onChange={(event) => setAllDay(event.target.checked)}
              className="h-4 w-4 rounded border-line"
            />
            {t("availability.fullDay")}
          </label>
        </div>

        {allDay ? (
          <p className="rounded-xl bg-brand-50 px-3 py-2 text-xs text-brand-800">
            {t("availability.blockAllDayHint")}
          </p>
        ) : (
          <>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1 text-xs text-muted">
                <span>{t("availability.start")}</span>
                <div className="flex flex-wrap items-center gap-2">
                  <input
                    type="time"
                    name="startTime"
                    value={startTime}
                    onChange={(event) => setStartTime(event.target.value)}
                    disabled={startAllDay}
                    className={`${inputClass} min-w-32 flex-1 disabled:opacity-50`}
                  />
                  <label className="flex items-center gap-1.5 text-xs font-medium">
                    <input
                      type="checkbox"
                      name="startAllDay"
                      checked={startAllDay}
                      onChange={(event) =>
                        setStartAllDay(event.target.checked)
                      }
                      className="h-4 w-4 rounded border-line"
                    />
                    {t("availability.allDay")}
                  </label>
                </div>
              </div>

              <div className="space-y-1 text-xs text-muted">
                <span>{t("availability.end")}</span>
                <div className="flex flex-wrap items-center gap-2">
                  <DatePicker
                    name="endDate"
                    value={endDate}
                    onChange={setEndDate}
                    placeholder={t("common.selectDate")}
                    className="min-w-36 flex-1"
                  />
                  <input
                    type="time"
                    name="endTime"
                    value={endTime}
                    onChange={(event) => setEndTime(event.target.value)}
                    disabled={endAllDay}
                    className={`${inputClass} min-w-28 flex-1 disabled:opacity-50`}
                  />
                  <label className="flex items-center gap-1.5 text-xs font-medium">
                    <input
                      type="checkbox"
                      name="endAllDay"
                      checked={endAllDay}
                      onChange={(event) => setEndAllDay(event.target.checked)}
                      className="h-4 w-4 rounded border-line"
                    />
                    {t("availability.allDay")}
                  </label>
                </div>
              </div>
            </div>

            <p className="text-[11px] text-muted">
              {t("availability.blockRangeHint")}
            </p>
          </>
        )}

        <div className="grid gap-3 sm:grid-cols-2">
          <label className="space-y-1 text-xs text-muted">
            {t("availability.type")}
            <select name="type" defaultValue="break" className={inputClass}>
              {Object.entries(BLOCK_TYPES).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </label>

          <label className="space-y-1 text-xs text-muted">
            {t("availability.reason")}
            <input name="reason" className={inputClass} />
          </label>
        </div>

        {error ? (
          <p role="alert" className="text-xs text-rose-700">
            {error}
          </p>
        ) : null}

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={pending}
            className="focus-ring inline-flex items-center gap-1 rounded-lg bg-brand-700 px-3 py-1.5 text-xs font-semibold text-white disabled:opacity-60"
          >
            {pending ? (
              <LoaderCircle className="h-3 w-3 animate-spin" aria-hidden />
            ) : null}
            {t("availability.addBlock")}
          </button>
        </div>
      </form>
    </details>
  );
}

function formatRange(
  startsAt: string,
  endsAt: string,
  timezone: string,
  allDayLabel: string,
): string {
  const start = DateTime.fromISO(startsAt, { zone: timezone });
  const end = DateTime.fromISO(endsAt, { zone: timezone });

  const startsAtDay = start.startOf("day");
  const endsAtDay = end.startOf("day");
  const startsAtStart = start.toMillis() === startsAtDay.toMillis();
  const endsAtNextDayStart = end.toMillis() === endsAtDay.toMillis();
  const endsAtEndOfDay =
    end.toMillis() >= end.endOf("day").minus({ minutes: 1 }).toMillis();
  const allDay =
    startsAtStart &&
    (endsAtNextDayStart || endsAtEndOfDay) &&
    end.toMillis() > start.toMillis();

  if (allDay) {
    const lastDay = endsAtNextDayStart
      ? end.minus({ days: 1 })
      : end.startOf("day");
    if (start.hasSame(lastDay, "day")) {
      return `${start.toFormat("dd/LL")} · ${allDayLabel}`;
    }
    return `${start.toFormat("dd/LL")} – ${lastDay.toFormat("dd/LL")} · ${allDayLabel}`;
  }

  const sameDay = start.hasSame(end, "day");
  return `${start.toFormat("dd/LL HH:mm")} – ${
    sameDay ? end.toFormat("HH:mm") : end.toFormat("dd/LL HH:mm")
  }`;
}
