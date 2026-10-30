import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { SalaBoard } from "@/components/sala/sala-board";
import { NewsCarousel, WeatherToday } from "@/components/tv/tv-carousels";
import { api } from "@/lib/api";
import { formatDate, todayIn } from "@/lib/dates";
import { getI18n } from "@/i18n/server";
import { getSession } from "@/lib/session";
import { getNews, getWeather } from "@/lib/tv-content";
import type { WaitingRoomResponse } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function TvSalaPage() {
  const session = await getSession();
  if (!session) redirect("/login");
  if (session.user.role === "practitioner") redirect("/mi-dia");
  const { t } = await getI18n();

  const date = todayIn(session.clinic.timezone);
  const [room, weather, news] = await Promise.all([
    api<WaitingRoomResponse>(`/api/v1/waiting-room?date=${date}`, {
      token: session.token,
    }),
    getWeather(session.clinic.timezone),
    getNews(),
  ]);

  return (
    <div className="flex min-h-dvh w-full flex-col px-4 pb-4 pt-4 sm:px-6 sm:pt-5 xl:px-10">
      <div className="mb-3 flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-sm text-muted">{t("tv.waitingRoom")}</p>
          <p className="text-lg font-semibold capitalize">
            {formatDate(room.date, room.timezone)}
          </p>
        </div>
        <Link
          href="/sala"
          className="focus-ring inline-flex items-center gap-2 rounded-xl border border-line bg-surface px-3 py-2 text-sm font-medium shadow-sm hover:border-brand-200 hover:text-brand-800"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden />
          {t("tv.backToRoom")}
        </Link>
      </div>

      <div className="min-h-0 flex-1">
        <SalaBoard room={room} tv />
      </div>

      {weather || news.length > 0 ? (
        <div className="mt-auto grid gap-3 pt-3 lg:grid-cols-[minmax(260px,1fr)_3fr] lg:items-stretch">
          {weather ? <WeatherToday weather={weather} /> : null}
          {news.length > 0 ? <NewsCarousel items={news} /> : null}
        </div>
      ) : null}
    </div>
  );
}
