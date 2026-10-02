import { useEffect, useRef } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { queryKeys } from "@/lib/query-keys";
import { lobbiesService } from "../lib/lobbies";

/** Salons ouverts (créés, non rejoints) du joueur courant — filet de reprise. */
export function useMyLobbies() {
  return useQuery({
    queryKey: queryKeys.lobbies.mine(),
    queryFn: () => lobbiesService.mine(),
    refetchInterval: 15_000,
  });
}

/** Crée un salon privé puis ouvre sa salle d'attente. */
export function useCreateLobby() {
  const navigate = useNavigate();
  return useMutation({
    mutationFn: (topicId: string) => lobbiesService.create(topicId),
    onSuccess: (response) => navigate(`/lobbies/${response.id}`),
  });
}

/** Quitte / annule le salon. */
export function useLeaveLobby(lobbyId: string, cancel = false) {
  const navigate = useNavigate();
  return useMutation({
    mutationFn: () =>
      cancel ? lobbiesService.cancel(lobbyId) : lobbiesService.leave(lobbyId),
    onSuccess: () => navigate("/lobbies"),
  });
}

/**
 * Rejoint le salon au montage (idempotent). **Aucun `leave` au démontage** : quitter l'écran
 * ne doit pas fermer le salon (compatible React StrictMode, qui double les effets en dev).
 * La sortie est explicite via le bouton « Quitter ».
 */
export function useLobbyJoin(lobbyId: string): void {
  const joined = useRef(false);
  useEffect(() => {
    if (!lobbyId || joined.current) return;
    joined.current = true;
    void lobbiesService.join(lobbyId).catch(() => undefined);
  }, [lobbyId]);
}
