import { useMutation, useQueryClient, type QueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/lib/query-keys";
import type { ChallengeView } from "../domain/challenge";
import { challengesService } from "../lib/challenges";
import {
  removeChallengeFromCaches,
  scheduleChallengesReconcile,
} from "../lib/challenges-cache";

/** Les sections d'accueil « défis/salons en attente » changent dès qu'un défi est tranché. */
export function reconcileGameViews(queryClient: QueryClient): void {
  void queryClient.invalidateQueries({ queryKey: queryKeys.challenges.mine() });
  void queryClient.invalidateQueries({ queryKey: queryKeys.rooms.mine() });
}

/** Attend la salle créée à l'acceptation (la saga matchmaking la crée juste après la commande). */
async function waitForRoom(challengeId: string): Promise<string | null> {
  for (let attempt = 0; attempt < 12; attempt += 1) {
    const challenge = await challengesService
      .get(challengeId)
      .catch(() => null);
    if (challenge?.roomId) return challenge.roomId;
    if (
      challenge &&
      challenge.status !== "PENDING" &&
      challenge.status !== "ACCEPTED"
    ) {
      return null;
    }
    await new Promise((resolve) => setTimeout(resolve, 400));
  }
  return null;
}

/** Résultat d'une acceptation : salle (ou `null` si la saga tarde), ou défi plus actionnable. */
export type AcceptChallengeResult =
  | { status: "accepted"; roomId: string | null }
  | { status: "gone" };

/**
 * Accepter un défi nominatif (invité) : accepte **après vérification du statut**, puis attend la
 * salle créée par la saga (`roomId`, `null` si elle n'arrive pas). Ne navigue pas — chaque surface
 * décide de la suite (modale live, carte d'accueil).
 */
export function useAcceptChallenge() {
  const queryClient = useQueryClient();
  const mutation = useMutation({
    mutationFn: (challengeId: string) => challengesService.accept(challengeId),
    onSettled: () => reconcileGameViews(queryClient),
  });

  /**
   * Un défi annulé/refusé/expiré entre l'affichage et le clic ne part **jamais** en commande
   * (le backend rejetterait en `400 notPending`) : la surface appelante nettoie l'invitation et
   * affiche un message dédié.
   */
  const accept = async (challengeId: string): Promise<AcceptChallengeResult> => {
    const challenge = await challengesService.get(challengeId).catch(() => null);
    if (!challenge) {
      return { status: "gone" };
    }
    if (challenge.status === "PENDING") {
      await mutation.mutateAsync(challengeId);
    } else if (challenge.status !== "ACCEPTED") {
      // Annulé / refusé / expiré : plus actionnable.
      return { status: "gone" };
    }
    return { status: "accepted", roomId: await waitForRoom(challengeId) };
  };

  return { accept, pending: mutation.isPending };
}

/** Refuser un défi nominatif (invité). */
export function useDeclineChallenge() {
  const queryClient = useQueryClient();
  const mutation = useMutation({
    mutationFn: (challengeId: string) => challengesService.decline(challengeId),
    onSettled: () => reconcileGameViews(queryClient),
  });

  const decline = async (challengeId: string): Promise<void> => {
    await mutation.mutateAsync(challengeId);
  };

  return { decline, pending: mutation.isPending };
}

/**
 * Annule un défi envoyé (lanceur) : retrait **optimiste** de la liste « Tes défis en attente »,
 * restauration en cas d'échec et réconciliation différée avec la projection Axon (elle peut
 * encore exposer le défi ~2 s — sans délai, la carte réapparaît et l'annulation semble
 * nécessiter deux clics).
 */
export function useCancelChallenge() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (challengeId: string) => challengesService.cancel(challengeId),
    onMutate: async (challengeId) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.challenges.mine() });
      const previous = queryClient.getQueryData<ChallengeView[]>(
        queryKeys.challenges.mine(),
      );
      removeChallengeFromCaches(queryClient, challengeId);
      return { previous };
    },
    onError: (_error, _challengeId, context) => {
      if (context?.previous !== undefined) {
        queryClient.setQueryData(
          queryKeys.challenges.mine(),
          context.previous,
        );
      }
    },
    onSettled: () => scheduleChallengesReconcile(queryClient),
  });
}
