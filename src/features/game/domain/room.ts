import type { RoomNotification } from "@/shared/types/notifications";
import type { TopicRef } from "@/features/topics/domain/topic";
import type { UserRef } from "@/features/player/domain/profile";

/** Statut serveur d'une salle (enum backend `RoomStatus`, réduit au cycle de vie). */
export type RoomStatus = "CREATED" | "CLOSED" | "FAILED";

/** Phase de la salle (contrat BFF `RoomPhase`). */
export type RoomPhase =
  | "WAITING_PARTICIPANT"
  | "WAITING_PRESENCE"
  | "READY"
  | "COMPLETED"
  | "CLOSED"
  | "FAILED";

/**
 * Issue terminale d'une salle, foldée des notifications. Le statut serveur ne porte que le
 * cycle de vie (« ouvert / fermé / en erreur ») ; l'issue exacte vit ici.
 */
export type RoomOutcome = "COMPLETED" | "CANCELLED" | "EXPIRED" | "FAILED";

/** Vue d'une salle (`RoomView`). Le partage se fait via `/join/{roomId}`. */
export interface RoomView {
  roomId: string;
  topic: TopicRef;
  status: RoomStatus;
  phase: RoomPhase;
  opponent: UserRef | null;
  initiatorPresent: boolean;
  participantPresent: boolean;
  /** Fin du compte à rebours de lancement (les deux joueurs présents). */
  readyDeadlineAt: string | null;
  gameId: string | null;
  createdAt: string;
  expiresAt: string;
  updatedAt: string;
}

/**
 * Read model client d'une salle — reconstruit exclusivement par fold des notifications
 * (historique REST + push WebSocket).
 */
export interface Room {
  roomId: string;
  topicId: string | null;
  initiatorId: string | null;
  opponentId: string | null;
  participantId: string | null;
  status: RoomStatus;
  outcome: RoomOutcome | null;
  gameId: string | null;
  expiresAt: string | null;
  initiatorPresent: boolean;
  participantPresent: boolean;
  readyDeadlineAt: string | null;
}

export function emptyRoom(roomId: string): Room {
  return {
    roomId,
    topicId: null,
    initiatorId: null,
    opponentId: null,
    participantId: null,
    status: "CREATED",
    outcome: null,
    gameId: null,
    expiresAt: null,
    initiatorPresent: false,
    participantPresent: false,
    readyDeadlineAt: null,
  };
}

/**
 * Libellé d'état d'une salle d'attente : le compte à rebours prime, puis la présence complète,
 * puis l'attente nommée de l'adversaire.
 */
export function waitingStatusLabel({
  readyDeadlineAt,
  playerPresent,
  opponentPresent,
  opponentLabel,
}: {
  readyDeadlineAt: string | null;
  playerPresent: boolean;
  opponentPresent: boolean;
  opponentLabel: string | null;
}): string {
  if (readyDeadlineAt) return "La partie démarre…";
  if (playerPresent && opponentPresent) return "Tout le monde est prêt…";
  if (opponentLabel) return `En attente de ${opponentLabel}…`;
  return "En attente d'un adversaire…";
}

/** Fold idempotent : rejouer une notification (même séquence) ne change pas l'état final. */
export function applyRoomNotification(
  room: Room,
  notification: RoomNotification,
): Room {
  switch (notification.type) {
    case "ROOM_CREATED":
      return {
        ...room,
        topicId: notification.topicId,
        initiatorId: notification.initiatorId,
        opponentId: notification.opponentId,
        expiresAt: notification.expiresAt,
        status: "CREATED",
        outcome: null,
      };
    case "ROOM_ENTERED": {
      const isInitiator = notification.playerId === room.initiatorId;
      const participantId =
        !isInitiator && room.participantId === null
          ? notification.playerId
          : room.participantId;
      return {
        ...room,
        participantId,
        initiatorPresent: room.initiatorPresent || isInitiator,
        participantPresent:
          room.participantPresent ||
          (!isInitiator && notification.playerId === participantId),
      };
    }
    case "ROOM_LEFT": {
      const isInitiator = notification.playerId === room.initiatorId;
      const isParticipant = notification.playerId === room.participantId;
      if (!isInitiator && !isParticipant) return room;
      // Sortie non destructive : seule la présence s'éteint, la salle reste ouverte.
      return {
        ...room,
        initiatorPresent: isInitiator ? false : room.initiatorPresent,
        participantPresent: isParticipant ? false : room.participantPresent,
      };
    }
    case "ROOM_ALL_PRESENT":
      return { ...room, readyDeadlineAt: notification.readyDeadlineAt };
    case "ROOM_COMPLETED":
      return {
        ...room,
        status: "CLOSED",
        outcome: "COMPLETED",
        gameId: notification.gameId,
      };
    case "ROOM_CANCELLED":
      return { ...room, status: "CLOSED", outcome: "CANCELLED" };
    case "ROOM_EXPIRED":
      return { ...room, status: "CLOSED", outcome: "EXPIRED" };
    case "ROOM_FAILED":
      return { ...room, status: "FAILED", outcome: "FAILED" };

    default: {
      // Exhaustivité : ajouter un type non géré casse la compilation.
      const unreachable: never = notification;
      void unreachable;
      return room;
    }
  }
}
