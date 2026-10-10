import { useQuery } from "@tanstack/react-query";
import { queryKeys } from "@/lib/query-keys";
import { challengesService } from "../lib/challenges";

/**
 * Défis nominatifs en attente où le joueur est lanceur ou invité (bannière d'accueil).
 * Rafraîchi périodiquement : l'acceptation/le refus arrive par notification dans l'intervalle.
 */
export function useMyChallenges() {
  return useQuery({
    queryKey: queryKeys.challenges.mine(),
    queryFn: () => challengesService.mine(),
    refetchInterval: 15_000,
  });
}
