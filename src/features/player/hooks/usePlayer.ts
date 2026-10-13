import { useMemo, useRef, type RefObject } from "react";
import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { getSessionUserId as getUserId } from "@/features/auth";
import { queryKeys } from "@/lib/query-keys";
import type { Page } from "@/shared/types/api";
import { useLoadMoreOnIntersect } from "@/shared/hooks/useLoadMoreOnIntersect";
import { useScrollContainer } from "@/shared/hooks/useScrollContainer";
import {
  beginIntent,
  endIntent,
  isCurrentIntent,
} from "@/shared/utils/latest-intent";
import { reconcileUntil } from "@/shared/utils/optimistic-reconcile";
import type { Me } from "@/features/shell/domain/me";
import type { GameHistoryItem } from "../domain/history";
import type {
  PlayerCard,
  PlayerProfile,
  ProfileGamesParams,
} from "../domain/profile";
import { profilesService } from "../lib/profiles";

/**
 * Vues mutables (suivi, compteurs) : `staleTime` court + refetch au focus pour qu'une valeur
 * résiduelle se corrige sans rechargement — voir `optimistic-reconcile.ts`.
 */
const PROFILE_STALE_MS = 30 * 1000;
const LIST_STALE_MS = 5 * 60 * 1000;

/** Taille de page de l'historique des duels (scroll infini). */
const HISTORY_PAGE_SIZE = 5;

/** Fiche joueur complète (profil + progression + stats + compteurs + présence + suivi). */
export function usePlayerProfile(userId: string) {
  return useQuery({
    queryKey: queryKeys.profiles.detail(userId),
    queryFn: () => profilesService.profile(userId),
    enabled: !!userId,
    staleTime: PROFILE_STALE_MS,
    refetchOnWindowFocus: true,
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
 * Suivi/ne plus suivre un joueur, **optimiste** : la fiche (`profiles.detail`), le joueur courant
 * (`me`) et les listes de personnes sont simulés au clic (`onMutate`), restaurés en erreur
 * (`onError`), puis **réconciliés jusqu'à convergence** (`onSettled`) : on relit la fiche tant que
 * `following` n'a pas basculé, sans jamais écraser le patch avec une projection en retard.
 *
 * Chaque clic démarre une **intention** (`latest-intent`, clé par joueur) : une boucle de
 * réconciliation périmée (un clic plus récent l'a remplacée) s'arrête sans écrire. Sans cette
 * garde, un double-clic suivre → ne plus suivre pouvait laisser la boucle du 1er clic converger
 * sur un état serveur intermédiaire **après** celle du 2e et figer le compteur jusqu'au refresh.
 */
interface FollowVariables {
  next: boolean;
  generation: number;
}

export function useToggleUserFollow(playerId: string) {
  const queryClient = useQueryClient();
  const meId = getUserId() ?? "";
  const profileKey = queryKeys.profiles.detail(playerId);
  const intentKey = `follow:${playerId}`;
  const inFlight = useRef(false);

  function cachedFollowing(): boolean {
    return (
      queryClient.getQueryData<PlayerProfile>(profileKey)?.following ?? false
    );
  }

  function patchOwnerViews(next: boolean) {
    const profile = queryClient.getQueryData<PlayerProfile>(profileKey);
    if (!profile || profile.following === next) return;
    const delta = next ? 1 : -1;

    queryClient.setQueryData<PlayerProfile>(profileKey, (previous) =>
      previous
        ? {
            ...previous,
            following: next,
            followersCount: Math.max(0, previous.followersCount + delta),
          }
        : previous,
    );
    queryClient.setQueryData<Me>(queryKeys.me(), (previous) =>
      previous
        ? {
            ...previous,
            followingCount: Math.max(0, previous.followingCount + delta),
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

  function invalidateFollowViews() {
    void queryClient.invalidateQueries({ queryKey: profileKey });
    void queryClient.invalidateQueries({ queryKey: queryKeys.me() });
    void queryClient.invalidateQueries({ queryKey: ["profiles", "people"] });
  }

  const mutation = useMutation({
    mutationFn: ({ next }: FollowVariables) =>
      next
        ? profilesService.follow(playerId)
        : profilesService.unfollow(playerId),
    onMutate: async ({ next }: FollowVariables) => {
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
    onError: (_error, { generation }, context) => {
      // Une intention plus récente a déjà patché les vues : ne jamais restaurer un snapshot périmé.
      if (!context || !isCurrentIntent(intentKey, generation)) return;
      context.previous.forEach(([key, data]) =>
        queryClient.setQueryData(key, data),
      );
      queryClient.setQueryData(queryKeys.me(), context.previousMe);
    },
    onSettled: (_data, error, { next, generation }: FollowVariables) => {
      if (error) return;
      void reconcileUntil<PlayerProfile>({
        read: () => profilesService.profile(playerId),
        matches: (view) => view.following === next,
        isCurrent: () => isCurrentIntent(intentKey, generation),
        onConverged: (view) => {
          queryClient.setQueryData(profileKey, view);
          void queryClient.invalidateQueries({ queryKey: queryKeys.me() });
          void queryClient.invalidateQueries({ queryKey: ["profiles", "people"] });
        },
        onTimeout: invalidateFollowViews,
      }).finally(() => endIntent(intentKey, generation));
    },
  });

  /**
   * Un seul aller-retour réseau à la fois (garde synchrone indépendante du rendu) ; les clics
   * arrivés pendant la réconciliation sont acceptés et deviennent la nouvelle intention — les
   * boucles précédentes se taisent (cf. `isCurrent`).
   */
  async function toggle(): Promise<void> {
    if (inFlight.current) return;
    inFlight.current = true;
    const next = !cachedFollowing();
    const generation = beginIntent(intentKey);
    try {
      await mutation.mutateAsync({ next, generation });
    } finally {
      inFlight.current = false;
    }
  }

  return { toggle, isPending: mutation.isPending };
}
