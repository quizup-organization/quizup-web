import type { RoomNotification } from "@/shared/types/notifications";
import type { TopicRef } from "@/features/topics/domain/topic";
import type { UserRef } from "@/features/player/domain/profile";

/**
 * Statut serveur d'une salle (enum backend `RoomStatus`) : cycle de vie + avancement de la
 * préparation de la partie.
 */
export type RoomStatus =
  | "WAITING_PLAYERS"
  | "FETCHING_PLAYERS"
  | "FETCHING_QUESTIONS"
  | "CREATING_GAME"
  | "COMPLETED"
  | "CANCELLED"
  | "EXPIRED"
  | "FAILED";

/** Vue d'une salle (`RoomView`). Le partage se fait via `/join/{roomId}`. */
export interface RoomView {
  roomId: string;
  topic: TopicRef;
  status: RoomStatus;
  vsBot: boolean;
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
  vsBot: boolean;
  status: RoomStatus;
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
    vsBot: false,
    status: "WAITING_PLAYERS",
    gameId: null,
    expiresAt: null,
    initiatorPresent: false,
    participantPresent: false,
    readyDeadlineAt: null,
  };
}

/** Étapes de préparation affichées par le stepper (ordre du flux serveur). */
export const PREPARATION_STEPS = [
  { id: "players", label: "Joueurs", description: "Présence des deux joueurs" },
  { id: "profiles", label: "Profils", description: "Récupération des infos joueurs" },
  { id: "questions", label: "Questions", description: "Tirage des questions" },
  { id: "launch", label: "Lancement", description: "Création de la partie" },
] as const;

/**
 * Index de l'étape en cours pour le stepper (`PREPARATION_STEPS.length` = préparation
 * terminée, la salle redirige alors vers l'arène).
 */
export function preparationStep(status: RoomStatus): number {
  switch (status) {
    case "WAITING_PLAYERS":
      return 0;
    case "FETCHING_PLAYERS":
      return 1;
    case "FETCHING_QUESTIONS":
      return 2;
    case "CREATING_GAME":
      return 3;
    case "COMPLETED":
      return PREPARATION_STEPS.length;
    default:
      return 0;
  }
}

/**
 * Libellé d'état d'une salle d'attente : le compte à rebours prime, puis la présence complète,
 * puis l'attente nommée de l'adversaire. Affiché dans le pill, au-dessus du stepper d'étapes.
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
        vsBot: notification.vsBot,
        expiresAt: notification.expiresAt,
        status: "WAITING_PLAYERS",
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
      return {
        ...room,
        status: "FETCHING_PLAYERS",
        readyDeadlineAt: notification.readyDeadlineAt,
      };
    case "ROOM_PLAYERS_LOADED":
      return { ...room, status: "FETCHING_QUESTIONS" };
    case "ROOM_QUESTIONS_LOADED":
      return { ...room, status: "CREATING_GAME" };
    case "ROOM_COMPLETED":
      return {
        ...room,
        status: "COMPLETED",
        gameId: notification.gameId,
      };
    case "ROOM_CANCELLED":
      return { ...room, status: "CANCELLED" };
    case "ROOM_EXPIRED":
      return { ...room, status: "EXPIRED" };
    case "ROOM_FAILED":
      return { ...room, status: "FAILED" };

    default: {
      // Exhaustivité : ajouter un type non géré casse la compilation.
      const unreachable: never = notification;
      void unreachable;
      return room;
    }
  }
}
