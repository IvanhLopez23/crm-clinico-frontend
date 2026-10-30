import { Activity } from "lucide-react";
import { notFound } from "next/navigation";
import { LanguageSwitcher } from "@/components/language-switcher";
import { PublicBookingWizard } from "@/components/public/public-booking-wizard";
import { api, ApiError } from "@/lib/api";
import { getI18n } from "@/i18n/server";
import type { PublicClinicData } from "@/lib/types";

export default async function PublicBookingPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const { t } = await getI18n();

  let data: PublicClinicData;
  try {
    data = await api<PublicClinicData>(
      `/api/v1/public/clinics/${encodeURIComponent(slug)}`,
    );
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) notFound();
    throw error;
  }

  return (
    <div className="min-h-dvh bg-canvas">
      <header className="border-b border-line bg-surface">
        <div className="mx-auto flex max-w-5xl items-center gap-3 px-5 py-4">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-700 text-white">
            <Activity className="h-5 w-5" aria-hidden />
          </span>
          <div>
            <p className="text-sm font-semibold">{data.clinic.name}</p>
            <p className="text-xs text-muted">{t("public.online")}</p>
          </div>
          <div className="ml-auto">
            <LanguageSwitcher compact />
          </div>
        </div>
      </header>

      <main className="px-4 py-8 sm:px-6 lg:px-8">
        <div className="mx-auto mb-6 max-w-5xl">
          <h1 className="text-2xl font-semibold tracking-tight">
            {t("public.book")}
          </h1>
          <p className="mt-1 text-sm text-muted">
            {data.clinic.name} · {data.clinic.timezone}
          </p>
        </div>
        <PublicBookingWizard data={data} />
      </main>
    </div>
  );
}
