"use client";

import {
  AlertTriangle,
  CheckCheck,
  Clock3,
  DoorOpen,
  LoaderCircle,
  Play,
  UsersRound,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import { transitionAppointmentAction } from "@/app/actions/appointments";
import { formatTime } from "@/lib/dates";
import { useRealtimeRefresh } from "@/lib/use-realtime-refresh";
import type {
  WaitingRoomItem,
  WaitingRoomLevel,
  WaitingRoomResponse,
} from "@/lib/types";
import { useToast } from "@/components/ui/toast-provider";
import { useI18n } from "@/i18n/client";

const LEVEL: Record<
  WaitingRoomLevel,
  {
    labelKey: "sala.onTime" | "sala.delayed" | "sala.critical";
    dot: string;
    badge: string;
    text: string;
  }
> = {
  green: {
    labelKey: "sala.onTime",
    dot: "bg-emerald-500",
    badge: "bg-emerald-50 text-emerald-800 ring-emerald-200",
    text: "text-emerald-700",
  },
  amber: {
    labelKey: "sala.delayed",
    dot: "bg-amber-500",
    badge: "bg-amber-50 text-amber-800 ring-amber-200",
    text: "text-amber-700",
  },
  red: {
    labelKey: "sala.critical",
    dot: "bg-rose-500",
    badge: "bg-rose-50 text-rose-800 ring-rose-200",
    text: "text-rose-700",
  },
};

export function SalaBoard({
  room,
  tv = false,
}: {
  room: WaitingRoomResponse;
  tv?: boolean;
}) {
  const router = useRouter();
  const toast = useToast();
  const { t } = useI18n();
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [now, setNow] = useState<number | null>(null);
  const [, startTransition] = useTransition();
  useRealtimeRefresh(["sala", "agenda"]);

  useEffect(() => {
    setNow(Date.now());
    const timer = setInterval(() => setNow(Date.now()), 30_000);
    return () => clearInterval(timer);
  }, []);

  const current = now ?? new Date(room.generatedAt).getTime();
  const maxDelay = Math.max(
    0,
    ...room.practitionerStatus.map((item) => item.delayMinutes),
  );
  const overallLevel = room.practitionerStatus.reduce<WaitingRoomLevel>(
    (worst, item) => (order(item.level) > order(worst) ? item.level : worst),
    "green",
  );

  function run(appointmentId: string, action: "room" | "start" | "complete" | "check-in") {
    const successMessage = {
      "check-in": t("sala.checkedInToast"),
      room: t("sala.roomToast"),
      start: t("sala.startToast"),
      complete: t("sala.completeToast"),
    }[action];

    setError(null);
    setPendingId(appointmentId);
    startTransition(async () => {
      const result = await transitionAppointmentAction({
        appointmentId,
        action,
      });
      setPendingId(null);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      toast.success(successMessage);
      router.refresh();
    });
  }

  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-3">
        <Metric
          label={t("sala.inRoom")}
          value={room.inRoom.length}
          hint={t("sala.waitingPatients")}
          icon={UsersRound}
        />
        <Metric
          label={t("sala.inConsultation")}
          value={room.inConsultation.length}
          hint={t("sala.consultationInProgress")}
          icon={DoorOpen}
        />
        <Metric
          label={t("sala.maxDelay")}
          value={`${maxDelay} min`}
          hint={t(LEVEL[overallLevel].labelKey)}
          icon={Clock3}
          tone={overallLevel}
        />
      </div>

      {error ? (
        <p role="alert" className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {error}
        </p>
      ) : null}

      <div className="grid items-stretch gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Column
          title={t("sala.inRoom")}
          count={room.inRoom.length}
          empty={t("sala.noOneWaiting")}
        >
          {room.inRoom.map((item) => (
            <WaitingCard
              key={item.appointmentId}
              item={item}
              current={current}
              timezone={room.timezone}
              tv={tv}
              pending={pendingId === item.appointmentId}
              onRoom={() => run(item.appointmentId, "room")}
              onStart={() => run(item.appointmentId, "start")}
            />
          ))}
        </Column>

        <Column
          title={t("sala.inConsultation")}
          count={room.inConsultation.length}
          empty={t("sala.noConsultations")}
        >
          {room.inConsultation.map((item) => (
            <WaitingCard
              key={item.appointmentId}
              item={item}
              current={current}
              timezone={room.timezone}
              tv={tv}
              pending={pendingId === item.appointmentId}
              onComplete={() => run(item.appointmentId, "complete")}
            />
          ))}
        </Column>

        <Column
          title={t("sala.upcoming")}
          count={room.upcoming.length}
          empty={t("sala.noUpcoming")}
        >
          {room.upcoming.map((item) => (
            <WaitingCard
              key={item.appointmentId}
              item={item}
              current={current}
              timezone={room.timezone}
              tv={tv}
              pending={pendingId === item.appointmentId}
              upcoming
              onCheckIn={() => run(item.appointmentId, "check-in")}
            />
          ))}
        </Column>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-muted">
        <span>
          {t("sala.updated", { time: formatTime(room.generatedAt, room.timezone) })} ·{" "}
          {room.timezone}
        </span>
        {!tv ? (
          <Link
            href="/sala?tv=1"
            target="_blank"
            className="focus-ring rounded-lg border border-line px-2.5 py-1.5 font-medium hover:text-ink"
          >
            {t("sala.openTv")}
          </Link>
        ) : (
          <Link
            href="/sala"
            className="focus-ring rounded-lg border border-line px-2.5 py-1.5 font-medium hover:text-ink"
          >
            {t("sala.exitTv")}
          </Link>
        )}
      </div>
    </div>
  );
}

