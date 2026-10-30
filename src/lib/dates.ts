import { DateTime } from "luxon";

export function todayIn(timezone: string): string {
  return DateTime.now().setZone(timezone).toISODate() ?? "";
}

export function dayRange(
  isoDate: string,
  timezone: string,
): { from: string; to: string } {
  const start = DateTime.fromISO(isoDate, { zone: timezone }).startOf("day");

  return {
    from: start.toUTC().toISO() ?? "",
    to: start.plus({ days: 1 }).toUTC().toISO() ?? "",
  };
}

export function shiftDate(
  isoDate: string,
  days: number,
  timezone: string,
): string {
  return (
    DateTime.fromISO(isoDate, { zone: timezone }).plus({ days }).toISODate() ??
    isoDate
  );
}

export function formatDate(isoDate: string, timezone: string): string {
  return DateTime.fromISO(isoDate, { zone: timezone })
    .setLocale("es")
    .toLocaleString({
      weekday: "long",
      day: "numeric",
      month: "long",
    });
}

export function formatTime(iso: string, timezone: string): string {
  return DateTime.fromISO(iso).setZone(timezone).toFormat("HH:mm");
}

export function isValidDate(value: string | undefined): value is string {
  return Boolean(value && /^\d{4}-\d{2}-\d{2}$/.test(value));
}
