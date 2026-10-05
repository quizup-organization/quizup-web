/**
 * Contrat d'événement partagé back/front (isomorphe).
 *
 * Toutes les notifications temps réel (WebSocket) et leur historique REST sont enveloppées dans
 * un {@link EventEnvelopeResponse} portant les métadonnées d'ordre issues de l'événement Axon :
 * `sequenceNumber` garantit l'ordre et la déduplication du fold client. `eventType` porte le type
 * du contrat web (discriminant), identique à `payload.type`.
 */

export interface EventEnvelopeResponse<T> {
  aggregateId: string;
  sequenceNumber: number;
  timestamp: string;
  eventType: string;
  payload: T;
}

/* ───────────────────────────── Game ───────────────────────────── */

export type GameNotificationType =
  | "GAME_CREATED"
  | "PLAYER_JOINED"
  | "PLAYER_LEFT"
  | "GAME_STARTED"
  | "ROUND_STARTED"
  | "QUESTION_REVEALED"
  | "PLAYER_ANSWERED"
  | "ROUND_CLOSED"
  | "GAME_FORFEITED"
  | "GAME_ENDED"
  | "GAME_CANCELLED"
  | "REMATCH_REQUESTED"
  | "REMATCH_ACCEPTED"
  | "REMATCH_DECLINED"
  | "REMATCH_CANCELLED"
  | "REMATCH_STARTED";

export interface GameCreatedNotification {
  type: "GAME_CREATED";
  gameId: string;
  topicId: string;
  player1Id: string;
  player1Name: string | null;
  player2Id: string | null;
  player2Name: string | null;
  player2Type: string | null;
  botDifficulty: string | null;
  /** Images des questions (dans l'ordre des rounds) : préchargées dès la création de la partie. */
  questionImageUrls: string[];
}

export interface PlayerJoinedNotification {
  type: "PLAYER_JOINED";
  gameId: string;
  playerId: string;
}

export interface PlayerLeftNotification {
  type: "PLAYER_LEFT";
  gameId: string;
  playerId: string;
}

export interface GameStartedNotification {
  type: "GAME_STARTED";
  gameId: string;
  firstRoundAt: string;
}

export interface RoundQuestionTranslation {
  text: string;
  answers: Record<string, string>;
}

export interface RoundStartedNotification {
  type: "ROUND_STARTED";
  gameId: string;
  round: string;
  questionId: string;
  questionText: string;
  imageUrl: string | null;
  difficulty: string | null;
  answers: Record<string, string>;
  /** Contenus localisés (clé = code ISO 639-1 : fr, en). Absent sur les anciennes parties. */
  translations?: Record<string, RoundQuestionTranslation>;
  bonus: boolean;
  shownAt: string;
  revealAt: string;
}

export interface QuestionRevealedNotification {
  type: "QUESTION_REVEALED";
  gameId: string;
  round: string;
  revealedAt: string;
  answerDeadlineAt: string;
}

export interface PlayerAnsweredNotification {
  type: "PLAYER_ANSWERED";
  gameId: string;
  round: string;
  playerId: string;
  choice: string;
  correct: boolean;
  pointsEarned: number;
  answeredAt: string;
  timeMs: number;
}

export interface RoundClosedNotification {
  type: "ROUND_CLOSED";
  gameId: string;
  closedRound: string;
  nextRound: string | null;
  correctAnswer: string | null;
  closedAt: string;
  nextRoundAt: string | null;
}

export interface GameForfeitedNotification {
  type: "GAME_FORFEITED";
  gameId: string;
  forfeiterId: string;
}

export interface GameEndedNotification {
  type: "GAME_ENDED";
  gameId: string;
  winnerId: string | null;
  player1FinalScore: number;
  player2FinalScore: number;
}

export interface GameCancelledNotification {
  type: "GAME_CANCELLED";
  gameId: string;
  reason: string;
}

export interface RematchRequestedNotification {
  type: "REMATCH_REQUESTED";
  gameId: string;
  requesterId: string;
}

export interface RematchAcceptedNotification {
  type: "REMATCH_ACCEPTED";
  gameId: string;
  playerId: string;
}

export interface RematchDeclinedNotification {
  type: "REMATCH_DECLINED";
  gameId: string;
  playerId: string;
}

export interface RematchCancelledNotification {
  type: "REMATCH_CANCELLED";
  gameId: string;
  reason: string;
}

export interface RematchStartedNotification {
  type: "REMATCH_STARTED";
  gameId: string;
  newGameId: string;
}

export type GameNotification =
  | GameCreatedNotification
  | PlayerJoinedNotification
  | PlayerLeftNotification
  | GameStartedNotification
  | RoundStartedNotification
  | QuestionRevealedNotification
  | PlayerAnsweredNotification
  | RoundClosedNotification
  | GameForfeitedNotification
  | GameEndedNotification
  | GameCancelledNotification
  | RematchRequestedNotification
  | RematchAcceptedNotification
  | RematchDeclinedNotification
  | RematchCancelledNotification
  | RematchStartedNotification;

