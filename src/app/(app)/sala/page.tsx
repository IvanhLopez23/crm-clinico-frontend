import { Monitor, UsersRound } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { SalaBoard } from "@/components/sala/sala-board";
import { api } from "@/lib/api";
import { formatDate, todayIn } from "@/lib/dates";
import { getI18n } from "@/i18n/server";
import { getSession } from "@/lib/session";
import type { WaitingRoomResponse } from "@/lib/types";

export default async function SalaPage({
  searchParams,
}: {
  searchParams: Promise<{ tv?: string }>;
}) {
  const session = await getSession();
  if (!session) redirect("/login");
  if (session.user.role === "practitioner") redirect("/mi-dia");
  const { t } = await getI18n();

  const params = await searchParams;
  if (params.tv === "1") redirect("/tv/sala");
  const date = todayIn(session.clinic.timezone);

  const room = await api<WaitingRoomResponse>(
    `/api/v1/waiting-room?date=${date}`,
    { token: session.token },
  );

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="flex items-center gap-2 text-sm text-muted">
            <UsersRound className="h-4 w-4" aria-hidden />
            {t("tv.waitingRoom")}
          </p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight">
            {t("sala.liveOperations")}
          </h1>
          <p className="mt-1 text-sm capitalize text-muted">
            {formatDate(room.date, room.timezone)}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href="/tv/sala"
            className="focus-ring inline-flex items-center gap-2 rounded-xl border border-line bg-surface px-3 py-2 text-sm font-medium hover:border-brand-200 hover:text-brand-800"
          >
            <Monitor className="h-4 w-4" aria-hidden />
            {t("sala.tvMode")}
          </Link>
          <Link
            href="/agenda"
            className="focus-ring inline-flex items-center gap-2 rounded-xl border border-line bg-surface px-3 py-2 text-sm font-medium hover:border-brand-200 hover:text-brand-800"
          >
            {t("nav.agenda")}
          </Link>
        </div>
      </header>

      <SalaBoard room={room} />
    </div>
  );
}
