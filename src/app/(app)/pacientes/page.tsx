import { Search, UsersRound } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { EmptyState } from "@/components/empty-state";
import { PatientCreateForm } from "@/components/patients/patient-create-form";
import { PatientSearchInput } from "@/components/patients/patient-search-input";
import { StatusBadge } from "@/components/status-badge";
import { api, ApiError } from "@/lib/api";
import { getI18n } from "@/i18n/server";
import { getSession } from "@/lib/session";
import type { PatientSearchResult } from "@/lib/types";

export default async function PatientsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const session = await getSession();
  if (!session) redirect("/login");
  if (session.user.role === "practitioner") redirect("/mi-dia");

  const { t } = await getI18n();
  const params = await searchParams;
  const query = (params.q ?? "").trim();

  let patients: PatientSearchResult[] = [];
  let error: string | null = null;

  if (query.length >= 2) {
    try {
      patients = await api<PatientSearchResult[]>(
        `/api/v1/patients?q=${encodeURIComponent(query)}&limit=30`,
        { token: session.token },
      );
    } catch (err) {
      error =
        err instanceof ApiError
          ? err.message
          : t("patients.searchError");
    }
  }

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm text-muted">{t("nav.patients")}</p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight">
            {t("patients.heading")}
          </h1>
          <p className="mt-1 text-sm text-muted">
            {t("patients.subtitle")}
          </p>
        </div>
        <PatientCreateForm />
      </header>

      <PatientSearchInput initialQuery={query} />

      {error ? (
        <p
          role="alert"
          className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700"
        >
          {error}
        </p>
      ) : null}

      <section className="card overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-line px-5 py-4">
          <h2 className="font-semibold">{t("patients.results")}</h2>
          <span className="text-xs text-muted">
            {query.length < 2
              ? t("patients.minChars")
              : t("patients.resultsCount", { count: patients.length })}
          </span>
        </div>

        {query.length < 2 ? (
          <EmptyState
            icon={Search}
            title={t("patients.emptyTitle")}
            description={t("patients.emptyDescription")}
          />
        ) : patients.length === 0 ? (
          <EmptyState
            icon={UsersRound}
            title={t("patients.noResultsTitle")}
            description={t("patients.noResultsDescription")}
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-canvas text-left text-xs uppercase tracking-wide text-muted">
                <tr>
                  <th scope="col" className="px-5 py-2.5 font-medium">
                    {t("patients.tablePatient")}
                  </th>
                  <th scope="col" className="px-5 py-2.5 font-medium">
                    {t("patients.tableBirth")}
                  </th>
                  <th scope="col" className="px-5 py-2.5 font-medium">
                    {t("patients.tableContact")}
                  </th>
                  <th scope="col" className="px-5 py-2.5 font-medium">
                    {t("patients.tableStatus")}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {patients.map((patient) => (
                  <tr key={patient.id} className="hover:bg-canvas/60">
                    <td className="px-5 py-3">
                      <Link
                        href={`/pacientes/${patient.id}`}
                        className="focus-ring font-medium text-brand-800 hover:underline"
                      >
                        {patient.preferredName ?? patient.firstName} {patient.lastName}
                      </Link>
                    </td>
                    <td className="px-5 py-3 text-muted">
                      {patient.birthDate ?? "—"}
                    </td>
                    <td className="px-5 py-3 text-muted">
                      <div className="space-y-0.5">
                        <p>{patient.phoneMasked ?? t("patients.noPhone")}</p>
                        <p className="text-xs">{patient.emailMasked ?? ""}</p>
                      </div>
                    </td>
                    <td className="px-5 py-3">
                      <StatusBadge status={patient.status} />
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
