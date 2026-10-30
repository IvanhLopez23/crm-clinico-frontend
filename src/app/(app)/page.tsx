import {
  CalendarCheck2,
  CalendarClock,
  CalendarDays,
  CalendarX2,
} from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { EmptyState } from "@/components/empty-state";
import { StatCard } from "@/components/stat-card";
import { StatusBadge } from "@/components/status-badge";
import { api } from "@/lib/api";
import { dayRange, formatDate, formatTime, todayIn } from "@/lib/dates";
import { getI18n } from "@/i18n/server";
import { getSession } from "@/lib/session";
import type { Appointment } from "@/lib/types";

export default async function DashboardPage() {
  const session = await getSession();
  if (!session) redirect("/login");
  if (session.user.role === "practitioner" && session.user.practitionerId) {
    redirect("/mi-dia");
  }

  const { token, clinic, user } = session;
  const { t } = await getI18n();
  const today = todayIn(clinic.timezone);
  const { from, to } = dayRange(today, clinic.timezone);

  const appointments = await api<Appointment[]>(
    `/api/v1/appointments?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}`,
    { token },
  );

  const total = appointments.length;
  const confirmed = appointments.filter((a) => a.status === "confirmed").length;
  const cancelled = appointments.filter((a) => a.status === "cancelled").length;
  const noShow = appointments.filter((a) => a.status === "no_show").length;
  const firstName = user.fullName.split(" ")[0] ?? user.fullName;

  return (
    <div>
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm capitalize text-muted">
            {formatDate(today, clinic.timezone)}
          </p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight">
            {t("dashboard.greeting", { name: firstName })}
          </h1>
          <p className="mt-1 text-sm text-muted">{t("dashboard.pulse")}</p>
        </div>

        <Link
          href="/agenda"
          className="focus-ring inline-flex items-center gap-2 rounded-xl border border-line bg-surface px-4 py-2 text-sm font-medium text-ink shadow-sm transition-colors hover:border-brand-200 hover:text-brand-800"
        >
          <CalendarDays className="h-4 w-4" aria-hidden />
          {t("dashboard.viewAgenda")}
        </Link>
      </header>

      <section className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label={t("dashboard.todayAppointments")}
          value={total}
          hint={t("dashboard.todayHint")}
          icon={CalendarDays}
        />
        <StatCard
          label={t("dashboard.confirmed")}
          value={confirmed}
          hint={
            total
              ? t("dashboard.confirmedHint", {
                  percent: Math.round((confirmed / total) * 100),
                })
              : t("dashboard.noAppointments")
          }
          icon={CalendarCheck2}
        />
        <StatCard
          label={t("dashboard.cancelled")}
          value={cancelled}
          hint={t("dashboard.cancelledHint")}
          icon={CalendarX2}
          tone="rose"
        />
        <StatCard
          label={t("dashboard.noShow")}
          value={noShow}
          hint={t("dashboard.noShowHint")}
          icon={CalendarClock}
          tone="amber"
        />
      </section>

      <section className="mt-8">
        <div className="card overflow-hidden">
          <div className="flex items-center justify-between border-b border-line px-5 py-4">
            <div>
              <h2 className="font-semibold">{t("dashboard.agendaToday")}</h2>
              <p className="text-xs text-muted">
                {t("specialist.count", { count: total })} · {clinic.timezone}
              </p>
            </div>
            <Link
              href="/agenda"
              className="focus-ring rounded-lg px-2 py-1 text-sm font-medium text-brand-700 hover:text-brand-800"
            >
              {t("dashboard.openAgenda")}
            </Link>
          </div>

          {appointments.length === 0 ? (
            <EmptyState
              icon={CalendarDays}
              title={t("dashboard.emptyTitle")}
              description={t("dashboard.emptyDescription")}
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-canvas text-left text-xs uppercase tracking-wide text-muted">
                  <tr>
                    <th scope="col" className="px-5 py-2.5 font-medium">
                      {t("dashboard.time")}
                    </th>
                    <th scope="col" className="px-5 py-2.5 font-medium">
                      {t("common.patient")}
                    </th>
                    <th scope="col" className="px-5 py-2.5 font-medium">
                      {t("common.specialist")}
                    </th>
                    <th scope="col" className="px-5 py-2.5 font-medium">
                      {t("dashboard.status")}
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line">
                  {appointments.map((appointment) => (
                    <tr key={appointment.id}>
                      <td className="whitespace-nowrap px-5 py-3 font-medium tabular-nums">
                        {formatTime(appointment.startsAt, clinic.timezone)}
                      </td>
                      <td className="px-5 py-3">
                        {appointment.patientFirstName}{" "}
                        {appointment.patientLastName}
                      </td>
                      <td className="px-5 py-3 text-muted">
                        {appointment.practitionerName}
                      </td>
                      <td className="px-5 py-3">
                        <StatusBadge status={appointment.status} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
