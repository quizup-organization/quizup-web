import { useEffect, useRef } from "react";
import { useMutation } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { useGoBack } from "@/shared/hooks/useGoBack";
import { lobbiesService } from "../lib/lobbies";

/** Paramètres de création : `opponentId` renseigné = défi nominatif. */
export interface CreateLobbyParams {
  topicId: string;
  opponentId?: string;
}

/** Crée un salon privé (ou un défi nominatif) puis ouvre sa salle d'attente. */
export function useCreateLobby() {
  const navigate = useNavigate();
  return useMutation({
    mutationFn: ({ topicId, opponentId }: CreateLobbyParams) =>
      lobbiesService.create(topicId, opponentId),
    onSuccess: (response) => navigate(`/lobbies/${response.id}`),
  });
}

/** Quitte / annule le salon : retour natif (pas de redirection artificielle). */
export function useLeaveLobby(lobbyId: string, cancel = false) {
  const goBack = useGoBack();
  return useMutation({
    mutationFn: () =>
      cancel ? lobbiesService.cancel(lobbyId) : lobbiesService.leave(lobbyId),
    onSuccess: () => goBack(),
  });
}

/** Refuse un défi nominatif (invité). */
export function useDeclineLobby() {
  return useMutation({
    mutationFn: (lobbyId: string) => lobbiesService.decline(lobbyId),
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
