import { api } from "@/lib/api";
import { ENDPOINTS } from "@/lib/endpoints";
import type { EventEnvelopeResponse, RoomNotification } from "@/shared/types/notifications";
import type { IdResponse } from "@/shared/types/api";
import type { RoomView } from "../domain/room";

/** Salle (salle d'attente) : création, consultation, apparition, sortie, annulation. */
export const roomsService = {
  /** Crée une salle partagée (lien) ; le défi nominatif passe par `challengesService`. */
  create: (topicId: string): Promise<IdResponse> =>
    api.post<IdResponse>(ENDPOINTS.rooms.create, { topicId }),

  /** Salles ouvertes du joueur (défi accepté, lien partagé). */
  mine: (): Promise<RoomView[]> =>
    api.get<RoomView[]>(ENDPOINTS.rooms.mine),

  /**
   * Apparition dans la salle (idempotent) : présence et, pour le second humain, enregistrement
   * comme participant. Pour un défi nominatif, seul l'invité y est autorisé.
   */
  join: (roomId: string): Promise<void> =>
    api.post<void>(ENDPOINTS.rooms.join(roomId)),

  leave: (roomId: string): Promise<void> =>
    api.post<void>(ENDPOINTS.rooms.leave(roomId)),

  cancel: (roomId: string): Promise<void> =>
    api.post<void>(ENDPOINTS.rooms.cancel(roomId)),

  /** Historique des notifications (même contrat que le push WebSocket). */
  getNotifications: (
    roomId: string,
  ): Promise<EventEnvelopeResponse<RoomNotification>[]> =>
    api.get<EventEnvelopeResponse<RoomNotification>[]>(
      ENDPOINTS.rooms.notifications(roomId),
    ),
};
