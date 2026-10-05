import type { TopicRef } from "@/features/topics/domain/topic";
import type { UserRef } from "@/features/player/domain/profile";

/** Choix de réponse à une question (enum backend `GameQuestionChoice`). */
export type GameChoice = "A" | "B" | "C" | "D";

/** Difficulté d'un bot (enum backend `BotDifficulty`). */
export type BotDifficulty = "EASY" | "NORMAL" | "HARD";

/** Corps de `POST /api/games` (`CreateGameRequest`) — duel contre un bot uniquement. */
export interface CreateGameInput {
  topicId: string;
  difficulty?: BotDifficulty;
}

export type GamePlayerType = "HUMAN" | "BOT";

export type CurrentGameStatus = "CREATED" | "READY" | "IN_PROGRESS";

/**
 * Partie en attente/en cours du joueur (`CurrentGameView`) — bannière « Rejoindre ».
 * `opponent` vaut `null` pour un duel contre le bot.
 */
export interface CurrentGameView {
  gameId: string;
  topic: TopicRef;
  opponent: UserRef | null;
  opponentType: GamePlayerType;
  status: CurrentGameStatus;
  createdAt: string;
}

/** Récompense d'un duel terminé (`GameResultView.reward`) — `null` tant qu'elle est calculée. */
export interface GameResultReward {
  xp: number;
  victoryBonus: number;
}

/**
 * Vue de résultat d'un duel (`GET /api/games/{gameId}/result`) : bilan autoritaire de la partie
 * et progression du joueur après récompense. `reward` arrive après la projection (poll court).
 */
export interface GameResultView {
  myScore: number;
  opponentScore: number;
  winnerId: string | null;
  botGame: boolean;
  basePoints: number;
  speedBonus: number;
  correctAnswers: number;
  fastAnswers: number;
  answeredRounds: number;
  totalRounds: number;
  reward: GameResultReward | null;
  progression: {
    xpTotal: number;
    level: number;
    title: string;
    xpForNextLevel: number;
    /** Progression dans le palier courant (0–100), calculée par le BFF. */
    levelProgressPercent: number;
  };
}
