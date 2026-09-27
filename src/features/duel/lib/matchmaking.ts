import { api } from "@/lib/api";
import { ENDPOINTS } from "@/lib/endpoints";
import type { EventEnvelopeResponse, TicketNotification } from "@/shared/types/notifications";
import type { MatchmakingTicket } from "../domain/ticket";

/** File d'attente de matchmaking : ticket, annulation, historique de notifications. */
export const matchmakingService = {
  enqueue: (topicId: string): Promise<MatchmakingTicket> =>
    api.post<MatchmakingTicket>(ENDPOINTS.matchmaking.tickets, { topicId }),

  get: (ticketId: string): Promise<MatchmakingTicket> =>
    api.get<MatchmakingTicket>(ENDPOINTS.matchmaking.ticket(ticketId)),

  cancel: (ticketId: string): Promise<void> =>
    api.post<void>(ENDPOINTS.matchmaking.cancel(ticketId)),

  /** Historique des notifications (même contrat que le push WebSocket). */
  getNotifications: (
    ticketId: string,
  ): Promise<EventEnvelopeResponse<TicketNotification>[]> =>
    api.get<EventEnvelopeResponse<TicketNotification>[]>(
      ENDPOINTS.matchmaking.notifications(ticketId),
    ),
};
