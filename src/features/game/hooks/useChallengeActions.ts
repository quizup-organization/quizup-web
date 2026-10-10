import { useMutation, useQueryClient, type QueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/lib/query-keys";
import { challengesService } from "../lib/challenges";

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

/**
 * Accepter un défi nominatif (invité) : accepte, puis attend la salle créée par la saga et
 * retourne son id (`null` si elle n'arrive pas). Ne navigue pas — chaque surface décide de la
 * suite (modale live, carte d'accueil).
 */
export function useAcceptChallenge() {
  const queryClient = useQueryClient();
  const mutation = useMutation({
    mutationFn: (challengeId: string) => challengesService.accept(challengeId),
    onSettled: () => reconcileGameViews(queryClient),
  });

  const accept = async (challengeId: string): Promise<string | null> => {
    await mutation.mutateAsync(challengeId);
    return waitForRoom(challengeId);
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
