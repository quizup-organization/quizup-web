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

  cancel: (ticketId: string): Promise<IdResponse> =>
    api.delete<IdResponse>(ENDPOINTS.matchmaking.ticket(ticketId)),
};
