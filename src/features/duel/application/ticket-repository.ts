import { matchmakingService } from "../lib/matchmaking";
import type { TicketNotification } from "@/shared/types/notifications";
import { applyTicketNotification, emptyTicket, type Ticket } from "../domain/ticket";
import { NotificationStream } from "./notification-stream";

/** Stream d'un ticket de matchmaking : historique REST + push STOMP. */
export function createTicketStream(
  ticketId: string,
): NotificationStream<TicketNotification, Ticket> {
  return new NotificationStream<TicketNotification, Ticket>({
    service: "matchmaking",
    aggregateId: ticketId,
    topic: `/topic/matchmaking/tickets/${ticketId}`,
    initial: emptyTicket,
    load: (id) => matchmakingService.getNotifications(id),
    apply: applyTicketNotification,
  });
}
