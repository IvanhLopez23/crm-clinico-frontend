"use client";

import { ChevronDown, LoaderCircle, Plus, Trash2 } from "lucide-react";
import { useRef, useState } from "react";
import {
  createWeeklyScheduleAction,
  deleteAvailabilityRuleAction,
  updateAvailabilityRuleAction,
} from "@/app/actions/practitioners";
import { ActionForm } from "@/components/ui/action-form";
import { DatePicker } from "@/components/ui/date-picker";
import { useI18n } from "@/i18n/client";
import { useToastActionState } from "@/lib/use-toast-action";
import type { AvailabilityRule } from "@/lib/types";

const DAY_OPTIONS = [
  { value: 1, short: "Lun", long: "Lunes" },
  { value: 2, short: "Mar", long: "Martes" },
  { value: 3, short: "Mié", long: "Miércoles" },
  { value: 4, short: "Jue", long: "Jueves" },
  { value: 5, short: "Vie", long: "Viernes" },
  { value: 6, short: "Sáb", long: "Sábado" },
  { value: 7, short: "Dom", long: "Domingo" },
];

const WEEKDAYS = [
  "",
  "Lunes",
  "Martes",
  "Miércoles",
  "Jueves",
  "Viernes",
  "Sábado",
  "Domingo",
];

const inputClass =
  "focus-ring w-full rounded-xl border border-line bg-surface px-3 py-2 text-sm shadow-sm";

export function AvailabilityRulesEditor({
  practitionerId,
  rules,
  timezone,
  today,
  canEdit,
}: {
  practitionerId: string;
  rules: AvailabilityRule[];
  timezone: string;
  today: string;
  canEdit: boolean;
}) {
  const { t } = useI18n();
  const grouped = DAY_OPTIONS.map((day) => ({
    ...day,
    rules: rules
      .filter((rule) => rule.weekday === day.value)
      .sort((a, b) => a.startTime.localeCompare(b.startTime)),
  })).filter((group) => group.rules.length > 0);

  return (
    <section className="card overflow-hidden">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-line px-5 py-4">
        <div>
          <h2 className="font-semibold">{t("availability.weekly")}</h2>
          <p className="text-xs text-muted">{t("availability.weeklyHint")}</p>
        </div>
        <span className="text-xs text-muted">
          {t("availability.days", { count: grouped.length })} ·{" "}
          {t("availability.rules", { count: rules.length })}
        </span>
      </div>

      <div className="space-y-4 p-5">
        {grouped.length === 0 ? (
          <p className="text-sm text-muted">{t("availability.noRules")}</p>
        ) : (
          <div className="grid gap-4 lg:grid-cols-2 2xl:grid-cols-3">
            {grouped.map((group) => (
              <article
                key={group.value}
                className="flex h-full flex-col rounded-2xl border border-line bg-canvas p-4"
              >
                <header className="border-b border-line pb-3">
                  <p className="text-base font-semibold">{group.long}</p>
                  <p className="mt-0.5 text-xs text-muted">
                    {group.rules.length}{" "}
                    {group.rules.length === 1 ? "bloque" : "bloques"} de
                    atención
                  </p>
                </header>

                <div className="mt-3 space-y-2">
                  {group.rules.map((rule) => (
                    <RuleRow
                      key={rule.id}
                      rule={rule}
                      timezone={timezone}
                      canEdit={canEdit}
                    />
                  ))}
                </div>
              </article>
            ))}
          </div>
        )}

        {canEdit ? (
          <AddRuleForm practitionerId={practitionerId} today={today} />
        ) : null}
      </div>
    </section>
  );
}

