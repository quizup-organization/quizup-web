import { useQuery } from "@tanstack/react-query";
import { queryKeys } from "@/lib/query-keys";
import { gamesService } from "../lib/games";
import { lobbiesService } from "../lib/lobbies";

/**
 * Partie en attente/en cours du joueur (bannière de reprise) — `null` si aucune.
 * Pas de polling : lecture au montage + refetch au retour de focus ; les transitions de
 * la partie ouverte (création, fin) arrivent par le flux STOMP et les mutations locales.
 */
export function useCurrentGame() {
  return useQuery({
    queryKey: queryKeys.games.current(),
    queryFn: () => gamesService.current(),
  });
}

/** Salles ouvertes du joueur (défi envoyé en attente, lien partagé). */
export function useMyOpenLobbies() {
  return useQuery({
    queryKey: queryKeys.lobbies.mine(),
    queryFn: () => lobbiesService.mine(),
    refetchInterval: 15_000,
  });
}
