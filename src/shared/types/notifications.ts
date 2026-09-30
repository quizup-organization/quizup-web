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
  | "GAME_STARTED"
  | "ROUND_STARTED"
  | "QUESTION_REVEALED"
  | "PLAYER_ANSWERED"
  | "ROUND_CLOSED"
  | "GAME_ENDED"
  | "GAME_RUN_RECORDED"
  | "GAME_CANCELLED";

export interface GameCreatedNotification {
  type: "GAME_CREATED";
  gameId: string;
  topicId: string;
  player1Id: string;
  player1Name: string | null;
  player2Id: string | null;
  player2Name: string | null;
  player2Type: string | null;
  mode: string | null;
  botDifficulty: string | null;
}

export interface PlayerJoinedNotification {
  type: "PLAYER_JOINED";
  gameId: string;
  playerId: string;
}

export interface GameStartedNotification {
  type: "GAME_STARTED";
  gameId: string;
  mode: string;
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

export interface GameEndedNotification {
  type: "GAME_ENDED";
  gameId: string;
  winnerId: string | null;
  player1FinalScore: number;
  player2FinalScore: number;
}

export interface GameRunRecordedNotification {
  type: "GAME_RUN_RECORDED";
  gameId: string;
  playerId: string;
  score: number;
}

export interface GameCancelledNotification {
  type: "GAME_CANCELLED";
  gameId: string;
  reason: string;
}

export type GameNotification =
  | GameCreatedNotification
  | PlayerJoinedNotification
  | GameStartedNotification
  | RoundStartedNotification
  | QuestionRevealedNotification
  | PlayerAnsweredNotification
  | RoundClosedNotification
  | GameEndedNotification
  | GameRunRecordedNotification
  | GameCancelledNotification;

/* ───────────────────────── Matchmaking ticket ─────────────────── */

export type TicketNotificationType = "SEARCHING" | "MATCHED" | "CANCELLED";

export interface TicketSearchingNotification {
  type: "SEARCHING";
  ticketId: string;
  topicId: string;
}

export interface TicketMatchedNotification {
  type: "MATCHED";
  ticketId: string;
  gameId: string;
  initiatorId: string;
  challengerId: string;
  vsBot: boolean;
}

export interface TicketCancelledNotification {
  type: "CANCELLED";
  ticketId: string;
}

export type TicketNotification =
  | TicketSearchingNotification
  | TicketMatchedNotification
  | TicketCancelledNotification;
