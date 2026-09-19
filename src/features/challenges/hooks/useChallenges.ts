import {
  useMutation,
  useQueries,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { useRef } from "react";
import { useNavigate } from "react-router-dom";
import { getUserId } from "@/lib/auth";
import { queryKeys } from "@/lib/query-keys";
import { challengesService } from "@/lib/services/challenges";
import { profilesService } from "@/lib/services/profiles";
import { topicsService, toTopicView } from "@/lib/services/topics";
import type { Challenge, ChallengeStatus, Topic } from "@/shared/types/domain";
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
 *
 * `pollUntilId` : poll tant que ce défi n'apparaît pas (projection en lecture différée
 * juste après la création — évite un faux « Défi introuvable »).
 */
export function useChallenges(
  direction: ChallengeDirection,
  options?: { pollUntilId?: string },
) {
  const userId = getUserId();
  const pollsRef = useRef(0);
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
    refetchInterval: (q) => {
      const target = options?.pollUntilId;
      if (!target) return false;
      const found = q.state.data?.content.find((c) => c.challengeId === target);
      if (!found) {
        pollsRef.current += 1;
        return pollsRef.current > 20 ? false : 1000;
      }
      // Le lobby suit le défi jusqu'à résolution : accepté avec partie créée, ou terminal.
      const resolved =
        (found.status === "ACCEPTED" && !!found.gameId) ||
        found.status === "DECLINED" ||
        found.status === "EXPIRED";
      if (resolved) {
        pollsRef.current = 0;
        return false;
      }
      pollsRef.current += 1;
      return pollsRef.current > 600 ? false : 1000;
    },
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

/** Un défi par identifiant (reçus + envoyés fusionnés, avec polling de projection). */
export function useChallengeById(challengeId: string) {
  const received = useChallenges("received", { pollUntilId: challengeId });
  const sent = useChallenges("sent", { pollUntilId: challengeId });
  const view = [...received.items, ...sent.items].find(
    (v) => v.challenge.challengeId === challengeId,
  );
  return {
    view,
    isLoading: received.isLoading || sent.isLoading,
    isFetching: received.isFetching || sent.isFetching,
    isError: received.isError || sent.isError,
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

export function useChallengeActions() {
  const queryClient = useQueryClient();

  /** Met à jour le statut dans le cache (projection challenge en lecture différée). */
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
  }

  const accept = useMutation({
    mutationFn: (challengeId: string) => challengesService.accept(challengeId),
    onSuccess: (_data, challengeId) => {
      patchStatus(challengeId, "ACCEPTED");
      queryClient.invalidateQueries({ queryKey: queryKeys.challenges.all });
    },
  });

  const decline = useMutation({
    mutationFn: (challengeId: string) => challengesService.decline(challengeId),
    onSuccess: (_data, challengeId) => {
      patchStatus(challengeId, "DECLINED");
      queryClient.invalidateQueries({ queryKey: queryKeys.challenges.all });
    },
  });

  return { accept, decline };
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
