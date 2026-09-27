import { useQuery } from "@tanstack/react-query";
import { getSessionUserId as getUserId } from "@/features/auth";
import { queryKeys } from "@/lib/query-keys";
import { profilesService } from "@/features/player";
import type {
  PeopleDirection,
  PeopleParams,
} from "@/features/player/domain/profile";

const STALE_MS = 5 * 60 * 1000;

/**
 * Personnes (Abonnements = je suis / Abonnés = me suivent) — recherche, tri et pagination
 * serveur ; le BFF enrichit chaque carte (niveau, titre, présence).
 */
export function usePeople(direction: PeopleDirection, params: PeopleParams = {}) {
  const userId = getUserId();
  return useQuery({
    queryKey: queryKeys.profiles.people(userId ?? "", direction, params),
    queryFn: () => profilesService.people(userId as string, direction, params),
    enabled: !!userId,
    staleTime: STALE_MS,
    placeholderData: (previous) => previous,
  });
}
