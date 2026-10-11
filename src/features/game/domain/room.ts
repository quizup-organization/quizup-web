import type { TFunction } from "i18next";
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
  | "FETCHING_PLAYED_QUESTIONS"
  | "FETCHING_QUESTIONS"
  | "CREATING_GAME"
  | "GAME_CREATED"
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
  /** Vrai si le viewer est l'initiateur (seul habilité à annuler la salle). */
  canCancel: boolean;
  opponent: UserRef | null;
  initiatorPresent: boolean;
  participantPresent: boolean;
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
  };
}

/** Étapes de préparation affichées par le stepper (ordre du flux serveur). */
export const PREPARATION_STEPS = [
  {
    id: "players",
    labelKey: "game.room.steps.players.label",
    descriptionKey: "game.room.steps.players.description",
  },
  {
    id: "profiles",
    labelKey: "game.room.steps.profiles.label",
    descriptionKey: "game.room.steps.profiles.description",
  },
  {
    id: "questions",
    labelKey: "game.room.steps.questions.label",
    descriptionKey: "game.room.steps.questions.description",
  },
  {
    id: "launch",
    labelKey: "game.room.steps.launch.label",
    descriptionKey: "game.room.steps.launch.description",
  },
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
    case "FETCHING_PLAYED_QUESTIONS":
    case "FETCHING_QUESTIONS":
      return 2;
    case "CREATING_GAME":
    case "GAME_CREATED":
      return 3;
    case "COMPLETED":
      return PREPARATION_STEPS.length;
    default:
      return 0;
  }
}

/** Préparation terminée (lancement en cours ou partie créée) : wrapper du stepper en vert. */
export function preparationComplete(status: RoomStatus): boolean {
  return status === "CREATING_GAME" || status === "GAME_CREATED" || status === "COMPLETED";
}

/**
 * Libellé d'état d'une salle d'attente : présence complète, puis attente nommée de
 * l'adversaire. Affiché dans le pill, au-dessus du stepper d'étapes.
 */
export function waitingStatusLabel(
  {
    playerPresent,
    opponentPresent,
    opponentLabel,
  }: {
    playerPresent: boolean;
    opponentPresent: boolean;
    opponentLabel: string | null;
  },
  t: TFunction,
): string {
  if (playerPresent && opponentPresent) return t("game.room.status.ready");
  if (opponentLabel)
    return t("game.room.status.waitingFor", { name: opponentLabel });
  return t("game.room.status.waitingOpponent");
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
      };
    case "ROOM_PLAYERS_LOADED":
      return { ...room, status: "FETCHING_PLAYED_QUESTIONS" };
    case "ROOM_PLAYED_QUESTIONS_LOADED":
      return { ...room, status: "FETCHING_QUESTIONS" };
    case "ROOM_QUESTIONS_LOADED":
      return {
        ...room,
        status: "CREATING_GAME",
      };
    case "ROOM_GAME_CREATED":
      return {
        ...room,
        status: "GAME_CREATED",
        gameId: notification.gameId,
      };
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
