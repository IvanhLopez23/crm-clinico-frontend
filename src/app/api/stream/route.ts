import { cookies } from "next/headers";
import { API_URL } from "@/lib/api";
import { SESSION_COOKIE } from "@/lib/session";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(request: Request): Promise<Response> {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE)?.value;
  if (!token) {
    return new Response("No autenticado", { status: 401 });
  }

  const url = new URL(request.url);
  const upstream = await fetch(
    `${API_URL}/api/v1/realtime/stream?${url.searchParams.toString()}`,
    {
      headers: {
        authorization: `Bearer ${token}`,
        accept: "text/event-stream",
      },
      cache: "no-store",
    },
  );

  if (!upstream.ok || !upstream.body) {
    return new Response("No se pudo abrir el canal de tiempo real", {
      status: upstream.status || 502,
    });
  }

  return new Response(upstream.body, {
    status: 200,
    headers: {
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}
