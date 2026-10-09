import { useQuery } from "@tanstack/react-query";
import { queryKeys } from "@/lib/query-keys";
import { gamesService } from "../lib/games";
import { lobbiesService } from "../lib/lobbies";

/**
 * Partie en cours du joueur (bannière de reprise) — `null` si aucune. Une seule partie (la
 * dernière lancée) est renvoyée par le BFF.
 *
 * Le bandeau étant désormais global (monté sur tous les écrans), on **sonde** tant qu'une partie
 * est en cours : hors arène il n'y a pas de flux STOMP, la partie peut se terminer ailleurs
 * (forfait adverse…) et le bandeau doit disparaître de lui-même. Le polling s'arrête dès qu'il
 * n'y a plus de partie.
 */
export function useCurrentGame() {
  return useQuery({
    queryKey: queryKeys.games.current(),
    queryFn: () => gamesService.current(),
    refetchInterval: (query) => (query.state.data ? 15_000 : false),
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