function RuleRow({
  rule,
  timezone,
  canEdit,
}: {
  rule: AvailabilityRule;
  timezone: string;
  canEdit: boolean;
}) {
  const { t } = useI18n();
  const [editing, setEditing] = useState(false);
  const [error, formAction, pending] = useToastActionState(
    updateAvailabilityRuleAction,
    t("availability.ruleUpdated"),
    () => setEditing(false),
  );

  return (
    <div className="rounded-xl border border-line bg-surface px-3.5 py-3">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <p className="text-base font-semibold tabular-nums">
            {rule.startTime.slice(0, 5)} – {rule.endTime.slice(0, 5)}
          </p>
          <p className="mt-0.5 text-xs text-muted">
            {t("availability.validFrom")} {rule.validFrom}
            {rule.validTo ? ` · ${rule.validTo}` : ""}
          </p>
        </div>

        {canEdit ? (
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => setEditing((value) => !value)}
              className="focus-ring inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-medium text-muted hover:bg-canvas hover:text-ink"
            >
              <ChevronDown className="h-3 w-3" aria-hidden />
              {t("availability.edit")}
            </button>
            <ActionForm
              action={deleteAvailabilityRuleAction}
              successMessage={t("availability.ruleDeleted")}
            >
              <input type="hidden" name="ruleId" value={rule.id} />
              <input
                type="hidden"
                name="practitionerId"
                value={rule.practitionerId}
              />
              <button
                type="submit"
                className="focus-ring inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-medium text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/30"
              >
                <Trash2 className="h-3 w-3" aria-hidden />
                {t("availability.delete")}
              </button>
            </ActionForm>
          </div>
        ) : null}
      </div>

      {editing && canEdit ? (
        <form
          action={formAction}
          className="mt-3 grid gap-3 border-t border-line pt-3 sm:grid-cols-2"
        >
          <input type="hidden" name="ruleId" value={rule.id} />
          <input
            type="hidden"
            name="practitionerId"
            value={rule.practitionerId}
          />

          <label className="space-y-1 text-xs text-muted">
            {t("availability.day")}
            <select
              name="weekday"
              defaultValue={rule.weekday}
              className={inputClass}
            >
              {WEEKDAYS.slice(1).map((day, index) => (
                <option key={day} value={index + 1}>
                  {day}
                </option>
              ))}
            </select>
          </label>

          <label className="space-y-1 text-xs text-muted">
            {t("availability.start")}
            <input
              type="time"
              name="startTime"
              defaultValue={rule.startTime.slice(0, 5)}
              className={inputClass}
            />
          </label>

          <label className="space-y-1 text-xs text-muted">
            {t("availability.end")}
            <input
              type="time"
              name="endTime"
              defaultValue={rule.endTime.slice(0, 5)}
              className={inputClass}
            />
          </label>

          <label className="space-y-1 text-xs text-muted">
            {t("availability.validFrom")}
            <DatePicker
              name="validFrom"
              defaultValue={rule.validFrom}
              placeholder={t("common.selectDate")}
            />
          </label>

          {error ? (
            <p role="alert" className="text-xs text-rose-700 sm:col-span-2">
              {error}
            </p>
          ) : null}

          <div className="flex justify-end gap-2 sm:col-span-2">
            <button
              type="button"
              onClick={() => setEditing(false)}
              className="focus-ring rounded-lg border border-line px-3 py-1.5 text-xs font-medium"
            >
              {t("availability.cancel")}
            </button>
            <button
              type="submit"
              disabled={pending}
              className="focus-ring inline-flex items-center gap-1 rounded-lg bg-brand-700 px-3 py-1.5 text-xs font-semibold text-white disabled:opacity-60"
            >
              {pending ? (
                <LoaderCircle className="h-3 w-3 animate-spin" aria-hidden />
              ) : null}
              {t("availability.save")}
            </button>
          </div>
        </form>
      ) : null}
    </div>
  );
}

