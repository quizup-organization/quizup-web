import { api } from "@/lib/api";
import { ENDPOINTS } from "@/lib/endpoints";
import type { EventEnvelopeResponse, LobbyNotification } from "@/shared/types/notifications";
import type { IdResponse } from "@/shared/types/api";
import type { LobbyView } from "../domain/lobby";

/** Salon privé (salle d'attente) : création, consultation, join, sortie, annulation, refus. */
export const lobbiesService = {
  /** Crée un salon ; `opponentId` renseigné = défi nominatif (seul l'invité peut rejoindre). */
  create: (topicId: string, opponentId?: string): Promise<IdResponse> =>
    api.post<IdResponse>(ENDPOINTS.lobbies.create, {
      topicId,
      ...(opponentId ? { opponentId } : {}),
    }),

  get: (lobbyId: string): Promise<LobbyView> =>
    api.get<LobbyView>(ENDPOINTS.lobbies.detail(lobbyId)),

  /** Salles ouvertes du joueur (défi en attente, lien partagé). */
  mine: (): Promise<LobbyView[]> =>
    api.get<LobbyView[]>(ENDPOINTS.lobbies.mine),

  /** Rejoint le salon (idempotent). Pour un défi nominatif, seul l'invité y est autorisé. */
  join: (lobbyId: string): Promise<void> =>
    api.post<void>(ENDPOINTS.lobbies.join(lobbyId)),

  /** Entrée effective dans la salle (présence temps réel, idempotent). */
  enter: (lobbyId: string): Promise<void> =>
    api.post<void>(ENDPOINTS.lobbies.enter(lobbyId)),

  leave: (lobbyId: string): Promise<void> =>
    api.post<void>(ENDPOINTS.lobbies.leave(lobbyId)),

  cancel: (lobbyId: string): Promise<void> =>
    api.post<void>(ENDPOINTS.lobbies.cancel(lobbyId)),

  /** Refuse un défi nominatif (réservé à l'invité). */
  decline: (lobbyId: string): Promise<void> =>
    api.post<void>(ENDPOINTS.lobbies.decline(lobbyId)),

  /** Historique des notifications (même contrat que le push WebSocket). */
  getNotifications: (
    lobbyId: string,
  ): Promise<EventEnvelopeResponse<LobbyNotification>[]> =>
    api.get<EventEnvelopeResponse<LobbyNotification>[]>(
      ENDPOINTS.lobbies.notifications(lobbyId),
    ),
};
