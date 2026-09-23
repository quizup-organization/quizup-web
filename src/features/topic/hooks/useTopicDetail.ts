import { useMemo } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { getSessionUserId as getUserId } from "@/features/auth";
import { queryKeys } from "@/lib/query-keys";
import { gamesService } from "@/features/duel";
import { leaderboardService, type LeaderboardPeriod, type LeaderboardScope } from "@/features/topics";
import { profilesService } from "@/features/player";
import { topicFollowsService } from "@/features/topics";
import { topicsService } from "@/features/topics";
import { topicFollowId } from "@/shared/utils/follower-ids";
import type { Game } from "@/features/duel/domain/game-dto";
import type { TopicFollower } from "@/features/topics/domain/topic";
import type { ApiError, IdResponse, PageResponse, SearchRequest } from "@/shared/types/search";

/** Détail d'un sujet (DTO brut : on lit `questionsCounter`, `emoji`, `color`). */
export function useTopic(topicId: string) {
  return useQuery({
    queryKey: queryKeys.topics.detail(topicId),
    queryFn: () => topicsService.getById(topicId),
    enabled: !!topicId,
    staleTime: 10 * 60 * 1000,
  });
}

/**
 * Suivi du sujet par l'utilisateur courant, lu **par id déterministe**
 * (`GET /api/topic-follows/{userId}:{topicId}`). Un 404 signifie « non suivi » → `null`.
 */
export function useTopicFollow(topicId: string) {
  const userId = getUserId();
  const followId = userId && topicId ? topicFollowId(userId, topicId) : "";
  return useQuery({
    queryKey: queryKeys.topicFollows.state(userId ?? "", topicId),
    queryFn: async (): Promise<TopicFollower | null> => {
      try {
        return await topicFollowsService.getById(followId);
      } catch (error) {
        if ((error as ApiError | undefined)?.statusCode === 404) return null;
        throw error;
      }
    },
    enabled: !!userId && !!topicId,
    staleTime: 5 * 60 * 1000,
  });
}

/**
 * Nombre d'abonnés d'un sujet — source autoritaire : `POST /topic-follows/search`
 * (`totalElements`), plutôt que le compteur dénormalisé du service theme.
 */
export function useTopicFollowCount(topicId: string) {
  return useQuery({
    queryKey: queryKeys.topicFollows.count(topicId),
    queryFn: async (): Promise<number> =>
      (
        await topicFollowsService.search({
          filters: [{ property: "topicId", operator: "EQUALS", value: topicId }],
          page: { number: 0, size: 1 },
        })
      ).totalElements,
    enabled: !!topicId,
    staleTime: 60 * 1000,
  });
}

/** Délai avant réconciliation : la projection `topic-follows` est en lecture différée. */
const RECONCILE_DELAY_MS = 2000;

interface ToggleVariables {
  next: boolean;
  followId: string | null;
}

interface ToggleContext {
  state: TopicFollower | null | undefined;
  count: number | undefined;
  followed: PageResponse<TopicFollower> | undefined;
}

/**
 * Bascule de suivi d'un sujet, **optimiste** (recette TanStack Query officielle) : l'état, le
 * compteur et la liste des sujets suivis sont simulés au clic (`onMutate`), restaurés en erreur
 * (`onError`), puis réconciliés avec la projection après un délai (`onSettled`).
 */
