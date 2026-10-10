import type { MatchmakingNotification } from "@/shared/types/notifications";

/** Statut serveur d'un ticket (enum backend `MatchmakingStatus`, réduit au cycle de vie). */
export type MatchmakingServerStatus = "SEARCHING" | "CLOSED" | "FAILED";

/**
 * État client d'une recherche, foldé des notifications : `MATCHED`/`CANCELLED` sont des
 * issues terminales qui n'existent plus comme statut serveur.
 */
export type MatchmakingStatus = "SEARCHING" | "MATCHED" | "CANCELLED" | "FAILED";

/** Vue d'un ticket (`MatchmakingTicketView`). */
export interface MatchmakingTicket {
  ticketId: string;
  topicId: string;
  status: MatchmakingServerStatus;
  gameId: string | null;
  opponentId: string | null;
  vsBot: boolean;
  createdAt: string;
  updatedAt: string;
}

/**
 * Read model client d'une recherche — reconstruit par fold des notifications
 * (historique REST + push WebSocket).
 */
export interface Matchmaking {
  ticketId: string;
  topicId: string | null;
  status: MatchmakingStatus;
  gameId: string | null;
  opponentId: string | null;
  vsBot: boolean;
}

export function emptyMatchmaking(ticketId: string): Matchmaking {
  return {
    ticketId,
    topicId: null,
    status: "SEARCHING",
    gameId: null,
    opponentId: null,
    vsBot: false,
  };
}

/** Fold idempotent : rejouer une notification (même séquence) ne change pas l'état final. */
export function applyMatchmakingNotification(
  ticket: Matchmaking,
  notification: MatchmakingNotification,
): Matchmaking {
  switch (notification.type) {
    case "SEARCHING":
      return { ...ticket, topicId: notification.topicId, status: "SEARCHING" };
    case "MATCHED":
      return {
        ...ticket,
        status: "MATCHED",
        gameId: notification.gameId,
        opponentId: notification.opponentId,
        vsBot: notification.vsBot,
      };
    case "CANCELLED":
      return { ...ticket, status: "CANCELLED" };
    case "FAILED":
      return { ...ticket, status: "FAILED" };

    default: {
      const unreachable: never = notification;
      void unreachable;
      return ticket;
    }
  }
}
