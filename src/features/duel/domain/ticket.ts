import type { TicketNotification } from "@/shared/types/notifications";

/** Statut d'un ticket de matchmaking (langage produit, pas le statut interne du lobby). */
export type TicketStatus = "SEARCHING" | "MATCHED" | "CANCELLED";

/** Vue d'un ticket (`MatchmakingTicketView`). */
export interface MatchmakingTicket {
  ticketId: string;
  topicId: string;
  status: TicketStatus;
  createdAt: string;
  updatedAt: string;
  gameId: string | null;
  opponentId: string | null;
  vsBot: boolean;
}

/**
 * Read model client d'un ticket — reconstruit exclusivement par fold des notifications
 * (historique REST + push WebSocket), jamais par lecture de la projection.
 */
export interface Ticket {
  ticketId: string;
  topicId: string | null;
  status: TicketStatus;
  gameId: string | null;
  initiatorId: string | null;
  challengerId: string | null;
  vsBot: boolean;
}

export function emptyTicket(ticketId: string): Ticket {
  return {
    ticketId,
    topicId: null,
    status: "SEARCHING",
    gameId: null,
    initiatorId: null,
    challengerId: null,
    vsBot: false,
  };
}

/** Fold idempotent : rejouer une notification (même séquence) ne change pas l'état final. */
export function applyTicketNotification(
  ticket: Ticket,
  notification: TicketNotification,
): Ticket {
  switch (notification.type) {
    case "SEARCHING":
      return {
        ...ticket,
        topicId: notification.topicId,
        status: "SEARCHING",
      };
    case "MATCHED":
      return {
        ...ticket,
        status: "MATCHED",
        gameId: notification.gameId,
        initiatorId: notification.initiatorId,
        challengerId: notification.challengerId,
        vsBot: notification.vsBot,
      };
    case "CANCELLED":
      return { ...ticket, status: "CANCELLED" };

    default: {
      // Exhaustivité : ajouter un type non géré casse la compilation.
      const unreachable: never = notification;
      void unreachable;
      return ticket;
    }
  }
}
