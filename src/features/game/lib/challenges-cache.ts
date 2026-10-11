import type { QueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/lib/query-keys";
import type { ChallengeView } from "../domain/challenge";

/** La projection Axon peut encore exposer le défi ~2 s après l'annulation. */
const RECONCILE_DELAY_MS = 2_000;

/** Retrait optimiste du défi des listes observables (« Tes défis en attente »). */
export function removeChallengeFromCaches(
  queryClient: QueryClient,
  challengeId: string,
): void {
  queryClient.setQueryData<ChallengeView[]>(
    queryKeys.challenges.mine(),
    (current) =>
      current?.filter((challenge) => challenge.challengeId !== challengeId),
  );
}

/**
 * Réconciliation différée avec la projection Axon (2 s). Sans ce délai, une invalidation
 * immédiate refetch le défi encore en attente côté lecture et la carte réapparaît :
 * l'annulation semble alors nécessiter deux clics.
 */
export function scheduleChallengesReconcile(queryClient: QueryClient): void {
  setTimeout(() => {
    void queryClient.invalidateQueries({ queryKey: queryKeys.challenges.mine() });
  }, RECONCILE_DELAY_MS);
}
