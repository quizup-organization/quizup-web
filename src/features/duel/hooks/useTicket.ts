import { useEffect, useMemo, useSyncExternalStore } from "react";
import { createTicketStream } from "../application/ticket-repository";
import { emptyTicket, type Ticket } from "../domain/ticket";

interface UseTicketResult {
  ticket: Ticket;
  isLoading: boolean;
  isError: boolean;
}

/**
 * État d'un ticket de matchmaking, reconstruit par fold des notifications
 * (historique REST + WebSocket). Remplace le polling du ticket.
 */
export function useTicket(ticketId: string): UseTicketResult {
  const stream = useMemo(() => createTicketStream(ticketId), [ticketId]);
  const fallback = useMemo(() => emptyTicket(ticketId), [ticketId]);

  useEffect(() => {
    stream.start();
    return () => stream.stop();
  }, [stream]);

  const ticket =
    useSyncExternalStore(
      stream.subscribe,
      stream.getSnapshot,
      stream.getSnapshot,
    ) ?? fallback;

  return {
    ticket,
    isLoading: !stream.isLoaded() && !stream.hasLoadError(),
    isError: stream.hasLoadError(),
  };
}
