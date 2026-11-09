export class ApiError extends Error {
  constructor(message: string, public status: number) { super(message); }
}

export async function apiRequest(method: string, url: string, data?: unknown): Promise<any> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 15000);
  try {
    const response = await fetch(url, {
      method, credentials: "include", signal: controller.signal,
      headers: data === undefined ? {} : { "Content-Type": "application/json" },
      body: data === undefined ? undefined : JSON.stringify(data),
    });
    if (response.status === 401 && url !== "/api/login" && url !== "/api/check-auth") {
      window.dispatchEvent(new Event("auth:expired"));
    }
    const payload = await response.json().catch(() => null);
    if (!response.ok) {
      throw new ApiError(payload?.message || "Não foi possível concluir a solicitação. Tente novamente.", response.status);
    }
    if (response.status === 204) return null;
    if (payload === null) throw new Error("O servidor enviou uma resposta inválida. Tente novamente mais tarde.");
    return payload;
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") {
      throw new Error("O servidor demorou para responder. Verifique sua conexão e tente novamente.");
    }
    if (error instanceof TypeError) throw new Error("Não foi possível conectar ao servidor. Verifique sua conexão.");
    throw error;
  } finally { clearTimeout(timer); }
}

export function responseList<T>(data: Record<string, unknown>, key: string): T[] {
  if (!data || !Array.isArray(data[key])) throw new Error("O servidor enviou uma lista inválida.");
  return data[key] as T[];
} 