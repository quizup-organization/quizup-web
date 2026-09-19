import { api } from "@/lib/api";
import { ENDPOINTS } from "@/lib/endpoints";
import type {
  LobbyNotification,
  NotificationEnvelope,
} from "@/shared/types/notifications";

/**
 * Historique des notifications d'un lobby (même contrat que le push WebSocket) : sert à
 * reconstruire l'état côté client (fold) puis à l'entretenir par abonnement STOMP.
 */
export const lobbiesService = {
  getNotifications: (
    lobbyId: string,
  ): Promise<NotificationEnvelope<LobbyNotification>[]> =>
    api.get<NotificationEnvelope<LobbyNotification>[]>(
      ENDPOINTS.lobbies.notifications(lobbyId),
    ),
};
