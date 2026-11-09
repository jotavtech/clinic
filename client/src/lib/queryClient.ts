import { QueryClient, QueryFunction } from "@tanstack/react-query";
import { apiRequest, ApiError } from "./api-request";
export { apiRequest } from "./api-request";

export const getQueryFn: <T>(options: { on401: "returnNull" | "throw" }) => QueryFunction<T> =
  ({ on401 }) => async ({ queryKey }) => {
    try { return await apiRequest("GET", queryKey[0] as string); }
    catch (error) {
      if (on401 === "returnNull" && error instanceof ApiError && error.status === 401) return null;
      throw error;
    }
  };

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: { queryFn: getQueryFn({ on401: "throw" }), refetchInterval: false,
      refetchOnWindowFocus: false, staleTime: 30000, retry: false },
    mutations: { retry: false },
  },
});
