import type { LobbyNotification } from "@/shared/types/notifications";
import type { TopicRef } from "@/features/topics/domain/topic";
import type { UserRef } from "@/features/player/domain/profile";

/** Statut d'un salon privé (enum backend `LobbyStatus`). */
export type LobbyStatus = "OPEN" | "CANCELLED" | "EXPIRED" | "FAILED";

/** Vue d'un salon privé (`LobbyView`). Le partage se fait via `/join/{lobbyId}`. */
export interface LobbyView {
  lobbyId: string;
  topic: TopicRef;
  status: LobbyStatus;
  opponent: UserRef | null;
  gameId: string | null;
  createdAt: string;
  expiresAt: string;
  updatedAt: string;
}

/**
 * Read model client d'un salon — reconstruit exclusivement par fold des notifications
 * (historique REST + push WebSocket).
 */
export interface Lobby {
  lobbyId: string;
  topicId: string | null;
  initiatorId: string | null;
  participantId: string | null;
  status: LobbyStatus;
  gameId: string | null;
  expiresAt: string | null;
}

export function emptyLobby(lobbyId: string): Lobby {
  return {
    lobbyId,
    topicId: null,
    initiatorId: null,
    participantId: null,
    status: "OPEN",
    gameId: null,
    expiresAt: null,
  };
}

/** Fold idempotent : rejouer une notification (même séquence) ne change pas l'état final. */
export function applyLobbyNotification(
  lobby: Lobby,
  notification: LobbyNotification,
): Lobby {
  switch (notification.type) {
    case "LOBBY_CREATED":
      return {
        ...lobby,
        topicId: notification.topicId,
        initiatorId: notification.initiatorId,
        expiresAt: notification.expiresAt,
        status: "OPEN",
      };
    case "LOBBY_JOINED":
      return { ...lobby, participantId: notification.participantId };
    case "LOBBY_COMPLETED":
      return { ...lobby, gameId: notification.gameId };
    case "LOBBY_CANCELLED":
      return { ...lobby, status: "CANCELLED" };
    case "LOBBY_EXPIRED":
      return { ...lobby, status: "EXPIRED" };
    case "LOBBY_FAILED":
      return { ...lobby, status: "FAILED" };

    default: {
      // Exhaustivité : ajouter un type non géré casse la compilation.
      const unreachable: never = notification;
      void unreachable;
      return lobby;
    }
  }
}
