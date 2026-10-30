import { redirect } from "next/navigation";
import { AvailabilityPlanner } from "@/components/availability/availability-planner";
import { api } from "@/lib/api";
import { isValidDate, todayIn } from "@/lib/dates";
import { getI18n } from "@/i18n/server";
import { getSession } from "@/lib/session";
import type {
  Practitioner,
  PractitionerService,
  Service,
} from "@/lib/types";

export default async function AvailabilityPage({
  searchParams,
}: {
  searchParams: Promise<{
    practitionerId?: string;
    date?: string;
  }>;
}) {
  const session = await getSession();
  if (!session) redirect("/login");
  if (session.user.role === "practitioner") redirect("/mi-dia");
  const { t } = await getI18n();

  const { token, clinic } = session;
  const params = await searchParams;

  const [practitioners, services, practitionerServices] = await Promise.all([
    api<Practitioner[]>("/api/v1/practitioners", { token }),
    api<Service[]>("/api/v1/services?active=true", { token }),
    api<PractitionerService[]>("/api/v1/practitioner-services", {
      token,
    }).catch(() => []),
  ]);

  const practitionerId =
    practitioners.find((item) => item.id === params.practitionerId)?.id ??
    practitioners[0]?.id ??
    null;
  const date = isValidDate(params.date)
    ? params.date
    : todayIn(clinic.timezone);

  return (
    <div className="space-y-6">
      <header>
        <p className="text-sm text-muted">{t("nav.availability")}</p>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight">
          {t("availability.pageTitle")}
        </h1>
        <p className="mt-1 text-sm text-muted">
          {t("availability.pageHint")}
        </p>
      </header>

      <AvailabilityPlanner
        practitioners={practitioners}
        services={services}
        practitionerServices={practitionerServices}
        timezone={clinic.timezone}
        initialPractitionerId={practitionerId}
        initialDate={date}
      />
    </div>
  );
}
