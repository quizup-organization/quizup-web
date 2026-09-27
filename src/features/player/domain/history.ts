import type { TopicRef } from "@/features/topics/domain/topic";
import type { UserRef } from "./profile";

/** Mode de jeu (enum backend `GameMode`). */
export type GameMode = "SYNC" | "ASYNC";

/** Issue d'un duel vue par le joueur consulté (`GameHistoryItemView.Outcome`). */
export type GameOutcome = "WIN" | "LOSS" | "DRAW" | "PENDING";

/** Ligne d'historique d'un duel (`GameHistoryItemView`). */
export interface GameHistoryItem {
  gameId: string;
  topic: TopicRef;
  opponent: UserRef | null;
  opponentType: string | null;
  mode: GameMode;
  outcome: GameOutcome;
  myScore: number;
  opponentScore: number;
  xp: number | null;
  playedAt: string;
}

/** Bilan des duels communs entre deux joueurs (`HeadToHeadView`). */
export interface HeadToHead {
  played: number;
  wins: number;
  losses: number;
  draws: number;
}