function AddRuleForm({
  practitionerId,
  today,
}: {
  practitionerId: string;
  today: string;
}) {
  const { t } = useI18n();
  const [weekdays, setWeekdays] = useState<number[]>([1, 2, 3, 4, 5]);
  const [startTime, setStartTime] = useState("08:00");
  const [endTime, setEndTime] = useState("18:00");
  const [hasLunch, setHasLunch] = useState(true);
  const [lunchStart, setLunchStart] = useState("12:00");
  const [lunchEnd, setLunchEnd] = useState("14:00");
  const detailsRef = useRef<HTMLDetailsElement>(null);
  const [error, formAction, pending] = useToastActionState(
    createWeeklyScheduleAction,
    t("availability.ruleCreated"),
    () => {
      detailsRef.current?.removeAttribute("open");
      setWeekdays([1, 2, 3, 4, 5]);
      setStartTime("08:00");
      setEndTime("18:00");
      setHasLunch(true);
      setLunchStart("12:00");
      setLunchEnd("14:00");
    },
  );

  const rangeInvalid = startTime >= endTime;
  const lunchInvalid =
    hasLunch &&
    !rangeInvalid &&
    !(startTime < lunchStart && lunchStart < lunchEnd && lunchEnd < endTime);
  const canSubmit =
    weekdays.length > 0 && !rangeInvalid && !lunchInvalid && !pending;
  const ruleCount = weekdays.length * (hasLunch ? 2 : 1);

  function toggleDay(day: number) {
    setWeekdays((current) =>
      current.includes(day)
        ? current.filter((item) => item !== day)
        : [...current, day].sort((a, b) => a - b),
    );
  }

  return (
    <details ref={detailsRef} className="rounded-xl border border-line bg-surface">
      <summary className="focus-ring flex cursor-pointer list-none items-center gap-2 px-3 py-2.5 text-sm font-medium text-brand-800">
        <Plus className="h-4 w-4" aria-hidden />
        {t("availability.addSchedule")}
      </summary>
      <form action={formAction} className="space-y-4 border-t border-line p-3">
        <input type="hidden" name="practitionerId" value={practitionerId} />

        <div>
          <p className="text-xs font-medium text-muted">
            Días que repiten este horario
          </p>
          <div className="mt-2 grid grid-cols-4 gap-1.5 sm:grid-cols-7">
            {DAY_OPTIONS.map((day) => {
              const active = weekdays.includes(day.value);
              return (
                <button
                  key={day.value}
                  type="button"
                  aria-pressed={active}
                  aria-label={day.long}
                  onClick={() => toggleDay(day.value)}
                  className={`focus-ring rounded-lg border px-2 py-2 text-xs font-semibold ${
                    active
                      ? "border-brand-700 bg-brand-700 text-white"
                      : "border-line bg-surface text-ink hover:bg-canvas"
                  }`}
                >
                  {day.short}
                </button>
              );
            })}
          </div>
          {weekdays.map((day) => (
            <input key={day} type="hidden" name="weekdays" value={day} />
          ))}
          <p className="mt-1.5 text-[11px] font-normal text-muted">
            No se duplican días. Puedes elegir de lunes a domingo.
          </p>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <label className="space-y-1 text-xs text-muted">
            {t("availability.startTime")}
            <input
              type="time"
              name="startTime"
              value={startTime}
              onChange={(event) => setStartTime(event.target.value)}
              className={inputClass}
            />
          </label>

          <label className="space-y-1 text-xs text-muted">
            {t("availability.endTime")}
            <input
              type="time"
              name="endTime"
              value={endTime}
              onChange={(event) => setEndTime(event.target.value)}
              className={inputClass}
            />
          </label>
        </div>

        <div className="rounded-xl border border-line bg-canvas p-3">
          <label className="flex items-center gap-2 text-sm font-medium">
            <input
              type="checkbox"
              name="hasLunch"
              checked={hasLunch}
              onChange={(event) => setHasLunch(event.target.checked)}
              className="h-4 w-4 rounded border-line"
            />
            Agregar hora de comida
          </label>

          {hasLunch ? (
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              <label className="space-y-1 text-xs text-muted">
                {t("availability.start")} de comida
                <input
                  type="time"
                  name="lunchStart"
                  value={lunchStart}
                  onChange={(event) => setLunchStart(event.target.value)}
                  className={inputClass}
                />
              </label>

              <label className="space-y-1 text-xs text-muted">
                {t("availability.end")} de comida
                <input
                  type="time"
                  name="lunchEnd"
                  value={lunchEnd}
                  onChange={(event) => setLunchEnd(event.target.value)}
                  className={inputClass}
                />
              </label>
            </div>
          ) : null}

          <p className="mt-2 text-[11px] font-normal text-muted">
            {hasLunch
              ? "Se agendarán dos bloques por día: antes y después de la comida."
              : "Se agendará un solo bloque continuo por día."}
          </p>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <label className="space-y-1 text-xs text-muted">
            {t("availability.validFrom")}
            <DatePicker
              name="validFrom"
              defaultValue={today}
              placeholder={t("common.selectDate")}
            />
          </label>

          <div className="flex items-end">
            <p className="w-full rounded-xl bg-brand-50 px-3 py-2.5 text-xs font-medium text-brand-800">
              {ruleCount > 0
                ? `Se crearán ${ruleCount} ${
                    ruleCount === 1 ? "regla" : "reglas"
                  }`
                : "Selecciona al menos un día"}
            </p>
          </div>
        </div>

        {rangeInvalid ? (
          <p role="alert" className="text-xs text-rose-700">
            La hora de entrada debe ser anterior a la de salida.
          </p>
        ) : null}

        {lunchInvalid ? (
          <p role="alert" className="text-xs text-rose-700">
            La comida debe estar dentro del horario de atención.
          </p>
        ) : null}

        {error ? (
          <p role="alert" className="text-xs text-rose-700">
            {error}
          </p>
        ) : null}

        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-[11px] text-muted">
            Si algún día ya tiene ese horario, no se creará ninguno.
          </p>
          <button
            type="submit"
            disabled={!canSubmit}
            className="focus-ring inline-flex items-center gap-1 rounded-lg bg-brand-700 px-3 py-1.5 text-xs font-semibold text-white disabled:opacity-60"
          >
            {pending ? (
              <LoaderCircle className="h-3 w-3 animate-spin" aria-hidden />
            ) : null}
            {t("availability.createSchedule")}
          </button>
        </div>
      </form>
    </details>
  );
}
