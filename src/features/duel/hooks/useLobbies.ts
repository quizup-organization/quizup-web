import { useEffect, useRef } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { queryKeys } from "@/lib/query-keys";
import { useGoBack } from "@/shared/hooks/useGoBack";
import type { LobbyView } from "../domain/lobby";
import { challengesService } from "../lib/challenges";
import { lobbiesService } from "../lib/lobbies";

/** Paramètres de création : `opponentId` renseigné = défi nominatif. */
export interface CreateLobbyParams {
  topicId: string;
  opponentId?: string;
}

/**
 * Crée un **défi nominatif** (intention asynchrone : toast + suivi par la bannière d'accueil)
 * ou un **salon partagé** (salle directe `/lobbies/{id}`).
 */
export function useCreateLobby() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ topicId, opponentId }: CreateLobbyParams) => {
      if (opponentId) {
        const created = await challengesService.create(topicId, opponentId);
        return { kind: "challenge" as const, id: created.id };
      }
      const created = await lobbiesService.create(topicId);
      return { kind: "lobby" as const, id: created.id };
    },
    onSuccess: (created) => {
      if (created.kind === "lobby") {
        // La nouvelle salle doit apparaître dans la section « Tes défis en attente » de
        // l'accueil sans attendre le staleTime global (5 min) ni un rechargement.
        void queryClient.invalidateQueries({ queryKey: queryKeys.lobbies.mine() });
        navigate(`/lobbies/${created.id}`);
        return;
      }
      // Défi asynchrone : on reste sur la page, la section d'accueil suit l'état.
      void queryClient.invalidateQueries({ queryKey: queryKeys.challenges.mine() });
      toast.success("Défi envoyé");
    },
  });
}

/**
 * Quitte / annule le salon : retour natif (pas de redirection artificielle). L'annulation
 * retire immédiatement la salle de la liste d'accueil (« Défi en attente ») ; une simple
 * sortie (« Retour ») la laisse ouverte, la carte reste.
 */
export function useLeaveLobby(lobbyId: string, cancel = false) {
  const goBack = useGoBack();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () =>
      cancel ? lobbiesService.cancel(lobbyId) : lobbiesService.leave(lobbyId),
    onSuccess: () => {
      if (cancel) {
        queryClient.setQueryData<LobbyView[]>(
          queryKeys.lobbies.mine(),
          (current) =>
            current?.filter((lobby) => lobby.lobbyId !== lobbyId),
        );
        void queryClient.invalidateQueries({
          queryKey: queryKeys.lobbies.mine(),
        });
      }
      goBack();
    },
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
