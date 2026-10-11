import { useMemo, type RefObject } from "react";
import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { getSessionUserId as getUserId } from "@/features/auth";
import { queryKeys } from "@/lib/query-keys";
import type { Page } from "@/shared/types/api";
import { useLoadMoreOnIntersect } from "@/shared/hooks/useLoadMoreOnIntersect";
import { useScrollContainer } from "@/shared/hooks/useScrollContainer";
import type { Me } from "@/features/shell/domain/me";
import type { GameHistoryItem } from "../domain/history";
import type {
  PlayerCard,
  PlayerProfile,
  ProfileGamesParams,
} from "../domain/profile";
import { profilesService } from "../lib/profiles";
import { currentStreak, type StreakResult } from "@/shared/utils/streak";

const PROFILE_STALE_MS = 5 * 60 * 1000;
const LIST_STALE_MS = 5 * 60 * 1000;

/** Taille de page de l'historique des duels (scroll infini). */
const HISTORY_PAGE_SIZE = 5;

/** Scan de la série actuelle : au-delà de la limite d'affichage (10 ronds + `+N`). */
const STREAK_SCAN_SIZE = 12;

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

export interface GameHistory {
  items: GameHistoryItem[];
  isLoading: boolean;
  isError: boolean;
  hasNextPage: boolean;
  isFetchingNextPage: boolean;
  fetchNextPage: () => Promise<unknown>;
}

/**
 * Historique des duels en **scroll infini** : 5 parties par page (pagination serveur), la
 * sentinelle de `useHistorySentinel` charge la suite quand elle approche du viewport.
 */
export function useGameHistory(
  userId: string,
  params: Omit<ProfileGamesParams, "page" | "size"> = {},
): GameHistory {
  const query = useInfiniteQuery({
    queryKey: queryKeys.profiles.gamesInfinite(userId, params),
    queryFn: ({ pageParam }) =>
      profilesService.games(userId, { ...params, page: pageParam, size: HISTORY_PAGE_SIZE }),
    initialPageParam: 0,
    getNextPageParam: (lastPage) => (lastPage.last ? undefined : lastPage.page + 1),
    enabled: !!userId,
    staleTime: LIST_STALE_MS,
  });

  const items = useMemo(
    () => query.data?.pages.flatMap((page) => page.content) ?? [],
    [query.data],
  );

  return {
    items,
    isLoading: query.isLoading,
    isError: query.isError,
    hasNextPage: query.hasNextPage,
    isFetchingNextPage: query.isFetchingNextPage,
    fetchNextPage: query.fetchNextPage,
  };
}

/** Sentinelle de bas de liste à rendre (`ref`) : charge la page suivante au défilement. */
export function useHistorySentinel(
  history: GameHistory,
): RefObject<HTMLDivElement | null> {
  const scrollContainer = useScrollContainer();
  return useLoadMoreOnIntersect({
    enabled: history.hasNextPage && !history.isFetchingNextPage,
    onLoadMore: () => void history.fetchNextPage(),
    rootRef: scrollContainer,
  });
}

/**
 * Série actuelle d'un joueur (soi-même ou un joueur consulté) : scan court du début
 * d'historique (`createdAt desc`), dérivé en `{ outcome, count }` — exact jusqu'à la limite
 * d'affichage du composant (10 ronds + `+N`).
 */
export function usePlayerStreak(userId: string): StreakResult | null {
  const query = useQuery({
    queryKey: queryKeys.profiles.streak(userId),
    queryFn: () => profilesService.games(userId, { page: 0, size: STREAK_SCAN_SIZE }),
    enabled: !!userId,
    staleTime: LIST_STALE_MS,
  });
  return useMemo(() => currentStreak(query.data?.content ?? []), [query.data]);
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
