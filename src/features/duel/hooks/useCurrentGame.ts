import { useQuery } from "@tanstack/react-query";
import { queryKeys } from "@/lib/query-keys";
import { gamesService } from "../lib/games";
import { lobbiesService } from "../lib/lobbies";

/**
 * Partie en attente/en cours du joueur (bannière de reprise) — `null` si aucune.
 * Rafraîchi périodiquement : la partie peut naître ou se terminer dans un autre onglet.
 */
export function useCurrentGame() {
  return useQuery({
    queryKey: queryKeys.games.current(),
    queryFn: () => gamesService.current(),
    refetchInterval: 15_000,
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
