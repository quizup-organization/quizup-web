import type { QueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/lib/query-keys";
import {
  beginIntent,
  endIntent,
  isCurrentIntent,
} from "@/shared/utils/latest-intent";
import { reconcileUntil } from "@/shared/utils/optimistic-reconcile";
import type { ChallengeView } from "../domain/challenge";
import { challengesService } from "./challenges";

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
 * Réconcilie la liste des défis **jusqu'à convergence** : la projection peut encore exposer le
 * défi annulé ~2 s, mais on n'invalide qu'une fois qu'il a réellement disparu — une relecture
 * périmée ferait réapparaître la carte (l'annulation semblerait nécessiter deux clics). Aucune
 * valeur périmée n'est écrite dans le cache ; en secours au timeout, invalidation simple.
 * Une nouvelle action sur le **même défi** remplace la boucle en cours (clics multiples).
 */
export async function reconcileChallenges(
  queryClient: QueryClient,
  challengeId: string,
): Promise<void> {
  const intentKey = `challenge:${challengeId}`;
  const generation = beginIntent(intentKey);
  await reconcileUntil<ChallengeView[]>({
    read: () => challengesService.mine(),
    matches: (challenges) =>
      !challenges.some((challenge) => challenge.challengeId === challengeId),
    isCurrent: () => isCurrentIntent(intentKey, generation),
    onConverged: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.challenges.mine() });
    },
    onTimeout: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.challenges.mine() });
    },
  });
  endIntent(intentKey, generation);
}
