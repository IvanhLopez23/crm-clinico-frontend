import { CalendarClock, Stethoscope, UserRound } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { EmptyState } from "@/components/empty-state";
import { PractitionerCreateForm } from "@/components/practitioners/practitioner-create-form";
import { api } from "@/lib/api";
import { getI18n } from "@/i18n/server";
import { getSession } from "@/lib/session";
import type { Practitioner } from "@/lib/types";

export default async function PractitionersPage() {
  const session = await getSession();
  if (!session) redirect("/login");
  if (session.user.role === "practitioner") redirect("/mi-dia");
  const { t } = await getI18n();

  const practitioners = await api<Practitioner[]>(
    "/api/v1/practitioners?includeInactive=true",
    { token: session.token },
  );
  const canEdit = session.user.role === "admin";
  const active = practitioners.filter((item) => item.isActive !== false);

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="flex items-center gap-2 text-sm text-muted">
            <Stethoscope className="h-4 w-4" aria-hidden />
            {t("nav.specialists")}
          </p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight">
            {t("practitioners.title")}
          </h1>
          <p className="mt-1 text-sm text-muted">
            {t("practitioners.subtitle")}
          </p>
        </div>
        {canEdit ? <PractitionerCreateForm /> : null}
      </header>

      <div className="grid gap-3 sm:grid-cols-3">
        <div className="card p-4">
          <p className="text-sm text-muted">{t("practitioners.active")}</p>
          <p className="mt-1 text-2xl font-semibold">{active.length}</p>
        </div>
        <div className="card p-4">
          <p className="text-sm text-muted">{t("practitioners.inactive")}</p>
          <p className="mt-1 text-2xl font-semibold">
            {practitioners.length - active.length}
          </p>
        </div>
        <div className="card p-4">
          <p className="text-sm text-muted">{t("practitioners.accepting")}</p>
          <p className="mt-1 text-2xl font-semibold">
            {active.filter((item) => item.isAcceptingNewPatients !== false).length}
          </p>
        </div>
      </div>

      <section className="card overflow-hidden">
        <div className="flex items-center justify-between border-b border-line px-5 py-4">
          <h2 className="font-semibold">{t("nav.specialists")}</h2>
          <span className="text-xs text-muted">{practitioners.length}</span>
        </div>

        {practitioners.length === 0 ? (
          <EmptyState
            icon={UserRound}
            title={t("practitioners.emptyTitle")}
            description={t("practitioners.emptyHint")}
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-canvas text-left text-xs uppercase tracking-wide text-muted">
                <tr>
                  <th className="px-5 py-2.5 font-medium">{t("common.specialist")}</th>
                  <th className="px-5 py-2.5 font-medium">{t("practitioners.specialty")}</th>
                  <th className="px-5 py-2.5 font-medium">{t("practitioners.durationColumn")}</th>
                  <th className="px-5 py-2.5 font-medium">{t("common.status")}</th>
                  <th className="px-5 py-2.5 font-medium" />
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {practitioners.map((practitioner) => (
                  <tr key={practitioner.id} className="hover:bg-canvas/60">
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-2">
                        <span
                          className="h-2.5 w-2.5 rounded-full"
                          style={{ backgroundColor: practitioner.color ?? "#0F766E" }}
                          aria-hidden
                        />
                        <span className="font-medium">{practitioner.fullName}</span>
                      </div>
                    </td>
                    <td className="px-5 py-3 text-muted">
                      {practitioner.specialty ?? t("practitioners.general")}
                    </td>
                    <td className="px-5 py-3 text-muted">
                      <span className="inline-flex items-center gap-1 text-xs">
                        <CalendarClock className="h-3 w-3" aria-hidden />
                        {t("practitioners.durationByService")}
                      </span>
                    </td>
                    <td className="px-5 py-3">
                      <span
                        className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset ${
                          practitioner.isActive !== false
                            ? "bg-emerald-50 text-emerald-800 ring-emerald-200"
                            : "bg-slate-100 text-slate-700 ring-slate-200"
                        }`}
                      >
                        {practitioner.isActive !== false
                          ? t("users.active")
                          : t("users.inactive")}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-right">
                      <Link
                        href={`/especialistas/${practitioner.id}`}
                        className="focus-ring rounded-lg px-2 py-1 text-xs font-medium text-brand-700 hover:underline"
                      >
                        {t("practitioners.editAgenda")}
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
