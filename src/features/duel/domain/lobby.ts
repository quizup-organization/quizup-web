import type { LobbyNotification } from "@/shared/types/notifications";
import type { TopicRef } from "@/features/topics/domain/topic";
import type { UserRef } from "@/features/player/domain/profile";

/** Statut serveur d'un salon privé (enum backend `LobbyStatus`, réduit au cycle de vie). */
export type LobbyStatus = "CREATED" | "CLOSED" | "FAILED";

/**
 * Issue terminale d'un salon, foldée des notifications. Le statut serveur ne porte que le
 * cycle de vie (« ouvert / fermé / en erreur ») ; l'issue exacte vit ici.
 */
export type LobbyOutcome =
  | "COMPLETED"
  | "CANCELLED"
  | "EXPIRED"
  | "DECLINED"
  | "FAILED";

/** Vue d'un salon privé (`LobbyView`). Le partage se fait via `/join/{lobbyId}`. */
export interface LobbyView {
  lobbyId: string;
  topic: TopicRef;
  status: LobbyStatus;
  opponent: UserRef | null;
  /** Défi nominatif adressé à un joueur précis. */
  nominative: boolean;
  /** Le viewer est l'invité et n'a pas encore accepté/refusé. */
  awaitingMe: boolean;
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
  opponentId: string | null;
  participantId: string | null;
  status: LobbyStatus;
  outcome: LobbyOutcome | null;
  gameId: string | null;
  expiresAt: string | null;
}

export function emptyLobby(lobbyId: string): Lobby {
  return {
    lobbyId,
    topicId: null,
    initiatorId: null,
    opponentId: null,
    participantId: null,
    status: "CREATED",
    outcome: null,
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
        opponentId: notification.opponentId,
        expiresAt: notification.expiresAt,
        status: "CREATED",
        outcome: null,
      };
    case "LOBBY_JOINED":
      return { ...lobby, participantId: notification.participantId };
    case "LOBBY_DECLINED":
      return { ...lobby, status: "CLOSED", outcome: "DECLINED" };
    case "LOBBY_COMPLETED":
      return {
        ...lobby,
        status: "CLOSED",
        outcome: "COMPLETED",
        gameId: notification.gameId,
      };
    case "LOBBY_CANCELLED":
      return { ...lobby, status: "CLOSED", outcome: "CANCELLED" };
    case "LOBBY_EXPIRED":
      return { ...lobby, status: "CLOSED", outcome: "EXPIRED" };
    case "LOBBY_FAILED":
      return { ...lobby, status: "FAILED", outcome: "FAILED" };

    default: {
      // Exhaustivité : ajouter un type non géré casse la compilation.
      const unreachable: never = notification;
      void unreachable;
      return lobby;
    }
  }
}
