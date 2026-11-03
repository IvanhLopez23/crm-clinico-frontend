"use client";

import { Bell, CalendarDays, CheckCheck, Clock3 } from "lucide-react";
import { DateTime } from "luxon";
import Link from "next/link";
import { useEffect, useState, useTransition } from "react";
import {
  markAllNotificationsReadAction,
  markNotificationReadAction,
} from "@/app/actions/notifications";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useI18n } from "@/i18n/client";
import { useRealtimeRefresh } from "@/lib/use-realtime-refresh";
import type { AppNotification, NotificationsResponse } from "@/lib/types";

export function NotificationBell({
  initial,
  timezone,
}: {
  initial: NotificationsResponse;
  timezone: string;
}) {
  const { t } = useI18n();
  const [data, setData] = useState(initial);
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();

  useRealtimeRefresh(["notifications"]);

  useEffect(() => {
    setData(initial);
  }, [initial]);

  function markRead(notificationId: string) {
    startTransition(async () => {
      const result = await markNotificationReadAction(notificationId);
      if (!result.ok) return;

      setData((previous) => {
        const target = previous.items.find(
          (item) => item.id === notificationId,
        );
        if (!target || target.readAt) return previous;

        return {
          items: previous.items.map((item) =>
            item.id === notificationId
              ? { ...item, readAt: new Date().toISOString() }
              : item,
          ),
          unreadCount: Math.max(0, previous.unreadCount - 1),
        };
      });
    });
  }

  function markAll() {
    startTransition(async () => {
      const result = await markAllNotificationsReadAction();
      if (!result.ok) return;

      const now = new Date().toISOString();
      setData((previous) => ({
        items: previous.items.map((item) => ({
          ...item,
          readAt: item.readAt ?? now,
        })),
        unreadCount: 0,
      }));
    });
  }

  const unread = data.unreadCount;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          aria-label={t("notifications.title")}
          title={t("notifications.title")}
          className="focus-ring relative inline-flex h-9 w-9 items-center justify-center rounded-lg border border-line bg-surface text-muted shadow-sm transition-colors hover:bg-canvas hover:text-ink"
        >
          <Bell className="h-4 w-4" aria-hidden />
          {unread > 0 ? (
            <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-rose-600 px-1 text-[10px] font-semibold leading-none text-white">
              {unread > 9 ? "9+" : unread}
            </span>
          ) : null}
        </button>
      </PopoverTrigger>

      <PopoverContent
        align="end"
        className="w-[min(23rem,calc(100vw-2rem))] overflow-hidden p-0"
      >
        <div className="flex items-start justify-between gap-2 border-b border-line px-4 py-3">
          <div>
            <p className="text-sm font-semibold">{t("notifications.title")}</p>
            <p className="text-[11px] text-muted">
              {unread > 0
                ? t("notifications.unread", { count: unread })
                : t("notifications.allRead")}
            </p>
          </div>
          {unread > 0 ? (
            <button
              type="button"
              onClick={markAll}
              disabled={pending}
              className="focus-ring inline-flex items-center gap-1 rounded-lg px-2 py-1 text-[11px] font-medium text-muted transition-colors hover:bg-canvas hover:text-ink disabled:opacity-60"
            >
              <CheckCheck className="h-3.5 w-3.5" aria-hidden />
              {t("notifications.markAll")}
            </button>
          ) : null}
        </div>

        {data.items.length === 0 ? (
          <div className="px-4 py-8 text-center text-sm text-muted">
            {t("notifications.empty")}
          </div>
        ) : (
          <ul className="max-h-[24rem] divide-y divide-line overflow-y-auto">
            {data.items.map((item) => (
              <li key={item.id}>
                <NotificationRow
                  item={item}
                  timezone={timezone}
                  onOpen={() => markRead(item.id)}
                />
              </li>
            ))}
          </ul>
        )}
      </PopoverContent>
    </Popover>
  );
}

function NotificationRow({
  item,
  timezone,
  onOpen,
}: {
  item: AppNotification;
  timezone: string;
  onOpen: () => void;
}) {
  const { t, locale } = useI18n();
  const isPublicBooking = item.type === "public_booking";
  const patientName =
    typeof item.data.patientName === "string" ? item.data.patientName : "";
  const serviceName =
    typeof item.data.serviceName === "string" ? item.data.serviceName : "";
  const patientId =
    typeof item.data.patientId === "string" ? item.data.patientId : null;
  const startsAt =
    typeof item.data.startsAt === "string" ? item.data.startsAt : null;
  const startsAtLocal = startsAt
    ? DateTime.fromISO(startsAt, { zone: timezone })
    : null;
  const dateParam = startsAtLocal?.isValid
    ? startsAtLocal.toISODate()
    : null;
  const href = dateParam
    ? `/agenda?date=${encodeURIComponent(dateParam)}${
        patientId ? `&patientId=${encodeURIComponent(patientId)}` : ""
      }`
    : "/agenda";

  const content = (
    <div className="flex items-start gap-3">
      <span
        className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${
          isPublicBooking
            ? "bg-brand-50 text-brand-700"
            : "bg-canvas text-muted"
        }`}
      >
        <CalendarDays className="h-4 w-4" aria-hidden />
      </span>

      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium">
          {isPublicBooking ? t("notifications.publicBooking") : item.title}
        </p>

        {isPublicBooking ? (
          <>
            <p className="mt-0.5 truncate text-sm">{patientName}</p>
            <p className="truncate text-xs text-muted">{serviceName}</p>
            {startsAtLocal?.isValid ? (
              <p className="mt-1 flex flex-wrap items-center gap-1 text-xs text-muted">
                <CalendarDays className="h-3 w-3" aria-hidden />
                {startsAtLocal
                  .setLocale(locale === "en" ? "en" : "es")
                  .toLocaleString({
                    weekday: "short",
                    day: "numeric",
                    month: "short",
                  })}
                <Clock3 className="ml-1 h-3 w-3" aria-hidden />
                {startsAtLocal.toFormat("HH:mm")}
              </p>
            ) : null}
          </>
        ) : (
          <p className="mt-0.5 text-xs text-muted">{item.body}</p>
        )}
      </div>

      {!item.readAt ? (
        <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-brand-600" />
      ) : null}
    </div>
  );

  const className = `block px-4 py-3 transition-colors hover:bg-canvas ${
    item.readAt ? "opacity-70" : ""
  }`;

  if (isPublicBooking) {
    return (
      <Link href={href} onClick={onOpen} className={className}>
        {content}
      </Link>
    );
  }

  return <div className={className}>{content}</div>;
}
