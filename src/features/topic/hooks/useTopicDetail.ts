import { useMemo, useRef } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { getSessionUserId as getUserId } from "@/features/auth";
import { queryKeys } from "@/lib/query-keys";
import { gamesService } from "@/lib/services/games";
import { leaderboardService, type LeaderboardPeriod, type LeaderboardScope } from "@/lib/services/leaderboard";
import { profilesService } from "@/lib/services/profiles";
import { topicFollowsService } from "@/lib/services/topic-follows";
import { topicsService } from "@/lib/services/topics";
import { emptyPage, pageOf } from "@/shared/utils/page";
import type { Game, TopicFollower } from "@/shared/types/domain";
import type { PageResponse, SearchRequest } from "@/shared/types/search";

/** Détail d'un sujet (DTO brut : on lit `questionsCounter`, `emoji`, `color`). */
export function useTopic(topicId: string) {
  return useQuery({
    queryKey: queryKeys.topics.detail(topicId),
    queryFn: () => topicsService.getById(topicId),
    enabled: !!topicId,
    staleTime: 10 * 60 * 1000,
  });
}

/** Record de suivi d'un sujet par `userId` (null si absent). */
async function fetchTopicFollowPage(userId: string, topicId: string): Promise<PageResponse<TopicFollower>> {
  return topicFollowsService.search({
    filters: [
      { property: "topicId", operator: "EQUALS", value: topicId },
      ...(userId
        ? [{ property: "userId", operator: "EQUALS", value: userId } as const]
        : []),
    ],
    page: { number: 0, size: 1 },
  });
}

/** Suivi du sujet par l'utilisateur courant (record de suivi + followId). */
export function useTopicFollow(topicId: string) {
  const userId = getUserId();
  return useQuery({
    queryKey: queryKeys.topicFollows.state(userId ?? "", topicId),
    queryFn: () => fetchTopicFollowPage(userId ?? "", topicId),
    enabled: !!userId,
    select: (page) => page.content[0] ?? null,
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

/**
 * Bascule de suivi d'un sujet, **instantanée et coalescée** : chaque clic met à jour l'état
 * et le compteur en optimiste, puis une file sérialise les appels réseau (pas de doublon).
 */
export function useToggleTopicFollow(topicId: string) {
  const queryClient = useQueryClient();
  const userId = getUserId();
  const stateKey = queryKeys.topicFollows.state(userId ?? "", topicId);
  const countKey = queryKeys.topicFollows.count(topicId);

  const desiredRef = useRef<boolean | null>(null);
  const runningRef = useRef(false);
  const knownFollowIdRef = useRef<string | null>(null);

  function setFollowState(record: TopicFollower | null) {
    queryClient.setQueryData(stateKey, record ? pageOf(record) : emptyPage<TopicFollower>());
  }

  function cachedFollow(): TopicFollower | null {
    return queryClient.getQueryData<PageResponse<TopicFollower>>(stateKey)?.content[0] ?? null;
  }

  function bumpCount(delta: number) {
    queryClient.setQueryData<number>(countKey, (previous) =>
      typeof previous === "number" ? Math.max(0, previous + delta) : previous,
    );
  }

  function applyOptimistic(next: boolean) {
    if (next) {
      setFollowState({
        followId: `pending-${topicId}`,
        topicId,
        userId: userId ?? "",
        followedAt: new Date().toISOString(),
      });
      bumpCount(1);
    } else {
      setFollowState(null);
      bumpCount(-1);
    }
  }

  async function serverFollowId(): Promise<string | null> {
    if (knownFollowIdRef.current) return knownFollowIdRef.current;
    const cached = cachedFollow();
    if (cached && !cached.followId.startsWith("pending-")) {
      knownFollowIdRef.current = cached.followId;
      return cached.followId;
    }
    for (let attempt = 0; attempt < 5; attempt += 1) {
      const record = await fetchTopicFollowPage(userId ?? "", topicId)
        .then((page) => page.content[0] ?? null)
        .catch(() => null);
      if (record) {
        knownFollowIdRef.current = record.followId;
        return record.followId;
      }
      await new Promise((resolve) => window.setTimeout(resolve, 200));
    }
    return null;
  }

  async function syncFromServer() {
    const record = await fetchTopicFollowPage(userId ?? "", topicId)
      .then((page) => page.content[0] ?? null)
      .catch(() => null);
    knownFollowIdRef.current = record?.followId ?? null;
    setFollowState(record);
  }

  async function applyFollow() {
    try {
      const data = await topicFollowsService.follow(topicId);
      knownFollowIdRef.current = data.id;
      setFollowState({
        followId: data.id,
        topicId,
        userId: userId ?? "",
        followedAt: new Date().toISOString(),
      });
    } catch {
      desiredRef.current = null;
      await syncFromServer();
    }
  }

  async function applyUnfollow() {
    const followId = await serverFollowId();
    if (!followId) {
      setFollowState(null);
      return;
    }
    try {
      await topicFollowsService.unfollow(followId);
      knownFollowIdRef.current = null;
      setFollowState(null);
    } catch {
      desiredRef.current = null;
      await syncFromServer();
    }
  }

  async function drainQueue() {
    if (runningRef.current) return;
    runningRef.current = true;
    try {
      while (desiredRef.current !== null) {
        const target = desiredRef.current;
        desiredRef.current = null;
        if (target) await applyFollow();
        else await applyUnfollow();
      }
    } finally {
      runningRef.current = false;
      // Rafraîchit le tri serveur (compteur theme) + le compteur autoritaire (réconciliation).
      queryClient.invalidateQueries({ queryKey: queryKeys.topics.all });
      window.setTimeout(() => {
        queryClient.invalidateQueries({ queryKey: countKey });
      }, RECONCILE_DELAY_MS);
    }
  }

  /** Bascule le suivi : effet visuel immédiat, requêtes coalescées en arrière-plan. */
  function toggle() {
    const next = !cachedFollow();
    applyOptimistic(next);
    desiredRef.current = next;
    void drainQueue();
  }

  return { toggle };
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
