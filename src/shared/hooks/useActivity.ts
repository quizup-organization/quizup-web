import { useQuery } from "@tanstack/react-query";
import { queryKeys } from "@/lib/query-keys";
import { profilesService } from "@/features/player";
import type { ActivityParams } from "@/features/player/domain/activity";

const STALE_MS = 5 * 60 * 1000;

/**
 * Activité journalière d'un joueur (streak + graphe de contribution) — server state React Query.
 */
export function useActivity(userId: string, params: ActivityParams = {}) {
  return useQuery({
    queryKey: queryKeys.profiles.activity(userId, params),
    queryFn: () => profilesService.activity(userId, params),
    enabled: !!userId,
    staleTime: STALE_MS,
  });
}
