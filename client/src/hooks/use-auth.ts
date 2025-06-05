import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/api-request";

interface AuthState {
  isAuthenticated: boolean;
  loading: boolean;
  error: boolean;
}

export function useAuth(): AuthState {
  const { data, isLoading, isError } = useQuery({
    queryKey: ["auth"],
    queryFn: () => apiRequest("GET", "/api/check-auth"),
    retry: false,
    refetchOnWindowFocus: false,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  return {
    isAuthenticated: data?.isAuthenticated || false,
    loading: isLoading,
    error: isError,
  };
} 