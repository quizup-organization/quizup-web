import { useEffect, useRef } from "react";
import { useMutation } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { useGoBack } from "@/shared/hooks/useGoBack";
import { challengesService } from "../lib/challenges";
import { lobbiesService } from "../lib/lobbies";

/** Paramètres de création : `opponentId` renseigné = défi nominatif. */
export interface CreateLobbyParams {
  topicId: string;
  opponentId?: string;
}

/**
 * Crée un **défi nominatif** (intention asynchrone, écran de suivi `/challenges/{id}`) ou un
 * **salon partagé** (salle directe `/lobbies/{id}`).
 */
export function useCreateLobby() {
  const navigate = useNavigate();
  return useMutation({
    mutationFn: async ({ topicId, opponentId }: CreateLobbyParams) => {
      if (opponentId) {
        const created = await challengesService.create(topicId, opponentId);
        return { kind: "challenge" as const, id: created.id };
      }
      const created = await lobbiesService.create(topicId);
      return { kind: "lobby" as const, id: created.id };
    },
    onSuccess: (created) =>
      navigate(
        created.kind === "challenge"
          ? `/challenges/${created.id}`
          : `/lobbies/${created.id}`,
      ),
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
 * Entre dans la salle au montage (présence temps réel, idempotent). **Aucun `leave` au
 * démontage** : quitter l'écran ne doit pas fermer la salle (compatible React StrictMode, qui
 * double les effets en dev). La sortie est explicite via le bouton « Quitter ».
 */
export function useLobbyEnter(lobbyId: string): void {
  const entered = useRef(false);
  useEffect(() => {
    if (!lobbyId || entered.current) return;
    entered.current = true;
    void lobbiesService.enter(lobbyId).catch(() => undefined);
  }, [lobbyId]);
}
