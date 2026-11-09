import { useQuery } from "@tanstack/react-query";
import { apiRequest, responseList } from "./api-request";
import {
  defaultSiteSettings,
  siteSettingsSchema,
  type ClinicService,
} from "@shared/catalog";
export function useServices() {
  return useQuery({
    queryKey: ["/api/services"],
    queryFn: () => apiRequest("GET", "/api/services"),
    select: (data) => responseList<ClinicService>(data, "services"),
    staleTime: 0,
    refetchOnWindowFocus: true,
  });
}
export function useSiteSettings() {
  const query = useQuery({
    queryKey: ["/api/site-settings"],
    queryFn: () => apiRequest("GET", "/api/site-settings"),
    select: (data) => siteSettingsSchema.parse(data.settings),
    staleTime: 0,
    refetchOnWindowFocus: true,
  });
  return { ...query, settings: query.data ?? defaultSiteSettings };
}
