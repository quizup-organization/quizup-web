import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { getSessionUserId as getUserId } from "@/features/auth";
import { queryKeys } from "@/lib/query-keys";
import type { Page } from "@/shared/types/api";
import type {
  ChallengeCard,
  ChallengeDetail,
  ChallengeListParams,
  ChallengeStatus,
} from "../domain/challenge";
import { challengesService } from "../lib/challenges";

const LIST_STALE_MS = 60 * 1000;

/** Délai avant réconciliation : la projection challenge est en lecture différée. */
const RECONCILE_DELAY_MS = 2000;

/** Liste paginée des défis (reçus / envoyés / tous), enrichie adversaire + sujet + actions. */
export function useChallenges(params: ChallengeListParams) {
  const userId = getUserId();
  return useQuery({
    queryKey: queryKeys.challenges.list(params),
    queryFn: () => challengesService.list(params),
    enabled: !!userId,
    staleTime: LIST_STALE_MS,
    placeholderData: (previous) => previous,
  });
}

/**
 * Un défi par son id (`GET /api/challenges/{id}`) : participants, sujet, runs et actions.
 * Le polling s'arrête dès que le défi est résolu (statut terminal ou partie créée).
 */
export function useChallengeById(challengeId: string) {
  return useQuery({
    queryKey: queryKeys.challenges.detail(challengeId),
    queryFn: () => challengesService.detail(challengeId),
    enabled: !!challengeId,
    staleTime: LIST_STALE_MS,
    refetchInterval: (query) => {
      const data = query.state.data;
      if (!data) return 1000;
      if (data.status === "PENDING") return 1000;
      if (data.status === "ACCEPTED" && !data.gameId) return 1000;
      return false;
    },
  });
}

/** Compteur de défis reçus en attente (badge de navigation). */
export function usePendingCount() {
  const userId = getUserId();
  return useQuery({
    queryKey: queryKeys.challenges.pendingCount(),
    queryFn: () => challengesService.pendingCount(),
    enabled: !!userId,
    staleTime: LIST_STALE_MS,
    refetchInterval: LIST_STALE_MS,
    select: (data) => data.count,
  });
}

/**
 * Actions sur un défi, **optimistes** : le statut est simulé dans le cache au clic
 * (`onMutate` : annulation des refetch en vol + snapshot + patch), restauré en cas d'erreur
 * (`onError`), puis réconcilié avec la projection après un délai (`onSettled`).
 */
export function useChallengeActions() {
  const queryClient = useQueryClient();

  function patchStatus(challengeId: string, status: ChallengeStatus) {
    queryClient.setQueriesData<Page<ChallengeCard>>(
      { queryKey: ["challenges", "list"] },
      (page) =>
        page
          ? {
              ...page,
              content: page.content.map((card) =>
                card.challengeId === challengeId ? { ...card, status } : card,
              ),
            }
          : page,
    );
    queryClient.setQueryData<ChallengeDetail>(
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
