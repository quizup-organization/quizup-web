import { useQuery } from "@tanstack/react-query";
import { queryKeys } from "@/lib/query-keys";
import { profilesService } from "@/lib/services/profiles";
import type { SearchRequest } from "@/shared/types/search";

/** Recherche de joueurs pour la palette ⌘K (`POST /profiles/search`). */
export function useProfileSuggestions(query: string, enabled: boolean) {
  const request: SearchRequest = {
    filters: [{ property: "displayName", operator: "CONTAINS", value: query.trim() }],
    page: { number: 0, size: 5 },
  };

  return useQuery({
    queryKey: queryKeys.profiles.search(request),
    queryFn: () => profilesService.search(request),
    enabled: enabled && query.trim().length >= 2,
    staleTime: 60 * 1000,
    select: (page) => page.content,
  });
}
