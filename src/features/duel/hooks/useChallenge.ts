import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/lib/query-keys";
import { challengesService } from "../lib/challenges";

/**
 * Défi nominatif suivi en direct léger (poll 3 s tant qu'il est en attente) : le passage à
 * `ACCEPTED` (avec `roomId`) déclenche la bascule vers la salle.
 */
export function useChallenge(challengeId: string) {
  return useQuery({
    queryKey: queryKeys.challenges.detail(challengeId),
    queryFn: () => challengesService.get(challengeId),
    enabled: Boolean(challengeId),
    refetchInterval: (query) =>
      query.state.data?.status === "PENDING" ? 3_000 : false,
  });
}

/** Actions du défi (invité : accepter/refuser ; lanceur : annuler). */
export function useChallengeActions(challengeId: string) {
  const queryClient = useQueryClient();
  const invalidate = () =>
    queryClient.invalidateQueries({
      queryKey: queryKeys.challenges.detail(challengeId),
    });

  const accept = useMutation({
    mutationFn: () => challengesService.accept(challengeId),
    onSuccess: invalidate,
  });
  const decline = useMutation({
    mutationFn: () => challengesService.decline(challengeId),
    onSuccess: invalidate,
  });
  const cancel = useMutation({
    mutationFn: () => challengesService.cancel(challengeId),
    onSuccess: invalidate,
  });

  return {
    accept,
    decline,
    cancel,
    pending: accept.isPending || decline.isPending || cancel.isPending,
  };
}
