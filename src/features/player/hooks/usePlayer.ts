import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { getSessionUserId as getUserId } from "@/features/auth";
import { queryKeys } from "@/lib/query-keys";
import type { Page } from "@/shared/types/api";
import type { Me } from "@/features/shell/domain/me";
import type {
  PlayerCard,
  PlayerProfile,
  ProfileGamesParams,
} from "../domain/profile";
import { profilesService } from "../lib/profiles";

const PROFILE_STALE_MS = 5 * 60 * 1000;
const LIST_STALE_MS = 5 * 60 * 1000;

/** Délai avant réconciliation : la projection Axon est en lecture différée. */
const RECONCILE_DELAY_MS = 2000;

/** Fiche joueur complète (profil + progression + stats + compteurs + présence + suivi). */
export function usePlayerProfile(userId: string) {
  return useQuery({
    queryKey: queryKeys.profiles.detail(userId),
    queryFn: () => profilesService.profile(userId),
    enabled: !!userId,
    staleTime: PROFILE_STALE_MS,
  });
}

/** Historique paginé des duels d'un joueur, enrichi adversaire + sujet + XP réelle. */
export function useProfileGames(userId: string, params: ProfileGamesParams) {
  return useQuery({
    queryKey: queryKeys.profiles.games(userId, params),
    queryFn: () => profilesService.games(userId, params),
    enabled: !!userId,
    staleTime: LIST_STALE_MS,
    placeholderData: (previous) => previous,
  });
}

/** Bilan des duels communs entre deux joueurs. */
export function useHeadToHead(userId: string, against: string) {
  return useQuery({
    queryKey: queryKeys.profiles.headToHead(userId, against),
    queryFn: () => profilesService.headToHead(userId, against),
    enabled: !!userId && !!against,
    staleTime: LIST_STALE_MS,
  });
}

/**
 * Suivi/ne plus suivre un joueur, **optimiste** (recette TanStack Query officielle) : la fiche
 * (`profiles.detail`), le joueur courant (`me`) et les listes de personnes sont simulés au clic
 * (`onMutate`), restaurés en erreur (`onError`), puis réconciliés après un délai (`onSettled`).
 */
export function useToggleUserFollow(playerId: string) {
  const queryClient = useQueryClient();
  const meId = getUserId() ?? "";
  const profileKey = queryKeys.profiles.detail(playerId);

  function cachedFollowing(): boolean {
    return (
      queryClient.getQueryData<PlayerProfile>(profileKey)?.following ?? false
    );
  }

  function patchOwnerViews(next: boolean) {
    queryClient.setQueryData<PlayerProfile>(profileKey, (previous) =>
      previous
        ? {
            ...previous,
            following: next,
            followersCount: Math.max(
              0,
              previous.followersCount + (next ? 1 : -1),
            ),
          }
        : previous,
    );
    queryClient.setQueryData<Me>(queryKeys.me(), (previous) =>
      previous
        ? {
            ...previous,
            followingCount: Math.max(
              0,
              previous.followingCount + (next ? 1 : -1),
            ),
          }
        : previous,
    );
  }

  function patchPeopleLists(next: boolean) {
    const profile = queryClient.getQueryData<PlayerProfile>(profileKey);
    const me = queryClient.getQueryData<Me>(queryKeys.me());
    const targetCard: PlayerCard | null = profile
      ? {
          userId: profile.userId,
          pseudonym: profile.pseudonym,
          avatarOptions: profile.avatarOptions,
          level: profile.progression.level,
          title: profile.progression.title,
          following: next,
          presence: profile.presence,
        }
      : null;
    const meCard: PlayerCard | null = me
      ? {
          userId: me.userId,
          pseudonym: me.pseudonym,
          avatarOptions: me.avatarOptions,
          level: me.progression.level,
          title: me.progression.title,
          following: true,
          presence: null,
        }
      : null;

    queryClient
      .getQueriesData<Page<PlayerCard>>({ queryKey: ["profiles", "people"] })
      .forEach(([key]) => {
        const [, , ownerId, direction] = key as readonly unknown[];
        const isTargetList = ownerId === meId && direction === "following";
        const isFollowersList = ownerId === playerId && direction === "followers";
        if (!isTargetList && !isFollowersList) return;

        const card = isTargetList ? targetCard : meCard;
        const rowId = isTargetList ? playerId : meId;
        queryClient.setQueryData<Page<PlayerCard>>(key, (previous) => {
          if (!previous) return previous;
          const exists = previous.content.some((row) => row.userId === rowId);
          if (next) {
            if (!card || exists) return previous;
            return {
              ...previous,
              content: [card, ...previous.content],
              totalElements: previous.totalElements + 1,
            };
          }
          if (!exists) return previous;
          return {
            ...previous,
            content: previous.content.filter((row) => row.userId !== rowId),
            totalElements: Math.max(0, previous.totalElements - 1),
          };
        });
      });
  }

  function scheduleReconcile() {
    window.setTimeout(() => {
      queryClient.invalidateQueries({ queryKey: profileKey });
      queryClient.invalidateQueries({ queryKey: queryKeys.me() });
      queryClient.invalidateQueries({ queryKey: ["profiles", "people"] });
    }, RECONCILE_DELAY_MS);
  }

  const mutation = useMutation({
    mutationFn: (next: boolean) =>
      next
        ? profilesService.follow(playerId)
        : profilesService.unfollow(playerId),
    onMutate: async (next: boolean) => {
      await queryClient.cancelQueries({ queryKey: profileKey });
      await queryClient.cancelQueries({ queryKey: queryKeys.me() });
      await queryClient.cancelQueries({ queryKey: ["profiles", "people"] });

      const previous = queryClient.getQueriesData({
        queryKey: ["profiles"],
      });
      const previousMe = queryClient.getQueryData<Me>(queryKeys.me());

      patchOwnerViews(next);
      patchPeopleLists(next);

      return { previous, previousMe };
    },
    onError: (_error, _next, context) => {
      if (!context) return;
      context.previous.forEach(([key, data]) =>
        queryClient.setQueryData(key, data),
      );
      queryClient.setQueryData(queryKeys.me(), context.previousMe);
    },
    onSettled: () => scheduleReconcile(),
  });

  function toggle() {
    if (mutation.isPending) return;
    mutation.mutate(!cachedFollowing());
  }

  return { toggle, isPending: mutation.isPending };
}
