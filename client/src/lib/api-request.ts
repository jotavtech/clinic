type HttpMethod = "GET" | "POST" | "PUT" | "DELETE";

export async function apiRequest(
  method: HttpMethod,
  url: string,
  data?: any
): Promise<any> {
  const config: RequestInit = {
    method,
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "include", // Para incluir cookies de sessão
  };

  if (data && method !== "GET") {
    config.body = JSON.stringify(data);
  }

  const response = await fetch(url, config);
  
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ message: "Erro na requisição" }));
    throw new Error(errorData.message || `HTTP Error: ${response.status}`);
  }

  return response.json();
} 