import { API_URL } from "@/lib/api";
import { getSession } from "@/lib/session";

export const dynamic = "force-dynamic";

export async function GET(
  _request: Request,
  {
    params,
  }: {
    params: Promise<{ clinicId: string; contractId: string }>;
  },
) {
  const session = await getSession();
  if (!session || session.scope !== "platform") {
    return new Response("No autorizado", { status: 401 });
  }

  const { clinicId, contractId } = await params;
  const upstream = await fetch(
    `${API_URL}/api/v1/platform/clinics/${clinicId}/contracts/${contractId}/file`,
    {
      headers: { authorization: `Bearer ${session.token}` },
      cache: "no-store",
    },
  );

  if (!upstream.ok || !upstream.body) {
    return new Response("Archivo no encontrado", {
      status: upstream.status || 404,
    });
  }

  return new Response(upstream.body, {
    status: 200,
    headers: {
      "content-type":
        upstream.headers.get("content-type") ?? "application/octet-stream",
      "content-disposition":
        upstream.headers.get("content-disposition") ?? "attachment",
      "cache-control": "private, no-store",
    },
  });
}
