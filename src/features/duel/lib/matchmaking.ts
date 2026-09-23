import { api } from "@/lib/api";
import { ENDPOINTS } from "@/lib/endpoints";
import type { IdResponse } from "@/shared/types/search";

/**
 * File d'attente de matchmaking. L'état du ticket (= lobby) est suivi via le read model
 * `useLobby` (historique REST de notifications + push STOMP), plus via `getTicket`.
 */
export const matchmakingService = {
  enqueue: (topicId: string): Promise<IdResponse> =>
    api.post<IdResponse>(ENDPOINTS.matchmaking.queue, { topicId }),

  /** Annulation de la recherche : transition d'état (lobby annulé) → `POST /{id}/cancel`. */
  cancel: (ticketId: string): Promise<IdResponse> =>
    api.post<IdResponse>(ENDPOINTS.matchmaking.cancel(ticketId)),
};
