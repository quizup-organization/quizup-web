import {
  useMutation,
  useQueries,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { getSessionUserId as getUserId } from "@/features/auth";
import { queryKeys } from "@/lib/query-keys";
import { challengesService } from "../lib/challenges";
import { profilesService } from "@/features/player";
import { topicsService, toTopicView } from "@/features/topics";
import type { Challenge, ChallengeStatus } from "@/features/challenges/domain/challenge";
import type { Topic } from "@/features/topics/domain/topic";
import type { PageResponse, SearchRequest } from "@/shared/types/search";

export type ChallengeDirection = "received" | "sent";

export interface ChallengeView {
  challenge: Challenge;
  direction: ChallengeDirection;
  otherId: string;
  otherName: string;
  topic: Topic;
}

/**
 * Défis reçus / envoyés. Pas d'endpoint dédié : `POST /search` filtré sur `challengedId`
 * (reçus) ou `challengerId` (envoyés) ; les noms/topics sont résolus côté client.
 */
export function useChallenges(direction: ChallengeDirection) {
  const userId = getUserId();
  const request: SearchRequest = {
    filters: [
      {
        property: direction === "received" ? "challengedId" : "challengerId",
        operator: "EQUALS",
        value: userId,
      },
    ],
    sorts: [{ property: "createdAt", direction: "DESC" }],
    page: { number: 0, size: 50 },
  };

  const query = useQuery({
    queryKey: queryKeys.challenges.search(request),
    queryFn: () => challengesService.search(request),
    enabled: !!userId,
    staleTime: 60 * 1000,
  });

  const challenges = query.data?.content ?? [];
  const otherIds = [
    ...new Set(
      challenges.map((c) =>
        direction === "received" ? c.challengerId : c.challengedId,
      ),
    ),
  ];
  const topicIds = [...new Set(challenges.map((c) => c.topicId))];

  const profileQueries = useQueries({
    queries: otherIds.map((id) => ({
      queryKey: queryKeys.profiles.detail(id),
      queryFn: () => profilesService.getById(id),
      staleTime: 10 * 60 * 1000,
    })),
  });
  const topicQueries = useQueries({
    queries: topicIds.map((id) => ({
      queryKey: queryKeys.topics.detail(id),
      queryFn: () => topicsService.getById(id),
      staleTime: 10 * 60 * 1000,
    })),
  });

  const nameById = new Map(
    otherIds.map((id, i) => [id, profileQueries[i]?.data?.displayName ?? "Joueur"]),
  );
  const topicById = new Map(
    topicIds.map((id, i) => {
      const dto = topicQueries[i]?.data;
      return [id, dto ? toTopicView(dto) : undefined];
    }),
  );

  const items: ChallengeView[] = challenges
    .map((challenge) => {
      const otherId =
        direction === "received" ? challenge.challengerId : challenge.challengedId;
      return {
        challenge,
        direction,
        otherId,
        otherName: nameById.get(otherId) ?? "Joueur",
        topic: topicById.get(challenge.topicId),
      };
    })
    .filter((view): view is ChallengeView => !!view.topic);

  return {
    items,
    total: query.data?.totalElements ?? 0,
    isLoading: query.isLoading,
    isFetching: query.isFetching,
    isError: query.isError,
  };
}

/**
 * Un défi par son id (`GET /api/challenges/{id}`), enrichi du sujet et du nom de l'adversaire.
 * Lecture by-id : plus de dérivation depuis une recherche. Le polling s'arrête dès que le défi
 * est résolu (statut terminal ou accepté avec partie créée).
 */
export function useChallengeById(challengeId: string) {
  const userId = getUserId();

  const challengeQuery = useQuery({
    queryKey: queryKeys.challenges.detail(challengeId),
    queryFn: () => challengesService.getById(challengeId),
    enabled: !!challengeId,
    staleTime: 60 * 1000,
    refetchInterval: (q) => {
      const data = q.state.data;
      if (!data) return 1000;
      if (data.status === "PENDING") return 1000;
      if (data.status === "ACCEPTED" && !data.gameId) return 1000;
      return false;
    },
  });

  const challenge = challengeQuery.data;
  const isChallenger = challenge?.challengerId === userId;
  const otherId = challenge
    ? isChallenger
      ? challenge.challengedId
      : challenge.challengerId
    : "";
  const topicId = challenge?.topicId ?? "";

  const profileQuery = useQuery({
    queryKey: queryKeys.profiles.detail(otherId),
    queryFn: () => profilesService.getById(otherId),
    enabled: !!otherId,
    staleTime: 10 * 60 * 1000,
  });
  const topicQuery = useQuery({
    queryKey: queryKeys.topics.detail(topicId),
    queryFn: () => topicsService.getById(topicId),
    enabled: !!topicId,
    staleTime: 10 * 60 * 1000,
  });

  const topicDto = topicQuery.data;
  const view: ChallengeView | undefined =
    challenge && topicDto
      ? {
          challenge,
          direction: isChallenger ? "sent" : "received",
          otherId,
          otherName: profileQuery.data?.displayName ?? "Joueur",
          topic: toTopicView(topicDto),
        }
      : undefined;

  return {
    view,
    challenge,
    isLoading: challengeQuery.isLoading,
    isError: challengeQuery.isError,
    isFetching:
      challengeQuery.isFetching ||
      topicQuery.isFetching ||
      profileQuery.isFetching,
  };
}

/** Nombre de défis reçus en attente (badge de navigation). */
export function usePendingChallengesCount() {
  const userId = getUserId();
  const request: SearchRequest = {
    filters: [
      { property: "challengedId", operator: "EQUALS", value: userId },
      { property: "status", operator: "EQUALS", value: "PENDING" },
    ],
    page: { number: 0, size: 1 },
  };

  return useQuery({
    queryKey: [...queryKeys.challenges.search(request), "count"],
    queryFn: () => challengesService.search(request),
    enabled: !!userId,
    select: (page) => page.totalElements,
    staleTime: 60 * 1000,
    refetchInterval: 60 * 1000,
  });
}

/** Délai avant réconciliation : la projection challenge est en lecture différée. */
const RECONCILE_DELAY_MS = 2000;

/**
 * Actions sur un défi, **optimistes** : le statut est simulé dans le cache au clic
 * (`onMutate` : annulation des refetch en vol + snapshot + patch), restauré en cas d'erreur
 * (`onError`), puis réconcilié avec la projection après un délai (`onSettled`).
 *
 * Recette TanStack Query officielle — cf. `best-practices/.frontend/server-state.md`.
 */
export function useChallengeActions() {
  const queryClient = useQueryClient();

  /** Patche le statut dans toutes les vues d'un défi (liste de recherche + détail by-id). */
  function patchStatus(challengeId: string, status: ChallengeStatus) {
    queryClient.setQueriesData<PageResponse<Challenge>>(
      { queryKey: ["challenges", "search"] },
      (page) =>
        page
          ? {
              ...page,
              content: page.content.map((c) =>
                c.challengeId === challengeId ? { ...c, status } : c,
              ),
            }
          : page,
    );
    queryClient.setQueryData<Challenge | undefined>(
      queryKeys.challenges.detail(challengeId),
      (previous) => (previous ? { ...previous, status } : previous),
    );
  }

  function scheduleReconcile() {
    window.setTimeout(() => {
      queryClient.invalidateQueries({ queryKey: queryKeys.challenges.all });
    }, RECONCILE_DELAY_MS);
  }

  function optimisticAction(
    mutationFn: (challengeId: string) => Promise<unknown>,
    status: ChallengeStatus,
  ) {
    return {
      mutationFn,
      onMutate: async (challengeId: string) => {
        await queryClient.cancelQueries({ queryKey: queryKeys.challenges.all });
        const previous = queryClient.getQueriesData({
          queryKey: queryKeys.challenges.all,
        });
        patchStatus(challengeId, status);
        return { previous };
      },
      onError: (
        _error: unknown,
        _challengeId: string,
        context?: { previous: Array<[readonly unknown[], unknown]> },
      ) => {
        context?.previous.forEach(([key, data]) =>
          queryClient.setQueryData(key, data),
        );
      },
      onSettled: () => scheduleReconcile(),
    };
  }

  const accept = useMutation(
    optimisticAction((id) => challengesService.accept(id), "ACCEPTED"),
  );
  const decline = useMutation(
    optimisticAction((id) => challengesService.decline(id), "DECLINED"),
  );
  const cancel = useMutation(
    optimisticAction((id) => challengesService.cancel(id), "CANCELED"),
  );

  return { accept, decline, cancel };
}

/** Création d'un défi vers un joueur sur un thème choisi → ouvre le lobby privé. */
export function useCreateChallenge() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  return useMutation({
    mutationFn: ({
      challengedId,
      topicId,
    }: {
      challengedId: string;
      topicId: string;
    }) => challengesService.create(challengedId, topicId),
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.challenges.all });
      navigate(`/challenges/${response.id}`);
    },
  });
}
