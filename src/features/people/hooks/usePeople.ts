import { useQueries, useQuery } from "@tanstack/react-query";
import { getSessionUserId as getUserId } from "@/features/auth";
import { queryKeys } from "@/lib/query-keys";
import { profilesService } from "@/features/player";
import { userFollowsService } from "@/features/player";
import type { Person } from "../components/PersonCard";

export type PeopleDirection = "following" | "followers";

/**
 * Personnes (Abonnements = je suis / Abonnés = me suivent).
 * `user-follows` ne renvoie que des identifiants → on résout les noms via `profile`
 * **en un seul appel batch** (`userId IN [...]`). `withLevel` enrichit chaque personne de
 * son niveau (progression) — uniquement quand le tri par niveau est actif.
 */
export function usePeople(
  direction: PeopleDirection,
  options?: { withLevel?: boolean },
) {
  const userId = getUserId();
  const withLevel = options?.withLevel ?? false;

  const idsQuery = useQuery({
    queryKey:
      direction === "following"
        ? queryKeys.userFollows.following(userId ?? "")
        : queryKeys.userFollows.followers(userId ?? ""),
    queryFn: () =>
      direction === "following"
        ? userFollowsService.searchFollowing(userId as string, {
            number: 0,
            size: 200,
          })
        : userFollowsService.searchFollowers(userId as string, {
            number: 0,
            size: 200,
          }),
    enabled: !!userId,
    select: (page) =>
      page.content.map((r) =>
        direction === "following" ? r.followedId : r.followerId,
      ),
  });

  const ids = idsQuery.data ?? [];

  const profilesQuery = useQuery({
    queryKey: queryKeys.profiles.byIds(ids),
    queryFn: () => profilesService.getByIds(ids),
    enabled: ids.length > 0,
    staleTime: 10 * 60 * 1000,
  });

  const profileById = new Map(
    (profilesQuery.data ?? []).map((profile) => [profile.userId, profile]),
  );

  const progressQueries = useQueries({
    queries: withLevel
      ? ids.map((id) => ({
          queryKey: queryKeys.profiles.progress(id),
          queryFn: () => profilesService.getProgress(id),
          staleTime: 10 * 60 * 1000,
        }))
      : [],
  });

  const people: Person[] = ids.map((id, index) => ({
    userId: id,
    displayName: profileById.get(id)?.displayName ?? "Joueur",
    avatarOptions: profileById.get(id)?.avatarOptions,
    level: withLevel ? progressQueries[index]?.data?.level : undefined,
  }));

  return {
    people,
    isLoading:
      idsQuery.isLoading || profilesQuery.isLoading,
    isError: idsQuery.isError,
    refetch: idsQuery.refetch,
  };
}
