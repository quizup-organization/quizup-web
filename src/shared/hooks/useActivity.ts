import { useQuery } from "@tanstack/react-query";
import { queryKeys } from "@/lib/query-keys";
import { activityService } from "@/lib/services/activity";

/**
 * Activité journalière d'un joueur (streak + graphe de contribution) — server state React Query.
 */
export function useActivity(userId: string) {
  return useQuery({
    queryKey: queryKeys.activity.detail(userId),
    queryFn: () => activityService.get(userId),
    enabled: !!userId,
    staleTime: 5 * 60 * 1000,
  });
}
