const API_URL = process.env.API_BASE_URL ?? "http://127.0.0.1:3000";

export class ApiError extends Error {
  constructor(
    public readonly status: number,
    public readonly code: string,
    message: string,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

type ApiOptions = {
  method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  token?: string;
  clinicId?: string;
  body?: unknown;
};

/**
 * Cliente server-side del backend. El token nunca llega al navegador: vive en
 * una cookie httpOnly y solo lo usa el servidor de Next.
 */
export async function api<T>(
  path: string,
  options: ApiOptions = {},
): Promise<T> {
  const headers: Record<string, string> = {};

  if (options.body !== undefined) headers["content-type"] = "application/json";
  if (options.token) headers.authorization = `Bearer ${options.token}`;
  if (options.clinicId) headers["x-clinic-id"] = options.clinicId;

  const response = await fetch(`${API_URL}${path}`, {
    method: options.method ?? "GET",
    headers,
    body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
    cache: "no-store",
  });

  if (!response.ok) {
    let code = `HTTP_${response.status}`;
    let message = "No se pudo completar la solicitud";

    try {
      const payload = (await response.json()) as {
        error?: { code?: string; message?: string };
      };
      code = payload.error?.code ?? code;
      message = payload.error?.message ?? message;
    } catch {
      // respuesta sin JSON
    }

    throw new ApiError(response.status, code, message);
  }

  if (response.status === 204) return undefined as T;

  return (await response.json()) as T;
}

export { API_URL };
