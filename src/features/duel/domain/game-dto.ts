import type { BotDifficulty } from "@/shared/types/api";

/**
 * DTOs REST d'une partie (contrat partagé entre features), alignés sur `quizup-game`.
 * Les read models client (`GameState`/`Lobby`) vivent dans `domain/game.ts` et `domain/lobby.ts`.
 */
export type GameStatus =
  | "CREATED"
  | "READY"
  | "IN_PROGRESS"
  | "AWAITING_OPPONENT"
  | "FINISHED"
  | "CANCELED";

export type GameMode = "SYNC" | "ASYNC";
export type GamePlayerType = "HUMAN" | "BOT" | "GHOST";
export type GameRoundStatus =
  | "CREATED"
  | "QUESTION_SHOWN"
  | "ANSWERABLE"
  | "CLOSED";
export type GameRoundType =
  | "ROUND_1"
  | "ROUND_2"
  | "ROUND_3"
  | "ROUND_4"
  | "ROUND_5"
  | "ROUND_6"
  | "ROUND_7";
export type GameChoice = "A" | "B" | "C" | "D";

export interface GameRound {
  round: GameRoundType;
  questionId: string;
  questionText: string;
  status: GameRoundStatus;
  player1Choice: GameChoice | null;
  player1Points: number;
  player1TimeMs: number | null;
  player2Choice: GameChoice | null;
  player2Points: number;
  player2TimeMs: number | null;
  correctAnswer: GameChoice | null;
  revealedAt: string | null;
  answerDeadlineAt: string | null;
}

export interface Game {
  gameId: string;
  topicId: string;
  player1Id: string;
  player1Name: string;
  player2Id: string | null;
  player2Name: string | null;
  mode: GameMode;
  opponent: GamePlayerType;
  botDifficulty: BotDifficulty | null;
  status: GameStatus;
  player1Score: number;
  player2Score: number;
  winnerId: string | null;
  createdAt: string;
  startedAt: string | null;
  endedAt: string | null;
  rounds: GameRound[];
}
