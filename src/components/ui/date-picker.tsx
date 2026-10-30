"use client";

import { CalendarDays } from "lucide-react";
import { DateTime } from "luxon";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { useI18n } from "@/i18n/client";

export function DatePicker({
  value,
  defaultValue,
  onChange,
  name,
  id,
  placeholder,
  disabled = false,
  disableFuture = false,
  className,
}: {
  value?: string;
  defaultValue?: string;
  onChange?: (value: string) => void;
  name?: string;
  id?: string;
  placeholder?: string;
  disabled?: boolean;
  disableFuture?: boolean;
  className?: string;
}) {
  const { t } = useI18n();
  const [open, setOpen] = useState(false);
  const [internal, setInternal] = useState(defaultValue ?? "");
  const current = value !== undefined ? value : internal;
  const selected = current ? DateTime.fromISO(current).toJSDate() : undefined;
  const label = current
    ? DateTime.fromISO(current)
        .setLocale("es")
        .toFormat("d 'de' LLL, yyyy")
    : (placeholder ?? t("common.selectDate"));

  function pick(date: Date | undefined) {
    if (!date) return;
    const iso = DateTime.fromJSDate(date).toISODate() ?? "";
    if (value === undefined) setInternal(iso);
    onChange?.(iso);
    setOpen(false);
  }

  return (
    <>
      {name ? <input type="hidden" name={name} value={current} /> : null}
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            type="button"
            id={id}
            variant="outline"
            disabled={disabled}
            className={cn(
              "w-full justify-start gap-2 text-left font-normal",
              !current && "text-muted",
              className,
            )}
          >
            <CalendarDays className="h-4 w-4 shrink-0 text-muted" aria-hidden />
            <span className="truncate">{label}</span>
          </Button>
        </PopoverTrigger>
        <PopoverContent>
          <Calendar
            mode="single"
            selected={selected}
            onSelect={pick}
            defaultMonth={selected}
            captionLayout="dropdown"
            startMonth={new Date(1900, 0)}
            endMonth={new Date(2100, 11)}
            disabled={disableFuture ? { after: new Date() } : undefined}
          />
        </PopoverContent>
      </Popover>
    </>
  );
}

export function DateTimePicker({
  name,
  id,
  defaultValue,
}: {
  name?: string;
  id?: string;
  defaultValue?: string;
}) {
  const { t } = useI18n();
  const initial = defaultValue ?? "";
  const [date, setDate] = useState(initial.slice(0, 10));
  const [time, setTime] = useState(initial.slice(11, 16));
  const value = date && time ? `${date}T${time}` : "";

  return (
    <div>
      {name ? <input type="hidden" name={name} value={value} /> : null}
      <div className="flex flex-wrap gap-2">
        <DatePicker
          id={id}
          value={date}
          onChange={(next) => {
            setDate(next);
            if (!time) setTime("09:00");
          }}
          placeholder={t("common.date")}
          className="min-w-40 flex-1"
        />
        <Input
          type="time"
          value={time}
          onChange={(event) => setTime(event.target.value)}
          aria-label={t("common.hour")}
          className="w-32"
        />
      </div>
    </div>
  );
}