/* ───────────────────────────── Lobby (salon privé) ────────────── */

export type LobbyNotificationType =
  | "LOBBY_CREATED"
  | "LOBBY_JOINED"
  | "LOBBY_DECLINED"
  | "LOBBY_COMPLETED"
  | "LOBBY_CANCELLED"
  | "LOBBY_EXPIRED"
  | "LOBBY_FAILED"
  | "LOBBY_ROOM_ENTERED"
  | "LOBBY_LEFT"
  | "LOBBY_ALL_PRESENT"
  | "LOBBY_MISSED";

export interface LobbyCreatedNotification {
  type: "LOBBY_CREATED";
  lobbyId: string;
  topicId: string;
  initiatorId: string;
  /** Défi nominatif : seul cet invité peut rejoindre. */
  opponentId: string | null;
  expiresAt: string | null;
}

export interface LobbyJoinedNotification {
  type: "LOBBY_JOINED";
  lobbyId: string;
  participantId: string;
}

export interface LobbyDeclinedNotification {
  type: "LOBBY_DECLINED";
  lobbyId: string;
  opponentId: string;
}

export interface LobbyCompletedNotification {
  type: "LOBBY_COMPLETED";
  lobbyId: string;
  gameId: string;
}

export interface LobbyCancelledNotification {
  type: "LOBBY_CANCELLED";
  lobbyId: string;
  reason: string;
}

export interface LobbyExpiredNotification {
  type: "LOBBY_EXPIRED";
  lobbyId: string;
}

export interface LobbyFailedNotification {
  type: "LOBBY_FAILED";
  lobbyId: string;
  reason: string;
}

export interface LobbyRoomEnteredNotification {
  type: "LOBBY_ROOM_ENTERED";
  lobbyId: string;
  playerId: string;
}

export interface LobbyLeftNotification {
  type: "LOBBY_LEFT";
  lobbyId: string;
  playerId: string;
}

export interface LobbyAllPlayersPresentNotification {
  type: "LOBBY_ALL_PRESENT";
  lobbyId: string;
  /** Fin du compte à rebours de lancement (partie créée à cette échéance). */
  readyDeadlineAt: string;
}

export interface LobbyMissedNotification {
  type: "LOBBY_MISSED";
  lobbyId: string;
  /** Joueur qui ne s'est pas présenté (null si indéterminé). */
  absentPlayerId: string | null;
  /** OPPONENT_OFFLINE, PLAYER_OFFLINE… */
  reason: string;
}

export type LobbyNotification =
  | LobbyCreatedNotification
  | LobbyJoinedNotification
  | LobbyDeclinedNotification
  | LobbyCompletedNotification
  | LobbyCancelledNotification
  | LobbyExpiredNotification
  | LobbyFailedNotification
  | LobbyRoomEnteredNotification
  | LobbyLeftNotification
  | LobbyAllPlayersPresentNotification
  | LobbyMissedNotification;

/* ───────────────────────── Matchmaking (public) ───────────────── */

export type MatchmakingNotificationType =
  | "SEARCHING"
  | "MATCHED"
  | "CANCELLED"
  | "FAILED";

export interface MatchmakingSearchingNotification {
  type: "SEARCHING";
  ticketId: string;
  topicId: string;
}

export interface MatchmakingMatchedNotification {
  type: "MATCHED";
  ticketId: string;
  gameId: string;
  opponentId: string | null;
  vsBot: boolean;
}

export interface MatchmakingCancelledNotification {
  type: "CANCELLED";
  ticketId: string;
}

export interface MatchmakingFailedNotification {
  type: "FAILED";
  ticketId: string;
  reason: string;
}

export type MatchmakingNotification =
  | MatchmakingSearchingNotification
  | MatchmakingMatchedNotification
  | MatchmakingCancelledNotification
  | MatchmakingFailedNotification;

/* ───────────────────── Notifications personnelles ─────────────────── */

/** Type d'une notification d'inbox (contrat BFF `NotificationView`). */
export type NotificationType =
  | "FOLLOW"
  | "CHALLENGE_RECEIVED"
  | "CHALLENGE_DECLINED"
  | "LOBBY_INVITATION"
  | "LOBBY_ACCEPTED"
  | "LOBBY_DECLINED"
  | "LOBBY_CANCELLED"
  | "LOBBY_EXPIRED"
  | "LOBBY_MISSED";

/** Vue d'une notification personnelle (REST + push `/topic/notifications/{userId}`). */
export interface NotificationView {
  notificationId: string;
  type: NotificationType;
  actorId: string | null;
  sourceId: string | null;
  topicId: string | null;
  gameId: string | null;
  expiresAt: string | null;
  readAt: string | null;
  createdAt: string;
}

/** Payload du push WS `NOTIFICATION_DELETED` : l'inbox retire la ligne et le compteur. */
export interface NotificationDeletedPayload {
  notificationId: string;
}

export type NotificationCategory = "FOLLOW" | "LOBBY";

export interface NotificationPreferenceView {
  category: NotificationCategory;
  enabled: boolean;
}
