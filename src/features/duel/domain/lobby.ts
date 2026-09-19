import type { LobbyNotification } from "@/shared/types/notifications";

export type LobbyStatus =
  | "OPEN"
  | "JOINED"
  | "COMPLETED"
  | "CANCELLED"
  | "EXPIRED";

/**
 * Read model client d'un lobby — reconstruit exclusivement par fold des notifications
 * (historique REST + push WebSocket), jamais par lecture de la projection.
 */
export interface Lobby {
  lobbyId: string;
  topicId: string | null;
  initiatorId: string | null;
  challengerId: string | null;
  status: LobbyStatus;
  gameId: string | null;
  vsBot: boolean;
}

export function emptyLobby(lobbyId: string): Lobby {
  return {
    lobbyId,
    topicId: null,
    initiatorId: null,
    challengerId: null,
    status: "OPEN",
    gameId: null,
    vsBot: false,
  };
}

/** Fold idempotent : rejouer une notification (même séquence) ne change pas l'état final. */
export function applyLobbyNotification(
  lobby: Lobby,
  notification: LobbyNotification,
): Lobby {
  switch (notification.type) {
    case "OPENED":
      return {
        ...lobby,
        topicId: notification.topicId,
        initiatorId: notification.initiatorId,
        status: "OPEN",
      };
    case "JOINED":
      return {
        ...lobby,
        challengerId: notification.challengerId,
        vsBot: notification.vsBot,
        status: "JOINED",
      };
    case "COMPLETED":
      return {
        ...lobby,
        status: "COMPLETED",
        gameId: notification.gameId,
        vsBot: notification.vsBot,
      };
    case "CANCELLED":
      return { ...lobby, status: "CANCELLED" };
    case "EXPIRED":
      return { ...lobby, status: "EXPIRED" };

    default: {
      // Exhaustivité : ajouter un type non géré casse la compilation.
      const unreachable: never = notification;
      void unreachable;
      return lobby;
    }
  }
}