function Metric({
  label,
  value,
  hint,
  icon: Icon,
  tone,
}: {
  label: string;
  value: string | number;
  hint: string;
  icon: typeof UsersRound;
  tone?: WaitingRoomLevel;
}) {
  return (
    <div className="card flex h-full items-start justify-between gap-3 p-4">
      <div>
        <p className="text-sm text-muted">{label}</p>
        <p className="mt-1 text-2xl font-semibold tabular-nums">{value}</p>
        <p className={`mt-1 text-xs ${tone ? LEVEL[tone].text : "text-muted"}`}>
          {hint}
        </p>
      </div>
      <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-50 text-brand-700">
        <Icon className="h-4 w-4" aria-hidden />
      </span>
    </div>
  );
}

function Column({
  title,
  count,
  empty,
  children,
}: {
  title: string;
  count: number;
  empty: string;
  children: React.ReactNode;
}) {
  return (
    <section className="card flex h-full flex-col overflow-hidden">
      <div className="flex items-center justify-between border-b border-line px-4 py-3">
        <h2 className="text-sm font-semibold">{title}</h2>
        <span className="rounded-full bg-canvas px-2 py-0.5 text-xs font-medium text-muted">
          {count}
        </span>
      </div>
      <div className="flex-1 p-3">
        {count === 0 ? (
          <p className="px-1 py-8 text-center text-sm text-muted">{empty}</p>
        ) : (
          <div className="grid auto-rows-fr gap-2">{children}</div>
        )}
      </div>
    </section>
  );
}

