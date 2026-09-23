import { useQuery } from "@tanstack/react-query";
import { getSessionUserId as getUserId } from "@/features/auth";
import { profilesService } from "@/lib/services/profiles";
import { queryKeys } from "@/lib/query-keys";

/**
 * Identité + progression du joueur connecté (server state via React Query).
 */
export function useCurrentPlayer() {
  const userId = getUserId();

  const profileQuery = useQuery({
    queryKey: queryKeys.profiles.detail(userId ?? ""),
    queryFn: () => profilesService.getById(userId as string),
    enabled: !!userId,
    staleTime: 10 * 60 * 1000,
  });

  const progressQuery = useQuery({
    queryKey: queryKeys.profiles.progress(userId ?? ""),
    queryFn: () => profilesService.getProgress(userId as string),
    enabled: !!userId,
    staleTime: 10 * 60 * 1000,
  });

  return {
    userId,
    profile: profileQuery.data,
    progression: progressQuery.data,
    isLoading: profileQuery.isLoading || progressQuery.isLoading,
  };
}
