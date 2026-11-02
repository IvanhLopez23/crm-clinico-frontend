import { ArrowLeft, CalendarDays, Stethoscope } from "lucide-react";
import { DateTime } from "luxon";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { AvailabilityRulesEditor } from "@/components/practitioners/availability-rules-editor";
import { PractitionerProfileForm } from "@/components/practitioners/practitioner-profile-form";
import { PractitionerServicesEditor } from "@/components/practitioners/practitioner-services-editor";
import { ScheduleBlocksEditor } from "@/components/practitioners/schedule-blocks-editor";
import { FlashToast } from "@/components/ui/flash-toast";
import { api } from "@/lib/api";
import { todayIn } from "@/lib/dates";
import { getI18n } from "@/i18n/server";
import { getSession } from "@/lib/session";
import type {
  AvailabilityRule,
  Practitioner,
  PractitionerService,
  ScheduleBlock,
  Service,
} from "@/lib/types";

const TAB_VALUES = ["general", "services", "availability", "blocks"] as const;
type TabValue = (typeof TAB_VALUES)[number];

function isTab(value: string | undefined): value is TabValue {
  return !!value && (TAB_VALUES as readonly string[]).includes(value);
}

export default async function PractitionerPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ created?: string; tab?: string }>;
}) {
  const session = await getSession();
  if (!session) redirect("/login");
  if (session.user.role === "practitioner") redirect("/mi-dia");

  const { id } = await params;
  const { created, tab } = await searchParams;
  const { token, clinic, user } = session;

  const practitioners = await api<Practitioner[]>(
    "/api/v1/practitioners?includeInactive=true",
    { token },
  );
  const practitioner = practitioners.find((item) => item.id === id);
  if (!practitioner) notFound();

  const from = DateTime.now().minus({ days: 30 }).toUTC().toISO() ?? "";
  const to = DateTime.now().plus({ days: 90 }).toUTC().toISO() ?? "";

  const [rules, blocks, practitionerServices, services] = await Promise.all([
    api<AvailabilityRule[]>(
      `/api/v1/availability/rules?practitionerId=${practitioner.id}`,
      { token },
    ),
    api<ScheduleBlock[]>(
      `/api/v1/availability/blocks?practitionerId=${practitioner.id}` +
        `&from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}`,
      { token },
    ),
    api<PractitionerService[]>(
      `/api/v1/practitioner-services?practitionerId=${practitioner.id}`,
      { token },
    ).catch(() => []),
    api<Service[]>("/api/v1/services?active=true", { token }).catch(() => []),
  ]);

  const canEdit = user.role === "admin";
  const { t } = await getI18n();
  const currentTab: TabValue = isTab(tab) ? tab : "general";
  const tabs: Array<{ value: TabValue; label: string; count?: number }> = [
    { value: "general", label: t("practitioners.tabGeneral") },
    {
      value: "services",
      label: t("practitioners.tabServices"),
      count: practitionerServices.length,
    },
    {
      value: "availability",
      label: t("practitioners.tabAvailability"),
      count: rules.length,
    },
    {
      value: "blocks",
      label: t("practitioners.tabBlocks"),
      count: blocks.length,
    },
  ];

  return (
    <div className="space-y-6">
      {created === "1" ? (
        <FlashToast
          message={t("practitioners.createdToast")}
          cleanPath={`/especialistas/${practitioner.id}?tab=${currentTab}`}
        />
      ) : null}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link
          href="/especialistas"
          className="focus-ring inline-flex items-center gap-2 rounded-lg px-2 py-1 text-sm font-medium text-muted hover:text-ink"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden />
          {t("nav.specialists")}
        </Link>
        <Link
          href="/agenda"
          className="focus-ring inline-flex items-center gap-2 rounded-xl border border-line bg-surface px-3 py-2 text-sm font-medium hover:border-brand-200 hover:text-brand-800"
        >
          <CalendarDays className="h-4 w-4" aria-hidden />
          {t("practitioners.viewAgenda")}
        </Link>
      </div>

      <header className="card flex flex-wrap items-start justify-between gap-4 p-5">
        <div className="flex items-start gap-4">
          <span
            className="flex h-12 w-12 items-center justify-center rounded-2xl text-white"
            style={{ backgroundColor: practitioner.color ?? "#0F766E" }}
          >
            <Stethoscope className="h-5 w-5" aria-hidden />
          </span>
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">
              {practitioner.fullName}
            </h1>
            <p className="mt-1 text-sm text-muted">
              {practitioner.specialty ?? t("practitioners.general")} ·{" "}
              {t("practitioners.durationByService")}
            </p>
            <p className="mt-2 text-xs text-muted">
              {practitioner.isActive !== false
                ? t("users.active")
                : t("users.inactive")}{" "}
              ·{" "}
              {practitioner.isAcceptingNewPatients !== false
                ? t("practitioners.acceptingNew")
                : t("practitioners.notAcceptingNew")}
            </p>
          </div>
        </div>
      </header>

      <nav
        aria-label={t("practitioners.tabsAria")}
        className="flex gap-1 overflow-x-auto rounded-xl border border-line bg-surface p-1"
      >
        {tabs.map((item) => {
          const active = item.value === currentTab;
          return (
            <Link
              key={item.value}
              href={`/especialistas/${practitioner.id}?tab=${item.value}`}
              scroll={false}
              aria-current={active ? "page" : undefined}
              className={`focus-ring inline-flex items-center gap-2 whitespace-nowrap rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                active
                  ? "bg-brand-700 text-white shadow-sm"
                  : "text-muted hover:bg-canvas hover:text-ink"
              }`}
            >
              {item.label}
              {item.count !== undefined ? (
                <span
                  className={`rounded-full px-1.5 py-0.5 text-[10px] font-semibold ${
                    active
                      ? "bg-white/15 text-white"
                      : "bg-canvas text-muted"
                  }`}
                >
                  {item.count}
                </span>
              ) : null}
            </Link>
          );
        })}
      </nav>

      {currentTab === "general" ? (
        canEdit ? (
          <PractitionerProfileForm practitioner={practitioner} />
        ) : (
          <p className="rounded-xl border border-line bg-surface px-4 py-3 text-sm text-muted">
            {t("practitioners.readOnlyHint")}
          </p>
        )
      ) : null}

      {currentTab === "services" ? (
        <PractitionerServicesEditor
          practitionerId={practitioner.id}
          assignments={practitionerServices}
          services={services}
          canEdit={canEdit}
          defaultDuration={practitioner.defaultSlotMinutes ?? 30}
        />
      ) : null}

      {currentTab === "availability" ? (
        <AvailabilityRulesEditor
          practitionerId={practitioner.id}
          rules={rules}
          timezone={clinic.timezone}
          today={todayIn(clinic.timezone)}
          canEdit={canEdit}
        />
      ) : null}

      {currentTab === "blocks" ? (
        <ScheduleBlocksEditor
          practitionerId={practitioner.id}
          blocks={blocks}
          timezone={clinic.timezone}
          today={todayIn(clinic.timezone)}
          canEdit={canEdit}
        />
      ) : null}
    </div>
  );
}
