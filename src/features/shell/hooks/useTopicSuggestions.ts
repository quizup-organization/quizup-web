import { useQuery } from "@tanstack/react-query";
import { queryKeys } from "@/lib/query-keys";
import { topicsService } from "@/features/topics";
import { normalize } from "@/lib/helpers";
import type { SearchRequest } from "@/shared/types/search";

/**
 * Suggestions de sujets pour la palette ⌘K — réutilise `POST /topics/search`
 * (pas d'endpoint de suggestions dédié).
 */
export function useTopicSuggestions(query: string, enabled: boolean) {
  const request: SearchRequest = {
    filters: [
      { property: "status", operator: "EQUALS", value: "PUBLISHED" },
      { property: "nameNormalized", operator: "CONTAINS", value: normalize(query) },
    ],
    sorts: [{ property: "followersCounter", direction: "DESC" }],
    page: { number: 0, size: 8 },
  };

  return useQuery({
    queryKey: queryKeys.topics.search(request),
    queryFn: () => topicsService.search(request),
    enabled: enabled && query.trim().length >= 2,
    staleTime: 60 * 1000,
    select: (page) => page.content,
  });
}