function WaitingCard({
  item,
  current,
  timezone,
  tv,
  pending,
  upcoming = false,
  onRoom,
  onStart,
  onComplete,
  onCheckIn,
}: {
  item: WaitingRoomItem;
  current: number;
  timezone: string;
  tv: boolean;
  pending: boolean;
  upcoming?: boolean;
  onRoom?: () => void;
  onStart?: () => void;
  onComplete?: () => void;
  onCheckIn?: () => void;
}) {
  const { t } = useI18n();
  const wait = item.checkedInAt
    ? Math.max(0, Math.floor((current - new Date(item.checkedInAt).getTime()) / 60_000))
    : item.waitMinutes;

  const delay = upcoming
    ? Math.max(0, Math.floor((current - new Date(item.scheduledAt).getTime()) / 60_000))
    : item.status === "in_consultation" && item.consultStartedAt
      ? Math.max(
          0,
          Math.floor(
            (new Date(item.consultStartedAt).getTime() +
              item.expectedConsultMinutes * 60_000 -
              new Date(item.scheduledAt).getTime()) /
              60_000,
          ),
        )
      : Math.max(0, Math.floor((current - new Date(item.scheduledAt).getTime()) / 60_000));

  const level = levelFor(wait, delay);
  const meta = LEVEL[level];
  const name = tv
    ? `${item.patientFirstName} ${item.patientLastName.slice(0, 1)}.`
    : `${item.patientFirstName} ${item.patientLastName}`;

  return (
    <article
      className={`flex min-h-[154px] flex-col rounded-xl border bg-surface p-3.5 ${
        level === "red" ? "border-rose-200" : level === "amber" ? "border-amber-200" : "border-line"
      }`}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className={`truncate text-sm font-semibold ${tv ? "text-base" : ""}`}>
            {name}
          </p>
          <p className="mt-0.5 truncate text-[11px] text-muted">
            {formatTime(item.scheduledAt, timezone)} ·{" "}
            {item.serviceName ?? t("sala.consultation")}
          </p>
        </div>
        <span className={`inline-flex shrink-0 items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold ring-1 ring-inset ${meta.badge}`}>
          <span className={`h-1.5 w-1.5 rounded-full ${meta.dot}`} aria-hidden />
          {t(meta.labelKey)}
        </span>
      </div>

      <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs">
        {item.checkedInAt ? (
          <span className="text-muted">
            {t("sala.waitLabel")} <strong className="text-ink">{wait} min</strong>
          </span>
        ) : null}
        <span className="text-muted">
          {t("sala.delayLabel")} <strong className={meta.text}>{delay} min</strong>
        </span>
        {item.allergyAlert && !tv ? (
          <span className="inline-flex items-center gap-1 font-semibold text-rose-700">
            <AlertTriangle className="h-3 w-3" aria-hidden />
            {t("sala.allergy")}
          </span>
        ) : null}
      </div>

      {!tv ? (
        <div className="mt-auto flex flex-wrap gap-1.5 pt-3">
          {onRoom ? (
            <ActionButton onClick={onRoom} pending={pending} icon={DoorOpen}>
              {t("sala.toRoom")}
            </ActionButton>
          ) : null}
          {onStart ? (
            <ActionButton onClick={onStart} pending={pending} icon={Play} primary>
              {t("sala.start")}
            </ActionButton>
          ) : null}
          {onComplete ? (
            <ActionButton onClick={onComplete} pending={pending} icon={CheckCheck} primary>
              {t("sala.finish")}
            </ActionButton>
          ) : null}
          {onCheckIn ? (
            <ActionButton onClick={onCheckIn} pending={pending} icon={CheckCheck}>
              {t("sala.checkIn")}
            </ActionButton>
          ) : null}
          <Link
            href={`/pacientes/${item.patientId}`}
            className="focus-ring inline-flex items-center rounded-lg px-2 py-1.5 text-xs font-medium text-muted hover:bg-canvas hover:text-ink"
          >
            {t("sala.record")}
          </Link>
        </div>
      ) : null}
    </article>
  );
}

function ActionButton({
  children,
  onClick,
  pending,
  icon: Icon,
  primary = false,
}: {
  children: React.ReactNode;
  onClick: () => void;
  pending: boolean;
  icon: typeof DoorOpen;
  primary?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={pending}
      className={`focus-ring inline-flex items-center gap-1 rounded-lg px-2 py-1.5 text-xs font-semibold disabled:opacity-60 ${
        primary
          ? "bg-brand-700 text-white hover:bg-brand-800"
          : "border border-line bg-surface text-ink hover:bg-canvas"
      }`}
    >
      {pending ? (
        <LoaderCircle className="h-3 w-3 animate-spin" aria-hidden />
      ) : (
        <Icon className="h-3 w-3" aria-hidden />
      )}
      {children}
    </button>
  );
}

function order(level: WaitingRoomLevel): number {
  return level === "red" ? 2 : level === "amber" ? 1 : 0;
}

function levelFor(wait: number, delay: number): WaitingRoomLevel {
  if (wait > 30 || delay > 25) return "red";
  if (wait > 15 || delay > 10) return "amber";
  return "green";
}
