"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

/**
 * Refresca los server components ante eventos de agenda/sala. El EventSource
 * vive en el mismo origen y Next lo proxya al backend con el token httpOnly.
 * Si SSE falla, cae a polling cada 15 s.
 */
export function useRealtimeRefresh(topics: Array<"agenda" | "sala" | "patients">) {
  const router = useRouter();

  useEffect(() => {
    let refreshTimer: ReturnType<typeof setTimeout> | undefined;
    let pollTimer: ReturnType<typeof setInterval> | undefined;
    let errors = 0;

    const refresh = () => {
      if (refreshTimer) clearTimeout(refreshTimer);
      refreshTimer = setTimeout(() => router.refresh(), 350);
    };

    const source = new EventSource(
      `/api/stream?topics=${encodeURIComponent(topics.join(","))}`,
    );

    source.addEventListener("update", refresh);
    source.addEventListener("ready", () => {
      errors = 0;
      if (pollTimer) {
        clearInterval(pollTimer);
        pollTimer = undefined;
      }
    });

    source.onerror = () => {
      errors += 1;
      // EventSource reintenta solo; tras 2 fallos seguidos, polling de respaldo.
      if (errors >= 2 && !pollTimer) {
        pollTimer = setInterval(() => router.refresh(), 15_000);
      }
    };

    return () => {
      if (refreshTimer) clearTimeout(refreshTimer);
      if (pollTimer) clearInterval(pollTimer);
      source.close();
    };
  }, [router, topics.join(",")]);
}
