import { Bell, Clock3, MessageSquare, UsersRound } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { NewWaitlistDialog } from "@/components/messages/new-waitlist-dialog";
import {
  ReminderActions,
  WaitlistEntryActions,
  WaitlistOfferActions,
} from "@/components/messages/message-actions";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { api } from "@/lib/api";
import { getI18n } from "@/i18n/server";
import type { MessageKey } from "@/i18n/messages";
import { formatDate, formatTime } from "@/lib/dates";
import { getSession } from "@/lib/session";
import type {
  Practitioner,
  ReminderJob,
  WaitlistEntry,
  WaitlistOffer,
} from "@/lib/types";

function channelLabel(channel: string, t: (key: "channel.whatsapp" | "channel.sms" | "channel.email") => string) {
  if (channel === "whatsapp") return t("channel.whatsapp");
  if (channel === "sms") return t("channel.sms");
  return t("channel.email");
}

export default async function MessagesPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  const session = await getSession();
  if (!session) redirect("/login");
  if (session.scope !== "tenant") redirect("/platform");
  if (session.user.role === "practitioner") redirect("/mi-dia");

  const { t } = await getI18n();
  const statusLabel = (status: string) => {
    const value = t(`status.${status}` as MessageKey);
    return value.startsWith("status.") ? status : value;
  };
  const params = await searchParams;
  const tab = params.tab === "espera" ? "espera" : "mensajes";

  const [reminders, entries, offers, practitioners] = await Promise.all([
    api<ReminderJob[]>("/api/v1/reminders?limit=100", {
      token: session.token,
    }),
    api<WaitlistEntry[]>("/api/v1/waitlist", { token: session.token }),
    api<WaitlistOffer[]>("/api/v1/waitlist/offers", {
      token: session.token,
    }),
    api<Practitioner[]>("/api/v1/practitioners", { token: session.token }),
  ]);

  const pending = reminders.filter((item) => item.status === "pending").length;
  const failed = reminders.filter((item) => item.status === "failed").length;
  const sent = reminders.filter((item) => item.status === "sent").length;
  const waiting = entries.filter((item) => item.status === "waiting").length;
  const pendingOffers = offers.filter((item) => item.status === "pending");

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="flex items-center gap-2 text-sm text-muted">
            <MessageSquare className="h-4 w-4" aria-hidden />
            {t("messages.messages")}
          </p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight">
            {t("messages.title")}
          </h1>
          <p className="mt-1 text-sm text-muted">{t("messages.subtitle")}</p>
        </div>
        {tab === "espera" ? (
          <NewWaitlistDialog practitioners={practitioners} />
        ) : null}
      </header>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Stat label={t("messages.pending")} value={pending} icon={Bell} />
        <Stat label={t("messages.sent")} value={sent} icon={MessageSquare} />
        <Stat label={t("messages.failed")} value={failed} icon={Bell} tone="rose" />
        <Stat label={t("messages.waiting")} value={waiting} icon={UsersRound} />
      </div>

      <div className="flex gap-1 rounded-xl border border-line bg-surface p-1">
        <TabLink href="/mensajes" active={tab === "mensajes"}>{t("messages.messages")}</TabLink>
        <TabLink href="/mensajes?tab=espera" active={tab === "espera"}>{t("messages.waitlist")}
          {pendingOffers.length > 0 ? (
            <span className="ml-1 rounded-full bg-amber-100 px-1.5 text-[10px] font-semibold text-amber-800">
              {pendingOffers.length}
            </span>
          ) : null}
        </TabLink>
      </div>

      {tab === "mensajes" ? (
        <Card>
          <CardHeader>
            <div>
              <p className="font-semibold">{t("messages.reminders")}</p>
              <p className="text-xs text-muted">{t("messages.remindersHint")}</p>
            </div>
            <span className="text-xs text-muted">{t("messages.entries", { count: reminders.length })}</span>
          </CardHeader>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-canvas text-left text-xs uppercase tracking-wide text-muted">
                <tr>
                  <th className="px-5 py-2.5 font-medium">{t("common.patient")}</th>
                  <th className="px-5 py-2.5 font-medium">{t("common.date")}</th>
                  <th className="px-5 py-2.5 font-medium">{t("messages.channel")}</th>
                  <th className="px-5 py-2.5 font-medium">{t("messages.scheduled")}</th>
                  <th className="px-5 py-2.5 font-medium">{t("common.status")}</th>
                  <th className="px-5 py-2.5 font-medium" />
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {reminders.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-5 py-10 text-center text-muted">
                      {t("messages.emptyReminders")}
                    </td>
                  </tr>
                ) : (
                  reminders.map((reminder) => (
                    <tr key={reminder.id} className="hover:bg-canvas/60">
                      <td className="px-5 py-3">
                        <p className="font-medium">
                          {reminder.patientFirstName} {reminder.patientLastName}
                        </p>
                        <p className="text-xs text-muted">
                          {reminder.practitionerName}
                        </p>
                      </td>
                      <td className="px-5 py-3 text-muted">
                        <p>{formatDate(reminder.appointmentStartsAt, session.clinic.timezone)}</p>
                        <p className="text-xs">
                          {formatTime(reminder.appointmentStartsAt, session.clinic.timezone)}
                        </p>
                      </td>
                      <td className="px-5 py-3 text-muted">
                        {channelLabel(reminder.channel, t)}
                      </td>
                      <td className="px-5 py-3 text-muted">
                        {formatDate(reminder.scheduledFor, session.clinic.timezone)} ·{" "}
                        {formatTime(reminder.scheduledFor, session.clinic.timezone)}
                      </td>
                      <td className="px-5 py-3">
                        <Badge
                          variant={
                            reminder.status === "failed"
                              ? "destructive"
                              : reminder.status === "sent"
                                ? "success"
                                : reminder.status === "cancelled"
                                  ? "secondary"
                                  : "warning"
                          }
                        >
                          {statusLabel(reminder.status)}
                        </Badge>
                        {reminder.errorCode ? (
                          <p className="mt-1 text-[10px] text-rose-700">
                            {reminder.errorCode}
                          </p>
                        ) : null}
                      </td>
                      <td className="px-5 py-3">
                        <ReminderActions
                          id={reminder.id}
                          status={reminder.status}
                        />
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </Card>
      ) : (
        <div className="space-y-5">
          {pendingOffers.length > 0 ? (
            <Card>
              <CardHeader>
                <div>
                  <p className="font-semibold">{t("messages.offers")}</p>
                  <p className="text-xs text-muted">
                    {t("messages.offersHint")}
                  </p>
                </div>
                <Badge variant="warning">{t("messages.pendingOffers", { count: pendingOffers.length })}</Badge>
              </CardHeader>
              <CardContent className="space-y-3">
                {pendingOffers.map((offer) => (
                  <div
                    key={offer.id}
                    className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-line bg-canvas p-4"
                  >
                    <div>
                      <p className="font-medium">
                        {offer.patientFirstName} {offer.patientLastName}
                      </p>
                      <p className="mt-0.5 text-xs text-muted">
                        {formatDate(offer.startsAt, session.clinic.timezone)} ·{" "}
                        {formatTime(offer.startsAt, session.clinic.timezone)} –{" "}
                        {formatTime(offer.endsAt, session.clinic.timezone)} ·{" "}
                        {offer.practitionerName}
                      </p>
                      <p className="mt-1 text-[11px] text-muted">
                        Vence {formatTime(offer.expiresAt, session.clinic.timezone)}
                      </p>
                    </div>
                    <WaitlistOfferActions id={offer.id} />
                  </div>
                ))}
              </CardContent>
            </Card>
          ) : null}

          <Card>
            <CardHeader>
              <div>
                <p className="font-semibold">{t("messages.waitingPatients")}</p>
                <p className="text-xs text-muted">
                  {t("messages.waitingHint")}
                </p>
              </div>
              <span className="text-xs text-muted">{entries.length} entradas</span>
            </CardHeader>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-canvas text-left text-xs uppercase tracking-wide text-muted">
                  <tr>
                    <th className="px-5 py-2.5 font-medium">{t("common.patient")}</th>
                    <th className="px-5 py-2.5 font-medium">{t("common.specialist")}</th>
                    <th className="px-5 py-2.5 font-medium">{t("messages.range")}</th>
                    <th className="px-5 py-2.5 font-medium">{t("messages.preferredTime")}</th>
                    <th className="px-5 py-2.5 font-medium">{t("messages.priority")}</th>
                    <th className="px-5 py-2.5 font-medium">{t("common.status")}</th>
                    <th className="px-5 py-2.5 font-medium" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-line">
                  {entries.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-5 py-10 text-center text-muted">
                        {t("messages.emptyWaitlist")}
                      </td>
                    </tr>
                  ) : (
                    entries.map((entry) => (
                      <tr key={entry.id} className="hover:bg-canvas/60">
                        <td className="px-5 py-3 font-medium">
                          {entry.patientFirstName} {entry.patientLastName}
                        </td>
                        <td className="px-5 py-3 text-muted">
                          {entry.practitionerName ?? "Cualquiera"}
                        </td>
                        <td className="px-5 py-3 text-muted">
                          {entry.earliestDate} → {entry.latestDate}
                        </td>
                        <td className="px-5 py-3 text-muted">
                          {entry.preferredTimeFrom && entry.preferredTimeTo
                            ? `${entry.preferredTimeFrom.slice(0, 5)} – ${entry.preferredTimeTo.slice(0, 5)}`
                            : "Cualquiera"}
                        </td>
                        <td className="px-5 py-3 tabular-nums">{entry.priority}</td>
                        <td className="px-5 py-3">
                          <Badge
                            variant={
                              entry.status === "booked"
                                ? "success"
                                : entry.status === "offered"
                                  ? "warning"
                                  : entry.status === "cancelled"
                                    ? "destructive"
                                    : "secondary"
                            }
                          >
                            {statusLabel(entry.status)}
                          </Badge>
                        </td>
                        <td className="px-5 py-3">
                          <WaitlistEntryActions
                            id={entry.id}
                            status={entry.status}
                          />
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}

function TabLink({
  href,
  active,
  children,
}: {
  href: string;
  active: boolean;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className={`focus-ring flex items-center rounded-lg px-3 py-2 text-sm font-medium ${
        active ? "bg-brand-50 text-brand-800" : "text-muted hover:text-ink"
      }`}
    >
      {children}
    </Link>
  );
}

function Stat({
  label,
  value,
  icon: Icon,
  tone,
}: {
  label: string;
  value: number;
  icon: typeof Bell;
  tone?: "rose";
}) {
  return (
    <Card>
      <CardContent className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm text-muted">{label}</p>
          <p className="mt-1 text-2xl font-semibold tabular-nums">{value}</p>
        </div>
        <span
          className={`flex h-9 w-9 items-center justify-center rounded-xl ${
            tone === "rose"
              ? "bg-rose-50 text-rose-700"
              : "bg-brand-50 text-brand-700"
          }`}
        >
          <Icon className="h-4 w-4" aria-hidden />
        </span>
      </CardContent>
    </Card>
  );
}