export function useToggleTopicFollow(topicId: string) {
  const queryClient = useQueryClient();
  const userId = getUserId() ?? "";
  const stateKey = queryKeys.topicFollows.state(userId, topicId);
  const countKey = queryKeys.topicFollows.count(topicId);
  const followedKey = queryKeys.topicFollows.search({
    filters: [],
    page: { number: 0, size: 200 },
  });

  function cachedRecord(): TopicFollower | null {
    return queryClient.getQueryData<TopicFollower | null>(stateKey) ?? null;
  }

  function setState(record: TopicFollower | null) {
    queryClient.setQueryData(stateKey, record);
  }

  function bumpCount(delta: number) {
    queryClient.setQueryData<number>(countKey, (previous) =>
      typeof previous === "number" ? Math.max(0, previous + delta) : previous,
    );
  }

  /** Insère/retire le sujet dans la liste des sujets suivis (`useFollowedTopicIds`). */
  function patchFollowedList(record: TopicFollower | null, add: boolean) {
    queryClient.setQueryData<PageResponse<TopicFollower>>(
      followedKey,
      (previous) => {
        if (!previous) return previous;
        if (add) {
          if (!record || previous.content.some((row) => row.topicId === topicId)) {
            return previous;
          }
          return {
            ...previous,
            content: [record, ...previous.content],
            totalElements: previous.totalElements + 1,
          };
        }
        const content = previous.content.filter((row) => row.topicId !== topicId);
        if (content.length === previous.content.length) return previous;
        return {
          ...previous,
          content,
          totalElements: Math.max(0, previous.totalElements - 1),
        };
      },
    );
  }

  function scheduleReconcile() {
    window.setTimeout(() => {
      queryClient.invalidateQueries({ queryKey: countKey });
      queryClient.invalidateQueries({ queryKey: followedKey });
      queryClient.invalidateQueries({ queryKey: queryKeys.topics.all });
    }, RECONCILE_DELAY_MS);
  }

  const mutation = useMutation<
    IdResponse | null,
    unknown,
    ToggleVariables,
    ToggleContext
  >({
    mutationFn: async ({ next, followId }) => {
      if (next) return topicFollowsService.follow(topicId);
      if (followId) await topicFollowsService.unfollow(followId);
      return null;
    },
    onMutate: async ({ next, followId }) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.topicFollows.all });
      const context: ToggleContext = {
        state: queryClient.getQueryData<TopicFollower | null>(stateKey),
        count: queryClient.getQueryData<number>(countKey),
        followed:
          queryClient.getQueryData<PageResponse<TopicFollower>>(followedKey),
      };

      const optimistic: TopicFollower | null = next
        ? {
            followId: followId ?? `pending-${topicId}`,
            topicId,
            userId,
            followedAt: new Date().toISOString(),
          }
        : null;

      setState(optimistic);
      bumpCount(next ? 1 : -1);
      patchFollowedList(optimistic, next);

      return context;
    },
    onError: (_error, _variables, context) => {
      if (!context) return;
      queryClient.setQueryData(stateKey, context.state);
      queryClient.setQueryData(countKey, context.count);
      queryClient.setQueryData(followedKey, context.followed);
    },
    onSuccess: (data, { next }) => {
      if (next && data) {
        setState({
          followId: data.id,
          topicId,
          userId,
          followedAt: new Date().toISOString(),
        });
      }
    },
    onSettled: () => scheduleReconcile(),
  });

  /** Bascule le suivi : effet visuel immédiat, requête en arrière-plan. */
  function toggle() {
    if (mutation.isPending) return;
    const current = cachedRecord();
    const next = !current;
    const followId =
      current && !current.followId.startsWith("pending-")
        ? current.followId
        : null;
    mutation.mutate({ next, followId });
  }

  return { toggle, isPending: mutation.isPending };
}

export function useTopicLeaderboard(
  topicId: string,
  period: LeaderboardPeriod,
  scope: LeaderboardScope,
) {
  return useQuery({
    queryKey: queryKeys.leaderboard.topic(topicId, period, scope),
    queryFn: () => leaderboardService.topByTopic(topicId, period, scope, 50),
    staleTime: 5 * 60 * 1000,
  });
}

/** Rang du joueur courant dans le sujet (undefined si non classé — endpoint 204). */
export function useMyRank(
  topicId: string,
  period: LeaderboardPeriod = "all-time",
  scope: LeaderboardScope = "world",
) {
  const userId = getUserId();
  return useQuery({
    queryKey: [...queryKeys.leaderboard.topic(topicId, period, scope), "me", userId],
    queryFn: () => leaderboardService.myRank(topicId, period, scope),
    enabled: !!userId,
    staleTime: 5 * 60 * 1000,
    select: (entry) => entry ?? null,
  });
}

export function useTopicProgress(topicId: string) {
  const userId = getUserId();
  return useQuery({
    queryKey: queryKeys.profiles.topicProgress(userId ?? "", topicId),
    queryFn: () => profilesService.getTopicProgress(userId as string, topicId),
    enabled: !!userId,
    staleTime: 5 * 60 * 1000,
  });
}

/**
 * Parties d'un joueur (comme joueur 1 ou joueur 2), via deux `POST /games/search`
 * (le backend ne propose pas d'endpoint « parties d'un joueur »).
 */
export function useUserGames(): { data: Game[] | undefined; isLoading: boolean } {
  const userId = getUserId();

  const asPlayer1Request: SearchRequest = {
    filters: [{ property: "player1Id", operator: "EQUALS", value: userId }],
    sorts: [{ property: "createdAt", direction: "DESC" }],
    page: { number: 0, size: 200 },
  };
  const asPlayer2Request: SearchRequest = {
    filters: [{ property: "player2Id", operator: "EQUALS", value: userId }],
    sorts: [{ property: "createdAt", direction: "DESC" }],
    page: { number: 0, size: 200 },
  };

  const asPlayer1 = useQuery({
    queryKey: queryKeys.games.search(asPlayer1Request),
    queryFn: () => gamesService.search(asPlayer1Request),
    enabled: !!userId,
    staleTime: 5 * 60 * 1000,
    select: (page) => page.content,
  });
  const asPlayer2 = useQuery({
    queryKey: queryKeys.games.search(asPlayer2Request),
    queryFn: () => gamesService.search(asPlayer2Request),
    enabled: !!userId,
    staleTime: 5 * 60 * 1000,
    select: (page) => page.content,
  });

  const games = useMemo(() => {
    if (!asPlayer1.data && !asPlayer2.data) return undefined;
    const byId = new Map<string, Game>();
    [...(asPlayer1.data ?? []), ...(asPlayer2.data ?? [])].forEach((game) =>
      byId.set(game.gameId, game),
    );
    return [...byId.values()].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );
  }, [asPlayer1.data, asPlayer2.data]);

  return {
    data: games,
    isLoading: asPlayer1.isLoading || asPlayer2.isLoading,
  };
}
