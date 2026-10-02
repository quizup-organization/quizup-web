import { api } from "@/lib/api";
import { ENDPOINTS } from "@/lib/endpoints";
import type { EventEnvelopeResponse, LobbyNotification } from "@/shared/types/notifications";
import type { IdResponse } from "@/shared/types/api";
import type { LobbyView } from "../domain/lobby";

/** Salon privé (salle d'attente) : création, consultation, join, sortie, annulation. */
export const lobbiesService = {
  create: (topicId: string): Promise<IdResponse> =>
    api.post<IdResponse>(ENDPOINTS.lobbies.create, { topicId }),

  get: (lobbyId: string): Promise<LobbyView> =>
    api.get<LobbyView>(ENDPOINTS.lobbies.detail(lobbyId)),

  mine: (): Promise<LobbyView[]> => api.get<LobbyView[]>(ENDPOINTS.lobbies.mine),

  /** Rejoint le salon (idempotent). */
  join: (lobbyId: string): Promise<void> =>
    api.post<void>(ENDPOINTS.lobbies.join(lobbyId)),

  leave: (lobbyId: string): Promise<void> =>
    api.post<void>(ENDPOINTS.lobbies.leave(lobbyId)),

  cancel: (lobbyId: string): Promise<void> =>
    api.post<void>(ENDPOINTS.lobbies.cancel(lobbyId)),

  /** Historique des notifications (même contrat que le push WebSocket). */
  getNotifications: (
    lobbyId: string,
  ): Promise<EventEnvelopeResponse<LobbyNotification>[]> =>
    api.get<EventEnvelopeResponse<LobbyNotification>[]>(
      ENDPOINTS.lobbies.notifications(lobbyId),
    ),
};
